<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use phpseclib4\Net\SSH2;
use phpseclib4\Crypt\PublicKeyLoader;
use Illuminate\Support\Facades\Log;
use App\Models\Project;
use Inertia\Inertia;

class VpsConnectionController extends Controller
{
    /**
     * Connect to remote VPS and scan existing directories/projects.
     */
    /**
     * Connect to remote VPS and scan existing directories/projects.
     */
    public function connect(Request $request)
    {
        $validated = $request->validate([
            'os' => 'nullable|string|in:linux,windows',
            'ip' => 'required|string',
            'port' => 'nullable|numeric|min:1|max:65535',
            'user' => 'required|string',
            'auth_method' => 'nullable|string|in:auto,key,password',
            'password' => 'nullable|string',
            'key_path' => 'nullable|string',
            'key_content' => 'nullable|string',
            'key_passphrase' => 'nullable|string',
        ]);

        @set_time_limit(120);

        $ip = trim($validated['ip']);
        $port = !empty($validated['port']) ? (int) $validated['port'] : 22;
        $user = trim($validated['user']);
        $authMethod = $validated['auth_method'] ?? 'auto';
        $osType = $validated['os'] ?? 'linux';
        $passphrase = $validated['key_passphrase'] ?? null;

        $displayCmd = $port === 22 ? "ssh {$user}@{$ip}" : "ssh -p {$port} {$user}@{$ip}";
        $executedCommands = [];

        try {
            // Initialize phpseclib SSH2 connection with a 10s timeout
            $ssh = new SSH2($ip, $port, 10);
            $authenticated = false;
            $activeKeyPath = null;
            $lastError = null;

            // 1. Try Key-based authentication (either explicit key or auto-detected default key)
            if ($authMethod === 'auto' || $authMethod === 'key') {
                $resolvedKey = $this->resolveSshKey($validated['key_path'] ?? null, $validated['key_content'] ?? null);

                if ($resolvedKey) {
                    $activeKeyPath = $resolvedKey['path'];
                    $keyContent = $resolvedKey['content'];

                    try {
                        $key = PublicKeyLoader::load($keyContent, !empty($passphrase) ? $passphrase : null);
                    } catch (\phpseclib4\Exception\PasswordNeededException $e) {
                        return response()->json([
                            'success' => false,
                            'requires_passphrase' => true,
                            'key_path' => $resolvedKey['path'],
                            'key_name' => basename($resolvedKey['path']),
                            'message' => "Enter passphrase for key '{$resolvedKey['path']}':",
                            'commands' => [
                                [
                                    'time' => date('H:i:s'),
                                    'cmd' => $displayCmd,
                                    'status' => 'prompt',
                                    'output' => "Auto-detected key: {$resolvedKey['path']}\nEnter passphrase for key '{$resolvedKey['path']}':"
                                ]
                            ]
                        ], 401);
                    } catch (\Throwable $e) {
                        // If passphrase was provided or key could not be decrypted
                        if (!empty($passphrase)) {
                            return response()->json([
                                'success' => false,
                                'requires_passphrase' => true,
                                'key_path' => $resolvedKey['path'],
                                'key_name' => basename($resolvedKey['path']),
                                'message' => "Incorrect passphrase for key '{$resolvedKey['path']}'. Please try again.",
                                'commands' => [
                                    [
                                        'time' => date('H:i:s'),
                                        'cmd' => $displayCmd,
                                        'status' => 'failed',
                                        'output' => "Incorrect passphrase for key '{$resolvedKey['path']}'."
                                    ]
                                ]
                            ], 401);
                        }

                        return response()->json([
                            'success' => false,
                            'requires_passphrase' => true,
                            'key_path' => $resolvedKey['path'],
                            'key_name' => basename($resolvedKey['path']),
                            'message' => "Enter passphrase for key '{$resolvedKey['path']}':",
                            'commands' => [
                                [
                                    'time' => date('H:i:s'),
                                    'cmd' => $displayCmd,
                                    'status' => 'prompt',
                                    'output' => "Key is password-protected. Enter passphrase for key '{$resolvedKey['path']}':"
                                ]
                            ]
                        ], 401);
                    }

                    if (isset($key)) {
                        if ($ssh->login($user, $key)) {
                            $authenticated = true;
                            $authMethod = 'key';
                        } else {
                            $lastError = $ssh->getLastError() ?: 'Public key authentication rejected by remote server.';
                        }
                    }
                } elseif ($authMethod === 'key') {
                    return response()->json([
                        'success' => false,
                        'message' => 'No SSH private key found in ~/.ssh/ (id_ed25519, id_rsa) and none was specified.',
                        'commands' => [
                            [
                                'time' => date('H:i:s'),
                                'cmd' => $displayCmd,
                                'status' => 'failed',
                                'output' => 'No default SSH key found in ~/.ssh/'
                            ]
                        ]
                    ], 422);
                }
            }

            // 2. If not authenticated and password is provided (or explicit password method)
            if (!$authenticated && (!empty($validated['password']) || $authMethod === 'password')) {
                $password = $validated['password'] ?? '';
                if ($password === '') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Password is required when using password authentication.',
                    ], 422);
                }

                if ($ssh->login($user, $password)) {
                    $authenticated = true;
                    $authMethod = 'password';
                } else {
                    $lastError = $ssh->getLastError() ?: 'Password rejected by remote server.';
                }
            }

            if (!$authenticated) {
                $errorMsg = $lastError ?: 'Authentication rejected by remote host.';
                return response()->json([
                    'success' => false,
                    'message' => "SSH authentication failed for {$user}@{$ip}: {$errorMsg}",
                    'failed_command' => $displayCmd,
                    'commands' => [
                        [
                            'time' => date('H:i:s'),
                            'cmd' => $displayCmd,
                            'status' => 'failed',
                            'output' => "Auth failed: {$errorMsg}"
                        ]
                    ]
                ], 401);
            }

            // Successfully authenticated! Now query the real server for details and folders.
            $osInfo = 'Linux Server';
            $folders = [];
            $executedCommands = [];

            $connectCmd = "ssh -p {$port} " . ($authMethod === 'key' ? "-i " . ($validated['key_path'] ?? '~/.ssh/id_rsa') . " " : "") . "{$user}@{$ip}";
            $executedCommands[] = [
                'time' => date('H:i:s'),
                'cmd' => $connectCmd,
                'status' => 'success',
                'output' => "Connected to {$ip}:{$port}. SSH-2.0 channel established."
            ];

            if ($osType === 'linux') {
                // Determine OS distribution name
                $osRaw = $ssh->exec("cat /etc/os-release 2>/dev/null | grep '^PRETTY_NAME=' | cut -d= -f2 | tr -d '\"'");
                if ($osRaw && trim($osRaw) !== '') {
                    $osInfo = trim($osRaw);
                } else {
                    $uname = $ssh->exec("uname -s -r 2>/dev/null");
                    $osInfo = trim($uname) ?: 'Ubuntu Linux';
                }

                $executedCommands[] = [
                    'time' => date('H:i:s'),
                    'cmd' => "cat /etc/os-release | grep PRETTY_NAME",
                    'status' => 'success',
                    'output' => "Remote OS detected: {$osInfo}"
                ];

                // Scan /var/www, /home, and user home directory for actual projects
                $scanScript = <<<'BASH'
for base in /var/www /home/* /root; do
  if [ -d "$base" ]; then
    for dir in "$base"/*; do
      if [ -d "$dir" ] && [ ! -L "$dir" ]; then
        bname=$(basename "$dir")
        case "$bname" in
          html|lost+found|.cache|.local|.config|snap|mail) continue ;;
        esac
        
        fw="Standard"
        if [ -f "$dir/artisan" ]; then
          # Dynamically detect Laravel version from artisan or composer.json
          lv=$(php "$dir/artisan" --version 2>/dev/null | head -n 1 | sed -e 's/Laravel Framework[[:space:]]*/Laravel /' | tr -d '\r\n|')
          if [ -n "$lv" ]; then
            fw="$lv"
          elif [ -f "$dir/composer.json" ]; then
            lv_ver=$(grep -E '"laravel/framework":' "$dir/composer.json" 2>/dev/null | head -n 1 | cut -d: -f2 | tr -d '",^~ ' | tr -d '\r\n')
            if [ -n "$lv_ver" ]; then
              fw="Laravel $lv_ver"
            else
              fw="Laravel"
            fi
          else
            fw="Laravel"
          fi
        elif [ -f "$dir/package.json" ]; then
          fw="Node.js"
        elif [ -f "$dir/requirements.txt" ] || [ -f "$dir/manage.py" ]; then
          fw="Python"
        elif [ -f "$dir/index.php" ]; then
          fw="PHP Web"
        elif [ -f "$dir/index.html" ]; then
          fw="Static HTML"
        fi
        
        branch=""
        commit=""
        commitMsg=""
        if [ -d "$dir/.git" ]; then
          branch=$(git -C "$dir" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
          commit=$(git -C "$dir" rev-parse --short HEAD 2>/dev/null || echo "")
          commitMsg=$(git -C "$dir" log -1 --pretty=%B 2>/dev/null | head -n 1 | tr -d '\r\n|' || echo "")
        fi

        # Detect real live domain configured for this directory across all frameworks & web servers
        dom=""
        for envf in "$dir/.env" "$dir/.env.production" "$dir/.env.local"; do
          if [ -f "$envf" ]; then
            raw_url=$(grep -E '^[[:space:]]*(APP_URL|NEXT_PUBLIC_APP_URL|PUBLIC_URL|SITE_URL|URL|WP_HOME|WP_SITEURL)=' "$envf" 2>/dev/null | head -n 1 | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d '\r' | tr -d ' ')
            if [ -n "$raw_url" ] && [ "$raw_url" != "http://localhost" ] && [ "$raw_url" != "http://localhost:8000" ] && [ "$raw_url" != "http://localhost:3000" ] && [ "$raw_url" != "http://127.0.0.1" ]; then
              dom=$(echo "$raw_url" | sed -e 's|^[^/]*//||' -e 's|/.*$||')
              [ -n "$dom" ] && break
            fi
          fi
        done

        # Check Nginx server blocks matching root or directory
        if [ -z "$dom" ]; then
          dom=$(awk -v d="$dir" '
            /server[[:space:]]*\{/ { in_s=1; s_name=""; has_d=0; }
            in_s && /server_name[[:space:]]+/ {
              sub(/^[[:space:]]*server_name[[:space:]]+/, "");
              sub(/;.*$/, "");
              for (i=1; i<=NF; i++) {
                if ($i != "_" && $i != "localhost" && $i !~ /^www\./) {
                  s_name=$i;
                  break;
                }
              }
            }
            in_s && index($0, d) > 0 { has_d=1; }
            in_s && /^[[:space:]]*\}/ {
              if (has_d && s_name != "") {
                print s_name;
                exit;
              }
              in_s=0;
            }
          ' /etc/nginx/sites-enabled/* /etc/nginx/sites-available/* /etc/nginx/conf.d/* 2>/dev/null)
        fi

        # Check Apache virtual hosts
        if [ -z "$dom" ]; then
          for aconf in /etc/apache2/sites-enabled/* /etc/apache2/sites-available/* /etc/httpd/conf.d/*; do
            if [ -f "$aconf" ] && grep -q "$dir" "$aconf" 2>/dev/null; then
              sn=$(grep -E '^[[:space:]]*ServerName[[:space:]]+' "$aconf" 2>/dev/null | head -n 1 | awk '{print $2}')
              if [ -n "$sn" ] && [ "$sn" != "localhost" ]; then
                dom="$sn"
                break
              fi
            fi
          done
        fi
        
        echo "RHAMIFY_DIR|$bname|$dir|$fw|$branch|$commit|$commitMsg|$dom"
      fi
    done
  fi
done
BASH;

                $output = $ssh->exec($scanScript);
                $lines = explode("\n", (string) $output);

                foreach ($lines as $line) {
                    $line = trim($line);
                    if (str_starts_with($line, 'RHAMIFY_DIR|')) {
                        $parts = explode('|', $line);
                        if (count($parts) >= 7) {
                            $name = $parts[1];
                            $path = $parts[2];
                            $framework = $parts[3];
                            $branch = $parts[4];
                            $commit = $parts[5];
                            $msg = $parts[6];
                            $detectedDomain = !empty($parts[7]) ? trim($parts[7]) : '';
                            $domain = !empty($detectedDomain) ? $detectedDomain : $ip;

                            $folders[] = [
                                'id' => 'real-' . md5($path),
                                'name' => $name,
                                'path' => $path,
                                'framework' => $framework,
                                'type' => str_contains(strtolower($framework), 'laravel') ? 'laravel' : (str_contains(strtolower($framework), 'node') ? 'node' : 'static'),
                                'branch' => $branch ?: 'main',
                                'commit' => $commit ?: 'live',
                                'commitMessage' => $msg ?: 'Live directory on ' . $ip,
                                'lastUpdated' => 'Live Node',
                                'domain' => $domain,
                                'description' => "Verified directory on {$ip} ({$framework})",
                            ];
                        }
                    }
                }

                $executedCommands[] = [
                    'time' => date('H:i:s'),
                    'cmd' => "find /var/www /home/* /root -maxdepth 2 -type d",
                    'status' => 'success',
                    'output' => count($folders) . " project director" . (count($folders) === 1 ? "y" : "ies") . " discovered on host"
                ];
            } else {
                // Windows Server over OpenSSH
                $winOs = $ssh->exec('systeminfo | findstr /B /C:"OS Name"');
                if ($winOs && trim($winOs) !== '') {
                    $osInfo = trim(str_replace('OS Name:', '', $winOs));
                } else {
                    $osInfo = 'Windows Server';
                }

                $executedCommands[] = [
                    'time' => date('H:i:s'),
                    'cmd' => 'systeminfo | findstr /B /C:"OS Name"',
                    'status' => 'success',
                    'output' => "Remote OS detected: {$osInfo}"
                ];

                $output = $ssh->exec('powershell -Command "Get-ChildItem -Directory C:\inetpub\wwwroot | ForEach-Object { $_.Name + \'|\' + $_.FullName }"');
                $lines = explode("\n", (string) $output);
                foreach ($lines as $line) {
                    $line = trim($line);
                    if (str_contains($line, '|')) {
                        [$name, $path] = explode('|', $line, 2);
                        $folders[] = [
                            'id' => 'win-' . md5($path),
                            'name' => trim($name),
                            'path' => trim($path),
                            'framework' => 'IIS Web Application',
                            'type' => 'windows',
                            'branch' => 'main',
                            'commit' => 'live',
                            'commitMessage' => 'Live IIS directory',
                            'lastUpdated' => 'Live Node',
                            'domain' => $ip,
                            'description' => "Windows IIS directory at {$path}",
                        ];
                    }
                }

                $executedCommands[] = [
                    'time' => date('H:i:s'),
                    'cmd' => 'powershell -Command "Get-ChildItem -Directory C:\inetpub\wwwroot"',
                    'status' => 'success',
                    'output' => count($folders) . " IIS web director" . (count($folders) === 1 ? "y" : "ies") . " discovered"
                ];
            }

            return response()->json([
                'success' => true,
                'message' => "Successfully connected to {$user}@{$ip}:{$port}",
                'server' => [
                    'name' => ($user !== 'root' ? "{$user}-vps" : "vps-{$ip}"),
                    'ip' => $ip,
                    'port' => (string) $port,
                    'user' => $user,
                    'os' => $osInfo,
                    'type' => $osType,
                    'auth_method' => $authMethod,
                    'key_path' => $activeKeyPath,
                    'status' => 'Online & Synced',
                ],
                'folders' => $folders,
                'commands' => $executedCommands,
            ]);

        } catch (\Throwable $e) {
            Log::error("SSH Connection Error to {$user}@{$ip}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
                'commands' => [
                    [
                        'time' => date('H:i:s'),
                        'cmd' => $displayCmd,
                        'status' => 'failed',
                        'output' => $e->getMessage()
                    ]
                ]
            ], 500);
        }
    }

    /**
     * Create directory / project on remote VPS
     */
    public function createProject(Request $request)
    {
        $validated = $request->validate([
            'ip' => 'required|string',
            'port' => 'required|numeric',
            'user' => 'required|string',
            'auth_method' => 'nullable|string|in:auto,key,password',
            'password' => 'nullable|string',
            'key_path' => 'nullable|string',
            'key_content' => 'nullable|string',
            'key_passphrase' => 'nullable|string',
            'project_name' => 'required|string',
            'project_path' => 'required|string',
            'framework' => 'nullable|string',
            'git_url' => 'nullable|string',
        ]);

        $ip = trim($validated['ip']);
        $port = (int) $validated['port'];
        $user = trim($validated['user']);
        $authMethod = $validated['auth_method'] ?? 'auto';
        $passphrase = $validated['key_passphrase'] ?? null;
        $path = escapeshellarg(trim($validated['project_path']));
        $gitUrl = !empty($validated['git_url']) ? escapeshellarg(trim($validated['git_url'])) : null;

        try {
            $ssh = new SSH2($ip, $port, 10);
            $authenticated = false;

            if ($authMethod === 'auto' || $authMethod === 'key') {
                $resolvedKey = $this->resolveSshKey($validated['key_path'] ?? null, $validated['key_content'] ?? null);
                if ($resolvedKey) {
                    $key = PublicKeyLoader::load($resolvedKey['content'], !empty($passphrase) ? $passphrase : null);
                    if ($ssh->login($user, $key)) {
                        $authenticated = true;
                    }
                }
            }

            if (!$authenticated && (!empty($validated['password']) || $authMethod === 'password')) {
                if ($ssh->login($user, $validated['password'] ?? '')) {
                    $authenticated = true;
                }
            }

            if (!$authenticated) {
                return response()->json(['success' => false, 'message' => 'SSH authentication failed when creating project'], 401);
            }

            // Execute project initialization
            if ($gitUrl) {
                $cmd = "mkdir -p $(dirname {$path}) && git clone {$gitUrl} {$path}";
            } else {
                $cmd = "mkdir -p {$path}";
            }

            $execOutput = $ssh->exec($cmd);

            return response()->json([
                'success' => true,
                'message' => "Successfully created project directory on {$ip} at {$validated['project_path']}",
                'output' => $execOutput,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to initialize project: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Render the Dashboard with user's persisted projects.
     */
    public function dashboard(Request $request)
    {
        $projects = Project::where('user_id', auth()->id())
            ->orderByDesc('last_visited_timestamp')
            ->orderByDesc('updated_at')
            ->get();

        return Inertia::render('Dashboard', [
            'initialProjects' => $projects,
        ]);
    }

    /**
     * Get all persisted projects for current user.
     */
    public function getProjects(Request $request)
    {
        $projects = Project::where('user_id', auth()->id())
            ->orderByDesc('last_visited_timestamp')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'success' => true,
            'projects' => $projects,
        ]);
    }

    /**
     * Store or update a project linked to a server.
     */
    public function storeProject(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'ip' => 'required|string',
            'port' => 'nullable|numeric|min:1|max:65535',
            'user' => 'nullable|string',
            'auth_method' => 'nullable|string',
            'password' => 'nullable|string',
            'key_path' => 'nullable|string',
            'key_content' => 'nullable|string',
            'key_passphrase' => 'nullable|string',
            'os' => 'nullable|string',
            'type' => 'nullable|string',
            'branch' => 'nullable|string',
            'commit' => 'nullable|string',
            'commit_message' => 'nullable|string',
            'last_deploy_time' => 'nullable|string',
            'deploy_duration' => 'nullable|string',
            'domain' => 'nullable|string',
            'path' => 'nullable|string',
            'framework' => 'nullable|string',
            'git_url' => 'nullable|string',
            'is_connected' => 'nullable|boolean',
        ]);

        $project = Project::where('user_id', auth()->id())
            ->where('ip', $validated['ip'])
            ->where('path', $validated['path'] ?? '')
            ->first();

        $dom = !empty($validated['domain']) ? trim($validated['domain']) : null;
        if ($dom && str_contains($dom, 'nip.io')) {
            $dom = null;
        }

        $data = [
            'user_id' => auth()->id(),
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'ip' => $validated['ip'],
            'port' => !empty($validated['port']) ? (int) $validated['port'] : 22,
            'user' => $validated['user'] ?? 'root',
            'auth_method' => $validated['auth_method'] ?? 'auto',
            'os' => $validated['os'] ?? 'Linux Server',
            'type' => $validated['type'] ?? 'linux',
            'branch' => $validated['branch'] ?? 'main',
            'commit' => $validated['commit'] ?? 'live',
            'commit_message' => $validated['commit_message'] ?? null,
            'last_deploy_time' => $validated['last_deploy_time'] ?? 'Linked just now',
            'deploy_duration' => $validated['deploy_duration'] ?? '—',
            'domain' => $dom,
            'path' => $validated['path'] ?? null,
            'framework' => $validated['framework'] ?? 'Web App',
            'git_url' => $validated['git_url'] ?? null,
            'is_connected' => true,
            'auth_status' => 'authenticated',
            'last_auth_check_at' => now(),
            'last_visited_timestamp' => round(microtime(true) * 1000),
        ];

        if (!empty($validated['password'])) {
            $data['password'] = $validated['password'];
        }
        if (!empty($validated['key_path'])) {
            $data['key_path'] = $validated['key_path'];
        }
        if (!empty($validated['key_content'])) {
            $data['key_content'] = $validated['key_content'];
        }
        if (!empty($validated['key_passphrase'])) {
            $data['key_passphrase'] = $validated['key_passphrase'];
        }

        if ($project) {
            $project->update($data);
        } else {
            $project = Project::create($data);
        }

        // If domain is not yet detected, immediately run performAuthCheck to probe real live domain from server
        if (empty($project->domain) || $project->domain === $project->ip) {
            try {
                $this->performAuthCheck($project);
            } catch (\Throwable $e) {}
        }

        return response()->json([
            'success' => true,
            'message' => "Project '{$project->name}' saved to dashboard database.",
            'project' => $project->fresh(),
        ]);
    }

    /**
     * Delete a project from dashboard database.
     */
    public function destroyProject(Request $request, $id)
    {
        $project = Project::where('user_id', auth()->id())->where('id', $id)->first();
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found.'], 404);
        }

        $name = $project->name;
        $project->delete();

        return response()->json([
            'success' => true,
            'message' => "Project '{$name}' deleted from dashboard.",
        ]);
    }

    /**
     * Check real server authentication and connectivity for a single project.
     */
    public function checkProjectAuth(Request $request, $id)
    {
        $project = Project::where('user_id', auth()->id())->where('id', $id)->first();
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found.'], 404);
        }

        $result = $this->performAuthCheck($project);

        return response()->json([
            'success' => $result['success'],
            'project' => $project->fresh(),
            'message' => $result['message'],
            'latency_ms' => $result['latency_ms'] ?? null,
        ]);
    }

    /**
     * Batch check real server authentication for all user projects.
     */
    public function checkAllProjectsAuth(Request $request)
    {
        $projects = Project::where('user_id', auth()->id())->get();
        $results = [];

        foreach ($projects as $project) {
            $res = $this->performAuthCheck($project);
            $results[] = [
                'id' => $project->id,
                'name' => $project->name,
                'success' => $res['success'],
                'auth_status' => $project->auth_status,
                'latency_ms' => $res['latency_ms'] ?? null,
                'message' => $res['message'],
            ];
        }

        $updatedProjects = Project::where('user_id', auth()->id())
            ->orderByDesc('last_visited_timestamp')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'success' => true,
            'projects' => $updatedProjects,
            'summary' => $results,
        ]);
    }

    /**
     * Update server credentials for a project.
     */
    public function updateProjectCredentials(Request $request, $id)
    {
        $project = Project::where('user_id', auth()->id())->where('id', $id)->first();
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found.'], 404);
        }

        $validated = $request->validate([
            'user' => 'nullable|string',
            'auth_method' => 'nullable|string|in:auto,key,password',
            'password' => 'nullable|string',
            'key_path' => 'nullable|string',
            'key_content' => 'nullable|string',
            'key_passphrase' => 'nullable|string',
        ]);

        if (isset($validated['user'])) $project->user = $validated['user'];
        if (isset($validated['auth_method'])) $project->auth_method = $validated['auth_method'];
        if (isset($validated['password'])) $project->password = $validated['password'];
        if (isset($validated['key_path'])) $project->key_path = $validated['key_path'];
        if (isset($validated['key_content'])) $project->key_content = $validated['key_content'];
        if (isset($validated['key_passphrase'])) $project->key_passphrase = $validated['key_passphrase'];

        $project->save();

        // Immediately verify new credentials
        $authResult = $this->performAuthCheck($project);

        return response()->json([
            'success' => true,
            'message' => 'Project server credentials updated.',
            'project' => $project->fresh(),
            'auth_result' => $authResult,
        ]);
    }

    /**
     * Update project metadata such as live domain, name, or branch.
     */
    public function updateProject(Request $request, $id)
    {
        $project = Project::where('user_id', auth()->id())->where('id', $id)->first();
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found.'], 404);
        }

        $validated = $request->validate([
            'domain' => 'nullable|string|max:255',
            'name' => 'nullable|string|max:255',
            'branch' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:1000',
        ]);

        $project->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Project updated successfully.',
            'project' => $project->fresh(),
        ]);
    }

    /**
     * Probe server connection and verify authentication.
     */
    private function performAuthCheck(Project $project): array
    {
        $ip = trim($project->ip);
        $port = (int) ($project->port ?: 22);
        $user = trim($project->user ?: 'root');
        $startTime = microtime(true);

        try {
            $ssh = new SSH2($ip, $port, 8); // 8-second network timeout
            $authenticated = false;
            $lastError = null;

            // 1. Try Key-based
            if ($project->auth_method === 'key' || $project->auth_method === 'auto') {
                $resolvedKey = $this->resolveSshKey($project->key_path, $project->key_content);
                if ($resolvedKey) {
                    try {
                        $key = PublicKeyLoader::load($resolvedKey['content'], $project->key_passphrase ?: null);
                        if ($ssh->login($user, $key)) {
                            $authenticated = true;
                        } else {
                            $lastError = $ssh->getLastError() ?: 'Public key rejected.';
                        }
                    } catch (\Throwable $e) {
                        $lastError = 'Key load/passphrase error: ' . $e->getMessage();
                    }
                }
            }

            // 2. Try Password
            if (!$authenticated && (!empty($project->password) || $project->auth_method === 'password')) {
                if (!empty($project->password) && $ssh->login($user, $project->password)) {
                    $authenticated = true;
                } else {
                    $lastError = $ssh->getLastError() ?: 'Password rejected.';
                }
            }

            $latency = (int) round((microtime(true) - $startTime) * 1000);

            if ($authenticated) {
                // Quick remote check for uptime
                $uptimeRaw = $ssh->exec("uptime 2>/dev/null | awk -F'up ' '{print $2}' | awk -F',' '{print $1}'");
                $uptime = trim((string) $uptimeRaw);
                $msg = "SSH authentication verified" . ($uptime ? " (uptime: {$uptime})" : "");

                $updateData = [
                    'is_connected' => true,
                    'auth_status' => 'authenticated',
                    'latency_ms' => $latency,
                    'last_auth_check_at' => now(),
                    'last_auth_message' => $msg,
                ];

                // If path is configured on remote server, refresh real framework version, branch, commit, and commit message
                if (!empty($project->path)) {
                    $pPath = escapeshellarg($project->path);
                    $metaCheck = $ssh->exec("
                        dir={$pPath}
                        fw=''
                        if [ -f \"\$dir/artisan\" ]; then
                            fw=$(php \"\$dir/artisan\" --version 2>/dev/null | head -n 1 | sed -e 's/Laravel Framework[[:space:]]*/Laravel /' | tr -d '\r\n|')
                            if [ -z \"\$fw\" ] && [ -f \"\$dir/composer.json\" ]; then
                                lv_ver=$(grep -E '\"laravel/framework\":' \"\$dir/composer.json\" 2>/dev/null | head -n 1 | cut -d: -f2 | tr -d '\",^~ ' | tr -d '\r\n')
                                [ -n \"\$lv_ver\" ] && fw=\"Laravel \$lv_ver\"
                            fi
                        fi
                        cmt=$(git -C \"\$dir\" rev-parse --short HEAD 2>/dev/null || echo '')
                        cmsg=$(git -C \"\$dir\" log -1 --pretty=%B 2>/dev/null | head -n 1 | tr -d '\r\n|' || echo '')
                        cbranch=$(git -C \"\$dir\" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')

                        # Universal live domain probe across all frameworks and web servers
                        dom=''
                        for envf in \"\$dir/.env\" \"\$dir/.env.production\" \"\$dir/.env.local\"; do
                          if [ -f \"\$envf\" ]; then
                            raw_url=$(grep -E '^[[:space:]]*(APP_URL|NEXT_PUBLIC_APP_URL|PUBLIC_URL|SITE_URL|URL|WP_HOME|WP_SITEURL)=' \"\$envf\" 2>/dev/null | head -n 1 | cut -d= -f2- | tr -d '\"' | tr -d \"'\" | tr -d '\r' | tr -d ' ')
                            if [ -n \"\$raw_url\" ] && [ \"\$raw_url\" != \"http://localhost\" ] && [ \"\$raw_url\" != \"http://localhost:8000\" ] && [ \"\$raw_url\" != \"http://localhost:3000\" ] && [ \"\$raw_url\" != \"http://127.0.0.1\" ]; then
                              dom=$(echo \"\$raw_url\" | sed -e 's|^[^/]*//||' -e 's|/.*$||')
                              [ -n \"\$dom\" ] && break
                            fi
                          fi
                        done
                        if [ -z \"\$dom\" ]; then
                          dom=$(awk -v d=\"\$dir\" '
                            /server[[:space:]]*\{/ { in_s=1; s_name=\"\"; has_d=0; }
                            in_s && /server_name[[:space:]]+/ {
                              sub(/^[[:space:]]*server_name[[:space:]]+/, \"\");
                              sub(/;.*$/, \"\");
                              for (i=1; i<=NF; i++) {
                                if (\$i != \"_\" && \$i != \"localhost\" && \$i !~ /^www\./) {
                                  s_name=\$i;
                                  break;
                                }
                              }
                            }
                            in_s && index(\$0, d) > 0 { has_d=1; }
                            in_s && /^[[:space:]]*\}/ {
                              if (has_d && s_name != \"\") {
                                print s_name;
                                exit;
                              }
                              in_s=0;
                            }
                          ' /etc/nginx/sites-enabled/* /etc/nginx/sites-available/* /etc/nginx/conf.d/* 2>/dev/null)
                        fi

                        echo \"META|\$fw|\$cmt|\$cbranch|\$dom|\$cmsg\"
                    ");
                    if (preg_match('/META\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|(.*)/', (string)$metaCheck, $m)) {
                        $rfw = trim($m[1]);
                        $rcmt = trim($m[2]);
                        $rbr = trim($m[3]);
                        $rdom = trim($m[4]);
                        $rmsg = trim($m[5]);
                        if (!empty($rfw)) {
                            $updateData['framework'] = $rfw;
                            if (str_contains($project->description ?? '', 'Laravel 11')) {
                                $updateData['description'] = str_replace('Laravel 11', $rfw, $project->description);
                            }
                        }
                        if (!empty($rcmt)) $updateData['commit'] = $rcmt;
                        if (!empty($rbr)) $updateData['branch'] = $rbr;
                        if (!empty($rmsg)) $updateData['commit_message'] = $rmsg;
                        if (!empty($rdom) && (empty($project->domain) || str_contains($project->domain, 'nip.io') || $project->domain === $project->ip)) {
                            $updateData['domain'] = $rdom;
                        }
                    }
                }

                $project->update($updateData);

                return [
                    'success' => true,
                    'latency_ms' => $latency,
                    'message' => $msg,
                ];
            } else {
                $err = $lastError ?: 'Authentication rejected by server';
                $project->update([
                    'is_connected' => false,
                    'auth_status' => 'auth_failed',
                    'latency_ms' => null,
                    'last_auth_check_at' => now(),
                    'last_auth_message' => "Auth failed: {$err}",
                ]);

                return [
                    'success' => false,
                    'latency_ms' => null,
                    'message' => "Auth failed for {$user}@{$ip}: {$err}",
                ];
            }
        } catch (\Throwable $e) {
            $project->update([
                'is_connected' => false,
                'auth_status' => 'unreachable',
                'latency_ms' => null,
                'last_auth_check_at' => now(),
                'last_auth_message' => 'Server unreachable: ' . $e->getMessage(),
            ]);

            return [
                'success' => false,
                'latency_ms' => null,
                'message' => "Connection unreachable: " . $e->getMessage(),
            ];
        }
    }

    /**
     * Trigger real deployment on remote VPS
     */
    public function deployProject(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'nullable|integer',
            'ip' => 'nullable|string',
            'port' => 'nullable|numeric',
            'user' => 'nullable|string',
            'auth_method' => 'nullable|string|in:auto,key,password',
            'password' => 'nullable|string',
            'key_path' => 'nullable|string',
            'key_content' => 'nullable|string',
            'key_passphrase' => 'nullable|string',
            'project_path' => 'nullable|string',
            'branch' => 'nullable|string',
        ]);

        $project = null;
        if (!empty($validated['project_id'])) {
            $project = Project::where('user_id', auth()->id())->find($validated['project_id']);
        }

        $ip = trim($validated['ip'] ?? ($project ? $project->ip : ''));
        $port = (int) ($validated['port'] ?? ($project ? $project->port : 22));
        $user = trim($validated['user'] ?? ($project ? $project->user : 'root'));
        $authMethod = $validated['auth_method'] ?? ($project ? $project->auth_method : 'auto');
        $password = $validated['password'] ?? ($project ? $project->password : null);
        $keyPath = $validated['key_path'] ?? ($project ? $project->key_path : null);
        $keyContent = $validated['key_content'] ?? ($project ? $project->key_content : null);
        $passphrase = $validated['key_passphrase'] ?? ($project ? $project->key_passphrase : null);
        $path = trim($validated['project_path'] ?? ($project ? $project->path : ''));
        $branch = trim($validated['branch'] ?? ($project ? $project->branch : 'main'));
        $startTime = microtime(true);

        if (empty($ip) || empty($path)) {
            return response()->json([
                'success' => false,
                'message' => 'Missing IP address or project path for deployment.'
            ], 422);
        }

        try {
            $ssh = new SSH2($ip, $port, 15);
            $authenticated = false;

            if ($authMethod === 'auto' || $authMethod === 'key') {
                $resolvedKey = $this->resolveSshKey($keyPath, $keyContent);
                if ($resolvedKey) {
                    $key = PublicKeyLoader::load($resolvedKey['content'], !empty($passphrase) ? $passphrase : null);
                    if ($ssh->login($user, $key)) {
                        $authenticated = true;
                    }
                }
            }

            if (!$authenticated && (!empty($password) || $authMethod === 'password')) {
                if ($ssh->login($user, $password ?? '')) {
                    $authenticated = true;
                }
            }

            if (!$authenticated) {
                if ($project) {
                    $project->update([
                        'is_connected' => false,
                        'auth_status' => 'auth_failed',
                        'last_auth_check_at' => now(),
                        'last_auth_message' => "Deployment auth failed for {$user}@{$ip}",
                    ]);
                }
                return response()->json([
                    'success' => false,
                    'message' => "SSH authentication failed for {$user}@{$ip}. Please verify credentials or reconnect to server."
                ], 401);
            }

            $safePath = escapeshellarg($path);
            $safeBranch = escapeshellarg($branch);
            $outputLogs = [];

            // Check if git directory exists
            $isGit = trim((string) $ssh->exec("[ -d {$safePath}/.git ] && echo 'yes' || echo 'no'"));

            if ($isGit === 'yes') {
                $pullOutput = $ssh->exec("cd {$safePath} && git fetch origin 2>&1 && git checkout {$safeBranch} 2>&1 && git pull origin {$safeBranch} 2>&1");
                $outputLogs[] = "git pull: " . trim((string) $pullOutput);
                
                $commitInfo = trim((string) $ssh->exec("cd {$safePath} && git log -1 --pretty=format:'%h|%s' 2>/dev/null"));
                $parts = explode('|', $commitInfo, 2);
                $commitHash = !empty($parts[0]) ? $parts[0] : 'live';
                $commitMsg = !empty($parts[1]) ? $parts[1] : 'Pulled latest changes from ' . $branch;
            } else {
                $outputLogs[] = "Directory is not a git repository. Checked directory on host.";
                $commitHash = 'live';
                $commitMsg = 'Updated directory on ' . date('Y-m-d H:i:s');
            }

            // Check if Laravel project
            $isLaravel = trim((string) $ssh->exec("[ -f {$safePath}/artisan ] && echo 'yes' || echo 'no'"));
            if ($isLaravel === 'yes') {
                $artisanOutput = $ssh->exec("cd {$safePath} && php artisan optimize:clear 2>&1");
                $outputLogs[] = "artisan: " . trim((string) $artisanOutput);
            }

            $duration = round(microtime(true) - $startTime, 1) . 's';

            if ($project) {
                $project->update([
                    'commit' => $commitHash,
                    'commit_message' => $commitMsg,
                    'last_deploy_time' => 'Just now',
                    'deploy_duration' => $duration,
                    'is_connected' => true,
                    'auth_status' => 'authenticated',
                    'last_visited_timestamp' => round(microtime(true) * 1000),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => "Deployment completed in {$duration}",
                'commit' => $commitHash,
                'commit_message' => $commitMsg,
                'output' => implode("\n", $outputLogs),
                'deploy_duration' => $duration,
                'deploy_time' => 'Just now',
                'project' => $project ? $project->fresh() : null,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Deployment execution failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resolve SSH private key either from explicit content/path or by auto-probing ~/.ssh/
     */
    private function resolveSshKey(?string $keyPath, ?string $keyContent): ?array
    {
        if (!empty($keyContent)) {
            return [
                'path' => 'Uploaded Private Key',
                'content' => $keyContent,
                'is_auto' => false,
            ];
        }

        if (!empty($keyPath)) {
            $expanded = $this->expandHomePath(trim($keyPath));
            if (file_exists($expanded) && is_readable($expanded)) {
                return [
                    'path' => $keyPath,
                    'content' => file_get_contents($expanded),
                    'is_auto' => false,
                ];
            }
            return null;
        }

        // Auto-probe candidate keys in standard ~/.ssh/ directory
        $candidates = [
            '~/.ssh/id_ed25519',
            '~/.ssh/id_rsa',
            '~/.ssh/id_ecdsa',
            '~/.ssh/id_dsa',
        ];

        foreach ($candidates as $cand) {
            $expanded = $this->expandHomePath($cand);
            if (file_exists($expanded) && is_readable($expanded)) {
                return [
                    'path' => $cand,
                    'content' => file_get_contents($expanded),
                    'is_auto' => true,
                ];
            }
        }

        return null;
    }

    /**
     * Expand '~' to current user home directory across Windows and Linux
     */
    private function expandHomePath(string $path): string
    {
        if (str_starts_with($path, '~/') || $path === '~') {
            $home = getenv('HOME') ?: getenv('USERPROFILE') ?: '';
            $home = rtrim($home, "\\/");
            $sub = substr($path, 1);
            return $home . str_replace('/', DIRECTORY_SEPARATOR, $sub);
        }
        return $path;
    }
}
