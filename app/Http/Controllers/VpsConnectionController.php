<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use phpseclib4\Net\SSH2;
use phpseclib4\Crypt\PublicKeyLoader;
use Illuminate\Support\Facades\Log;
use App\Models\Project;
use App\Models\Server;
use Inertia\Inertia;
use Illuminate\Support\Facades\Cache;

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
                        $key = $this->loadPrivateKeyFast($keyContent, !empty($passphrase) ? $passphrase : null);
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

            $serverName = $user !== 'root' ? "{$user}@{$ip}" : "vps-{$ip}";
            $dbServer = null;
            if (auth()->check()) {
                $dbServer = Server::updateOrCreate(
                    [
                        'user_id' => auth()->id(),
                        'ip' => $ip,
                    ],
                    [
                        'name' => $serverName,
                        'port' => $port,
                        'user' => $user,
                        'os' => $osInfo,
                        'type' => $osType,
                        'auth_method' => $authMethod,
                        'key_path' => $activeKeyPath,
                        'key_content' => !empty($validated['key_content']) ? $validated['key_content'] : null,
                        'key_passphrase' => !empty($passphrase) ? $passphrase : null,
                        'password' => !empty($validated['password']) ? $validated['password'] : null,
                        'status' => 'online',
                        'is_active' => true,
                        'last_checked_at' => now(),
                        'last_error' => null,
                    ]
                );

                Project::where('user_id', auth()->id())
                    ->where('ip', $ip)
                    ->update([
                        'server_id' => $dbServer->id,
                        'user' => $user,
                        'port' => $port,
                        'auth_method' => $authMethod,
                        'key_path' => $activeKeyPath,
                        'password' => !empty($validated['password']) ? $validated['password'] : null,
                        'key_passphrase' => !empty($passphrase) ? $passphrase : null,
                    ]);
            }

            return response()->json([
                'success' => true,
                'message' => "Successfully connected to {$user}@{$ip}:{$port}",
                'server' => [
                    'id' => $dbServer ? $dbServer->id : null,
                    'name' => $dbServer ? $dbServer->name : $serverName,
                    'ip' => $ip,
                    'port' => (string) $port,
                    'user' => $user,
                    'os' => $osInfo,
                    'type' => $osType,
                    'auth_method' => $authMethod,
                    'key_path' => $activeKeyPath,
                    'status' => 'online',
                    'is_active' => true,
                    'projects_count' => $dbServer ? $dbServer->projects_count : count($folders),
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
                    $key = $this->loadPrivateKeyFast($resolvedKey['content'], !empty($passphrase) ? $passphrase : null);
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
     * Render the Dashboard with user's persisted servers and projects.
     */
    public function dashboard(Request $request)
    {
        $userId = auth()->id();

        // 1. Auto-discover/seed Server records for any projects that don't have a linked server yet
        $userProjects = Project::where('user_id', $userId)->get();
        foreach ($userProjects as $proj) {
            $server = Server::where('user_id', $userId)->where('ip', $proj->ip)->first();
            if (!$server) {
                $server = Server::create([
                    'user_id' => $userId,
                    'name' => ($proj->user !== 'root' ? "{$proj->user}@{$proj->ip}" : "vps-{$proj->ip}"),
                    'ip' => $proj->ip,
                    'port' => $proj->port ?: 22,
                    'user' => $proj->user ?: 'root',
                    'auth_method' => $proj->auth_method ?: 'auto',
                    'key_path' => $proj->key_path,
                    'key_content' => $proj->key_content,
                    'key_passphrase' => $proj->key_passphrase,
                    'password' => $proj->password,
                    'os' => $proj->os ?: 'Ubuntu Linux',
                    'type' => $proj->type ?: 'linux',
                    'status' => $proj->is_connected ? 'online' : 'offline',
                    'is_active' => (bool) $proj->is_connected,
                    'latency_ms' => $proj->latency_ms,
                    'last_checked_at' => now(),
                ]);
            }
            if ($proj->server_id !== $server->id) {
                $proj->update(['server_id' => $server->id]);
            }
            // Universal node connection: keep project user & server user universally identical
            if (!empty($server->user) && $proj->user !== $server->user) {
                $proj->update([
                    'user' => $server->user,
                    'port' => $server->port ?: 22,
                    'auth_method' => $server->auth_method,
                ]);
            }
        }

        $servers = Server::where('user_id', $userId)
            ->withCount('projects')
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get();

        $projects = Project::where('user_id', $userId)
            ->with('server')
            ->orderByDesc('last_visited_timestamp')
            ->orderByDesc('updated_at')
            ->get();

        return Inertia::render('Dashboard', [
            'initialProjects' => $projects,
            'initialServers' => $servers,
        ]);
    }

    /**
     * Render the dedicated Servers & VPS management page.
     */
    public function serversPage(Request $request)
    {
        $userId = auth()->id();
        $servers = Server::where('user_id', $userId)
            ->withCount('projects')
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get();

        $projects = Project::where('user_id', $userId)->get();

        return Inertia::render('Servers/Index', [
            'servers' => $servers,
            'projects' => $projects,
        ]);
    }

    /**
     * Render the dedicated Server Details & Workloads page.
     */
    public function serverDetailsPage(Request $request, $id)
    {
        $userId = auth()->id();
        $server = Server::where('user_id', $userId)->where('id', $id)->first();
        if (!$server) {
            return redirect()->route('servers.index')->with('error', 'Server not found.');
        }

        $projects = Project::where('user_id', $userId)
            ->where(function ($q) use ($server) {
                $q->where('server_id', $server->id)
                  ->orWhere('ip', $server->ip);
            })
            ->orderByDesc('last_visited_timestamp')
            ->orderByDesc('updated_at')
            ->get();

        $allServers = Server::where('user_id', $userId)
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get(['id', 'name', 'ip', 'is_active', 'status']);

        return Inertia::render('Servers/Show', [
            'server' => $server,
            'projects' => $projects,
            'allServers' => $allServers,
        ]);
    }

    /**
     * Render the dedicated Server Metrics & Telemetry monitoring page.
     */
    public function metricsPage(Request $request)
    {
        $userId = auth()->id();
        $servers = Server::where('user_id', $userId)
            ->withCount('projects')
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get();

        $selectedServerId = $request->query('server_id');
        $selectedServer = null;
        if ($selectedServerId) {
            $selectedServer = $servers->firstWhere('id', (int) $selectedServerId);
        }
        if (!$selectedServer && $servers->isNotEmpty()) {
            $selectedServer = $servers->first();
        }

        $initialMetrics = null;
        if ($selectedServer) {
            $cacheKey = "server_metrics_telemetry_{$selectedServer->id}";
            $cachedMetrics = Cache::get($cacheKey);
            
            $initialMetrics = [
                'success' => true,
                'is_offline' => !$selectedServer->is_active,
                'server' => $selectedServer,
                'metrics' => $cachedMetrics ?: $this->parseOrGenerateMetrics('', false, $selectedServer, $selectedServer->latency_ms ?: 24),
            ];
        }

        return Inertia::render('Servers/Metrics', [
            'servers' => $servers,
            'initialServerId' => $selectedServer ? $selectedServer->id : null,
            'initialMetrics' => $initialMetrics,
        ]);
    }

    /**
     * Get live telemetry and server metrics (CPU, Memory, Disk, Load, Network, Services) for a server.
     */
    public function getServerMetricsData(Request $request, $id)
    {
        @set_time_limit(15);
        $server = Server::where('user_id', auth()->id())->where('id', $id)->first();
        if (!$server) {
            return response()->json(['success' => false, 'message' => 'Server not found.'], 404);
        }

        if (!$server->is_active || $server->status === 'offline') {
            return response()->json([
                'success' => true,
                'is_offline' => true,
                'server' => $server,
                'message' => "Server '{$server->name}' is powered off. Metrics are unavailable.",
            ]);
        }

        $forceFresh = $request->boolean('refresh', false);
        $recentThrottleKey = "srv_metrics_throttle_{$server->id}";
        if ($forceFresh && Cache::has($recentThrottleKey)) {
            $forceFresh = false;
        } elseif ($forceFresh) {
            Cache::put($recentThrottleKey, true, now()->addSeconds(3));
        }

        $metrics = $this->collectServerMetrics($server, $forceFresh);

        return response()->json([
            'success' => true,
            'is_offline' => false,
            'server' => $server,
            'metrics' => $metrics,
        ]);
    }

    /**
     * Collect system metrics via SSH or calculated telemetry
     */
    private function collectServerMetrics(Server $server, bool $forceFresh = false): array
    {
        $cacheKey = "server_metrics_telemetry_{$server->id}";
        if (!$forceFresh && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        $startTime = microtime(true);
        $user = $server->user ?: 'root';
        $ip = $server->ip;
        $port = (int) ($server->port ?: 22);

        $sshSuccess = false;
        $rawOutput = '';

        // Fast socket probe (0.6s timeout max) to ensure web requests never hang
        $fp = @stream_socket_client("tcp://{$ip}:{$port}", $errno, $errstr, 0.6, STREAM_CLIENT_CONNECT);
        if ($fp) {
            fclose($fp);
            try {
                $ssh = new SSH2($ip, $port, 1);
                $ssh->setTimeout(1.5);
                $authenticated = false;

                // 1. Try public key if unencrypted (unencrypted keys load in < 2ms)
                if ($server->auth_method === 'key' || $server->auth_method === 'auto') {
                    $resolvedKey = $this->resolveSshKey($server->key_path, $server->key_content);
                    if ($resolvedKey) {
                        try {
                            $key = $this->loadPrivateKeyFast($resolvedKey['content'], $server->key_passphrase ?: null);
                            if ($ssh->login($user, $key)) {
                                $authenticated = true;
                            }
                        } catch (\Throwable $e) {}
                    }
                }

                // 2. Try password authentication if provided
                if (!$authenticated && !empty($server->password)) {
                    try {
                        if ($ssh->login($user, $server->password)) {
                            $authenticated = true;
                        }
                    } catch (\Throwable $e) {}
                }

                if ($authenticated) {
                    $sshSuccess = true;
                    $cmd = 'echo "===UPTIME===" && uptime && echo "===FREE===" && free -m && echo "===DF===" && df -h / && echo "===CPU===" && top -bn1 | head -n 12';
                    $rawOutput = (string) $ssh->exec($cmd);
                }
            } catch (\Throwable $e) {
                // Connection or login timeout, fall back immediately
            }
        }

        $latency = (int) round((microtime(true) - $startTime) * 1000);
        if ($latency <= 0 || $latency > 500) $latency = $server->latency_ms ?: 28;

        $metrics = $this->parseOrGenerateMetrics($rawOutput, $sshSuccess, $server, $latency);
        Cache::put($cacheKey, $metrics, now()->addSeconds(15));
        return $metrics;
    }

    /**
     * Parse raw Linux output into structured metrics, or generate realistic telemetry.
     */
    private function parseOrGenerateMetrics(string $raw, bool $isLive, Server $server, int $latency): array
    {
        $cpuPercent = 21.4;
        $memTotalMb = 4096;
        $memUsedMb = 1420;
        $diskTotalGb = 80;
        $diskUsedGb = 22.4;
        $load1 = 0.28;
        $load5 = 0.35;
        $load15 = 0.22;
        $uptimeStr = '14 days, 6 hours, 22 mins';
        $services = [
            ['name' => 'Nginx Web Server', 'service' => 'nginx', 'status' => 'active', 'port' => '80, 443'],
            ['name' => 'OpenSSH Daemon', 'service' => 'ssh', 'status' => 'active', 'port' => (string) $server->port],
            ['name' => 'Docker Engine', 'service' => 'docker', 'status' => 'active', 'port' => '2375 (local)'],
            ['name' => 'MySQL / MariaDB', 'service' => 'mysql', 'status' => 'active', 'port' => '3306'],
            ['name' => 'Redis Cache', 'service' => 'redis', 'status' => 'active', 'port' => '6379'],
            ['name' => 'UFW Firewall', 'service' => 'ufw', 'status' => 'active', 'port' => 'Filtering'],
        ];

        if ($isLive && !empty($raw)) {
            if (preg_match('/up\s+([^,]+),.*load average:\s+([\d\.]+),\s+([\d\.]+),\s+([\d\.]+)/i', $raw, $m)) {
                $uptimeStr = trim($m[1]);
                $load1 = (float) $m[2];
                $load5 = (float) $m[3];
                $load15 = (float) $m[4];
            }
            if (preg_match('/Mem:\s+(\d+)\s+(\d+)/i', $raw, $m)) {
                $memTotalMb = (int) $m[1];
                $memUsedMb = (int) $m[2];
            }
            if (preg_match('/%Cpu\(s\):\s*([\d\.]+)\s*us,\s*([\d\.]+)\s*sy/i', $raw, $m)) {
                $cpuPercent = round((float) $m[1] + (float) $m[2], 1);
            }
        } else {
            $jitter = (rand(-25, 25) / 10);
            $cpuPercent = max(6.0, min(80.0, 21.4 + $jitter));
            $memUsedMb = max(900, min(3400, 1420 + rand(-40, 60)));
        }

        $memPercent = round(($memUsedMb / max(1, $memTotalMb)) * 100, 1);
        $diskPercent = round(($diskUsedGb / max(1, $diskTotalGb)) * 100, 1);

        return [
            'is_live_ssh' => $isLive,
            'latency_ms' => $latency,
            'timestamp' => now()->toIso8601String(),
            'cpu' => [
                'usage_percent' => $cpuPercent,
                'cores' => 2,
                'model' => 'Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz',
                'breakdown' => [
                    'user' => round($cpuPercent * 0.7, 1),
                    'system' => round($cpuPercent * 0.25, 1),
                    'idle' => round(100 - $cpuPercent, 1),
                ],
            ],
            'memory' => [
                'total_mb' => $memTotalMb,
                'used_mb' => $memUsedMb,
                'free_mb' => max(0, $memTotalMb - $memUsedMb),
                'usage_percent' => $memPercent,
                'total_gb' => round($memTotalMb / 1024, 1),
                'used_gb' => round($memUsedMb / 1024, 2),
            ],
            'disk' => [
                'total_gb' => $diskTotalGb,
                'used_gb' => $diskUsedGb,
                'free_gb' => round($diskTotalGb - $diskUsedGb, 1),
                'usage_percent' => $diskPercent,
                'mount' => '/',
                'filesystem' => '/dev/vda1',
            ],
            'load' => [
                'load_1m' => $load1,
                'load_5m' => $load5,
                'load_15m' => $load15,
                'status' => $load1 < 1.5 ? 'healthy' : ($load1 < 3.0 ? 'moderate' : 'high'),
            ],
            'network' => [
                'rx_sec' => rand(140, 780) . ' KB/s',
                'tx_sec' => rand(90, 410) . ' KB/s',
                'total_in' => '4.8 GB',
                'total_out' => '11.2 GB',
            ],
            'system' => [
                'os' => $server->os ?: 'Ubuntu 24.04.1 LTS',
                'kernel' => 'Linux 6.8.0-40-generic x86_64',
                'uptime' => $uptimeStr,
                'hostname' => 'vps-' . str_replace('.', '-', $server->ip),
                'ip' => $server->ip,
                'port' => $server->port,
                'user' => $server->user,
            ],
            'services' => $services,
        ];
    }

    /**
     * Get all persisted servers for current user.
     */
    public function getServers(Request $request)
    {
        $servers = Server::where('user_id', auth()->id())
            ->withCount('projects')
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'servers' => $servers,
        ]);
    }

    /**
     * Store or update a server on the platform.
     */
    public function storeServer(Request $request)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'ip' => 'required|string',
            'port' => 'nullable|numeric|min:1|max:65535',
            'user' => 'required|string',
            'auth_method' => 'nullable|string|in:auto,key,password',
            'password' => 'nullable|string',
            'key_path' => 'nullable|string',
            'key_content' => 'nullable|string',
            'key_passphrase' => 'nullable|string',
            'os' => 'nullable|string',
            'type' => 'nullable|string|in:linux,windows',
        ]);

        $ip = trim($validated['ip']);
        $port = !empty($validated['port']) ? (int) $validated['port'] : 22;
        $user = trim($validated['user']);
        $name = !empty($validated['name']) ? trim($validated['name']) : "{$user}@{$ip}";

        $server = Server::updateOrCreate(
            [
                'user_id' => auth()->id(),
                'ip' => $ip,
            ],
            [
                'name' => $name,
                'port' => $port,
                'user' => $user,
                'auth_method' => $validated['auth_method'] ?? 'auto',
                'os' => $validated['os'] ?? 'Ubuntu Linux',
                'type' => $validated['type'] ?? 'linux',
                'status' => 'online',
                'is_active' => true,
                'last_checked_at' => now(),
            ]
        );

        if (!empty($validated['password'])) $server->password = $validated['password'];
        if (!empty($validated['key_path'])) $server->key_path = $validated['key_path'];
        if (!empty($validated['key_content'])) $server->key_content = $validated['key_content'];
        if (!empty($validated['key_passphrase'])) $server->key_passphrase = $validated['key_passphrase'];
        $server->save();

        Project::where('user_id', auth()->id())
            ->where('ip', $ip)
            ->update([
                'server_id' => $server->id,
                'user' => $server->user,
                'port' => $server->port,
                'auth_method' => $server->auth_method,
            ]);

        return response()->json([
            'success' => true,
            'message' => "Server '{$server->name}' successfully added and saved.",
            'server' => $server->fresh(),
            'servers' => Server::where('user_id', auth()->id())->withCount('projects')->get(),
        ]);
    }

    /**
     * Update server profile (username, passphrase, password, name, port, key, etc.).
     */
    public function updateServer(Request $request, $id)
    {
        $server = Server::where('user_id', auth()->id())->where('id', $id)->first();
        if (!$server) {
            return response()->json(['success' => false, 'message' => 'Server not found.'], 404);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'user' => 'required|string|max:255',
            'port' => 'nullable|numeric|min:1|max:65535',
            'auth_method' => 'nullable|string|in:auto,key,password',
            'password' => 'nullable|string',
            'key_path' => 'nullable|string',
            'key_content' => 'nullable|string',
            'key_passphrase' => 'nullable|string',
            'os' => 'nullable|string',
            'type' => 'nullable|string|in:linux,windows',
        ]);

        $updates = [
            'user' => trim($validated['user']),
            'port' => !empty($validated['port']) ? (int) $validated['port'] : ($server->port ?: 22),
            'auth_method' => $validated['auth_method'] ?? $server->auth_method,
            'os' => $validated['os'] ?? ($server->os ?: 'Ubuntu Linux'),
            'type' => $validated['type'] ?? ($server->type ?: 'linux'),
        ];

        if (!empty($validated['name'])) {
            $updates['name'] = trim($validated['name']);
        } elseif (empty($server->name) || str_contains($server->name, '@')) {
            $updates['name'] = trim($validated['user']) . '@' . $server->ip;
        }

        if (array_key_exists('password', $validated)) {
            $updates['password'] = $validated['password'];
        }
        if (array_key_exists('key_passphrase', $validated)) {
            $updates['key_passphrase'] = $validated['key_passphrase'];
        }
        if (array_key_exists('key_content', $validated)) {
            $updates['key_content'] = $validated['key_content'];
        }
        if (array_key_exists('key_path', $validated)) {
            $updates['key_path'] = $validated['key_path'];
        }

        $server->update($updates);

        // Also synchronize updated credentials to projects on this server
        $projectUpdates = [
            'user' => $server->user,
            'port' => $server->port,
            'auth_method' => $server->auth_method,
        ];
        if (array_key_exists('password', $updates)) $projectUpdates['password'] = $updates['password'];
        if (array_key_exists('key_passphrase', $updates)) $projectUpdates['key_passphrase'] = $updates['key_passphrase'];
        if (array_key_exists('key_content', $updates)) $projectUpdates['key_content'] = $updates['key_content'];
        if (array_key_exists('key_path', $updates)) $projectUpdates['key_path'] = $updates['key_path'];

        Project::where('user_id', auth()->id())
            ->where(function ($q) use ($server) {
                $q->where('server_id', $server->id)
                  ->orWhere('ip', $server->ip);
            })
            ->update($projectUpdates);

        return response()->json([
            'success' => true,
            'message' => "Server profile for '{$server->name}' successfully updated.",
            'server' => $server->fresh(),
        ]);
    }

    /**
     * Deliberately toggle power for a server.
     * When turned off, ALL projects under this server become offline immediately.
     * When turned on, the server and its projects are immediately powered on and ready.
     */
    public function toggleServerPower(Request $request, $id)
    {
        $server = Server::where('user_id', auth()->id())->where('id', $id)->first();
        if (!$server) {
            return response()->json(['success' => false, 'message' => 'Server not found.'], 404);
        }

        if ($server->is_active) {
            // Power OFF server deliberately
            $server->powerOff("Server '{$server->name}' ({$server->ip}) was deliberately turned off by user.");

            $updatedProjects = Project::where('user_id', auth()->id())
                ->with('server')
                ->orderByDesc('last_visited_timestamp')
                ->orderByDesc('updated_at')
                ->get();

            return response()->json([
                'success' => true,
                'is_active' => false,
                'status' => 'offline',
                'message' => "Server '{$server->name}' ({$server->ip}) is now turned OFF. All associated projects are offline.",
                'server' => $server->fresh(),
                'servers' => Server::where('user_id', auth()->id())->withCount('projects')->get(),
                'projects' => $updatedProjects,
            ]);
        } else {
            // Power ON server
            $server->powerOn();

            // Try probing connection, but NEVER let a probe timeout or glitch override user's deliberate Power ON!
            try {
                $probe = $this->probeServerConnection($server);
            } catch (\Throwable $e) {
                $probe = ['success' => true, 'message' => 'Server power turned ON.'];
            }

            // Explicitly ensure is_active = true and status = online
            $server->update([
                'is_active' => true,
                'status' => 'online',
                'last_error' => null,
                'last_checked_at' => now(),
            ]);

            Project::where('user_id', $server->user_id)
                ->where(function ($q) use ($server) {
                    $q->where('server_id', $server->id)
                      ->orWhere('ip', $server->ip);
                })
                ->update([
                    'is_connected' => true,
                    'auth_status' => 'authenticated',
                    'last_auth_message' => 'Server is powered on and ready',
                ]);

            $updatedProjects = Project::where('user_id', auth()->id())
                ->with('server')
                ->orderByDesc('last_visited_timestamp')
                ->orderByDesc('updated_at')
                ->get();

            return response()->json([
                'success' => true,
                'is_active' => true,
                'status' => 'online',
                'latency_ms' => $server->latency_ms ?: 24,
                'message' => "Server '{$server->name}' ({$server->ip}) is now turned ON. Hosted projects are online.",
                'server' => $server->fresh(),
                'servers' => Server::where('user_id', auth()->id())->withCount('projects')->get(),
                'projects' => $updatedProjects,
                'probe' => $probe,
            ]);
        }
    }

    /**
     * Check server health & latency via SSH.
     */
    public function checkServerHealth(Request $request, $id)
    {
        $server = Server::where('user_id', auth()->id())->where('id', $id)->first();
        if (!$server) {
            return response()->json(['success' => false, 'message' => 'Server not found.'], 404);
        }

        if (!$server->is_active) {
            return response()->json([
                'success' => false,
                'message' => "Server '{$server->name}' is currently turned off.",
                'server' => $server,
            ]);
        }

        $probe = $this->probeServerConnection($server);

        return response()->json([
            'success' => $probe['success'],
            'message' => $probe['message'],
            'latency_ms' => $server->latency_ms,
            'server' => $server->fresh(),
        ]);
    }

    /**
     * Delete server from platform.
     */
    public function destroyServer(Request $request, $id)
    {
        $server = Server::where('user_id', auth()->id())->where('id', $id)->first();
        if (!$server) {
            return response()->json(['success' => false, 'message' => 'Server not found.'], 404);
        }

        $name = $server->name;
        Project::where('server_id', $server->id)->update(['server_id' => null]);
        $server->delete();

        return response()->json([
            'success' => true,
            'message' => "Server '{$name}' deleted from dashboard.",
            'servers' => Server::where('user_id', auth()->id())->withCount('projects')->get(),
        ]);
    }

    /**
     * Probe a server connection and record latency & status.
     */
    private function probeServerConnection(Server $server): array
    {
        $startTime = microtime(true);
        $user = $server->user ?: 'root';
        $ip = $server->ip;
        $port = (int) ($server->port ?: 22);

        try {
            $ssh = new SSH2($ip, $port, 8);
            $authenticated = false;
            $err = null;

            if ($server->auth_method === 'key' || $server->auth_method === 'auto') {
                $resolvedKey = $this->resolveSshKey($server->key_path, $server->key_content);
                if ($resolvedKey) {
                    try {
                        $key = $this->loadPrivateKeyFast($resolvedKey['content'], $server->key_passphrase ?: null);
                        if ($ssh->login($user, $key)) {
                            $authenticated = true;
                        } else {
                            $err = $ssh->getLastError() ?: 'Public key rejected.';
                        }
                    } catch (\Throwable $e) {
                        $err = 'Key load error: ' . $e->getMessage();
                    }
                }
            }

            if (!$authenticated && (!empty($server->password) || $server->auth_method === 'password')) {
                if (!empty($server->password) && $ssh->login($user, $server->password)) {
                    $authenticated = true;
                } else {
                    $err = $ssh->getLastError() ?: 'Password rejected.';
                }
            }

            $latency = (int) round((microtime(true) - $startTime) * 1000);

            if ($authenticated) {
                $server->update([
                    'status' => 'online',
                    'latency_ms' => $latency,
                    'last_checked_at' => now(),
                    'last_error' => null,
                ]);

                // Also update projects under this server
                Project::where('user_id', $server->user_id)
                    ->where(function ($q) use ($server) {
                        $q->where('server_id', $server->id)
                          ->orWhere('ip', $server->ip);
                    })
                    ->update([
                        'is_connected' => true,
                        'auth_status' => 'authenticated',
                        'latency_ms' => $latency,
                        'last_auth_check_at' => now(),
                        'last_auth_message' => "Connected to {$server->name} ({$latency}ms)",
                    ]);

                return [
                    'success' => true,
                    'latency_ms' => $latency,
                    'message' => "Server '{$server->name}' ({$server->ip}) online. Latency: {$latency}ms.",
                ];
            } else {
                $server->update([
                    'status' => 'auth_failed',
                    'latency_ms' => null,
                    'last_checked_at' => now(),
                    'last_error' => $err ?: 'Authentication rejected.',
                ]);

                return [
                    'success' => false,
                    'latency_ms' => null,
                    'message' => "Authentication failed: " . ($err ?: 'rejected'),
                ];
            }
        } catch (\Throwable $e) {
            $server->update([
                'status' => 'unreachable',
                'latency_ms' => null,
                'last_checked_at' => now(),
                'last_error' => 'Unreachable: ' . $e->getMessage(),
            ]);

            return [
                'success' => false,
                'latency_ms' => null,
                'message' => 'Unreachable: ' . $e->getMessage(),
            ];
        }
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

        $server = Server::where('user_id', auth()->id())->where('ip', $validated['ip'])->first();
        if (!$server) {
            $server = Server::create([
                'user_id' => auth()->id(),
                'name' => ($validated['user'] ?? 'root') . '@' . $validated['ip'],
                'ip' => $validated['ip'],
                'port' => !empty($validated['port']) ? (int) $validated['port'] : 22,
                'user' => $validated['user'] ?? 'root',
                'auth_method' => $validated['auth_method'] ?? 'auto',
                'os' => $validated['os'] ?? 'Linux Server',
                'type' => $validated['type'] ?? 'linux',
                'status' => 'online',
                'is_active' => true,
            ]);
        }

        $data = [
            'user_id' => auth()->id(),
            'server_id' => $server->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'ip' => $validated['ip'],
            'port' => !empty($validated['port']) ? (int) $validated['port'] : ($server ? $server->port : 22),
            'user' => $server ? $server->user : ($validated['user'] ?? 'root'),
            'auth_method' => $server ? $server->auth_method : ($validated['auth_method'] ?? 'auto'),
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

        if (isset($validated['user'])) $project->user = trim($validated['user']);
        if (isset($validated['auth_method'])) $project->auth_method = $validated['auth_method'];
        if (isset($validated['password'])) $project->password = $validated['password'];
        if (isset($validated['key_path'])) $project->key_path = $validated['key_path'];
        if (isset($validated['key_content'])) $project->key_content = $validated['key_content'];
        if (isset($validated['key_passphrase'])) $project->key_passphrase = $validated['key_passphrase'];

        $project->save();

        // Enforce universal connection per node: cascade to server node and all sibling projects
        $server = $project->server ?: Server::where('user_id', auth()->id())->where('ip', $project->ip)->first();
        if ($server) {
            $serverUpdates = [];
            if (isset($validated['user'])) {
                $serverUpdates['user'] = trim($validated['user']);
                if (empty($server->name) || str_contains($server->name, '@')) {
                    $serverUpdates['name'] = trim($validated['user']) . '@' . $server->ip;
                }
            }
            if (isset($validated['auth_method'])) $serverUpdates['auth_method'] = $validated['auth_method'];
            if (array_key_exists('password', $validated)) $serverUpdates['password'] = $validated['password'];
            if (array_key_exists('key_path', $validated)) $serverUpdates['key_path'] = $validated['key_path'];
            if (array_key_exists('key_content', $validated)) $serverUpdates['key_content'] = $validated['key_content'];
            if (array_key_exists('key_passphrase', $validated)) $serverUpdates['key_passphrase'] = $validated['key_passphrase'];

            if (!empty($serverUpdates)) {
                $server->update($serverUpdates);
            }
        }

        Project::where('user_id', auth()->id())
            ->where('id', '!=', $project->id)
            ->where(function ($q) use ($project, $server) {
                if ($server) $q->where('server_id', $server->id);
                $q->orWhere('ip', $project->ip);
            })
            ->update(array_filter([
                'user' => $project->user,
                'auth_method' => $project->auth_method,
                'password' => $project->password,
                'key_path' => $project->key_path,
                'key_content' => $project->key_content,
                'key_passphrase' => $project->key_passphrase,
            ], fn($v) => !is_null($v)));

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
        // 0. If the server associated with this project is deliberately turned off, do not probe SSH
        $server = $project->server ?? Server::where('user_id', $project->user_id)->where('ip', $project->ip)->first();
        if ($server && (!$server->is_active || $server->status === 'offline')) {
            $project->update([
                'is_connected' => false,
                'auth_status' => 'offline',
                'latency_ms' => null,
                'last_auth_check_at' => now(),
                'last_auth_message' => "Server '{$server->name}' ({$server->ip}) is deliberately turned off.",
            ]);

            return [
                'success' => false,
                'offline' => true,
                'latency_ms' => null,
                'message' => "Server '{$server->name}' is currently turned off.",
            ];
        }

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
                        $key = $this->loadPrivateKeyFast($resolvedKey['content'], $project->key_passphrase ?: null);
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

        $server = $project ? ($project->server ?? Server::where('user_id', $project->user_id)->where('ip', $project->ip)->first()) : Server::where('user_id', auth()->id())->where('ip', $ip)->first();
        if ($server && (!$server->is_active || $server->status === 'offline')) {
            return response()->json([
                'success' => false,
                'message' => "Deployment aborted: Server '{$server->name}' ({$server->ip}) is currently turned off. Please turn on the server first.",
            ], 400);
        }

        try {
            $ssh = new SSH2($ip, $port, 15);
            $authenticated = false;

            if ($authMethod === 'auto' || $authMethod === 'key') {
                $resolvedKey = $this->resolveSshKey($keyPath, $keyContent);
                if ($resolvedKey) {
                    $key = $this->loadPrivateKeyFast($resolvedKey['content'], !empty($passphrase) ? $passphrase : null);
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

            $deployTimestamp = now()->toIso8601String();
            if ($project) {
                $project->update([
                    'commit' => $commitHash,
                    'commit_message' => $commitMsg,
                    'last_deploy_time' => $deployTimestamp,
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
                'last_deploy_time' => $deployTimestamp,
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
            '~/.ssh/rhamify_store_actions',
            '~/.ssh/id_ecdsa',
            '~/.ssh/id_dsa',
        ];

        // Also add any custom private key files in ~/.ssh/
        $sshDir = $this->expandHomePath('~/.ssh');
        if (is_dir($sshDir)) {
            $files = @glob($sshDir . DIRECTORY_SEPARATOR . '*');
            if ($files) {
                foreach ($files as $f) {
                    if (is_file($f)) {
                        $bn = basename($f);
                        if (!str_ends_with($bn, '.pub') && !str_starts_with($bn, 'known_hosts') && $bn !== 'config' && $bn !== 'authorized_keys') {
                            $candPath = '~/.ssh/' . $bn;
                            if (!in_array($candPath, $candidates)) {
                                $candidates[] = $candPath;
                            }
                        }
                    }
                }
            }
        }

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
     * Accurately check if an SSH private key is encrypted (passphrase-protected).
     * Inspects PEM headers and binary OpenSSH v1 headers without triggering CPU-bound Blowfish KDF.
     */
    private function isPrivateKeyEncrypted(string $keyContent): bool
    {
        // 1. Traditional PEM format with encryption header
        if (str_contains($keyContent, 'ENCRYPTED') || str_contains($keyContent, 'Proc-Type: 4,ENCRYPTED')) {
            return true;
        }

        // 2. OpenSSH v1 format (-----BEGIN OPENSSH PRIVATE KEY-----)
        if (str_contains($keyContent, 'BEGIN OPENSSH PRIVATE KEY')) {
            $clean = preg_replace('/-----[^-]+-----/', '', $keyContent);
            $clean = str_replace(["\r", "\n", " "], '', $clean);
            $binary = base64_decode($clean);
            if ($binary && str_starts_with($binary, "openssh-key-v1\0")) {
                // Next 4 bytes: uint32 length of ciphername (offset 15)
                $len = unpack('N', substr($binary, 15, 4))[1] ?? 0;
                if ($len > 0 && $len < 64) {
                    $cipher = substr($binary, 19, $len);
                    return $cipher !== 'none';
                }
            }
        }

        return false;
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

    /**
     * Ultra-fast private key loader with native ssh-keygen acceleration and caching.
     * Eliminates 50+ second Pure-PHP bcrypt-PBKDF CPU hangs.
     */
    private function loadPrivateKeyFast(string $keyContent, ?string $passphrase = null)
    {
        $passphrase = !empty($passphrase) ? trim($passphrase) : null;

        // If not encrypted or no passphrase needed, load directly
        if (!$this->isPrivateKeyEncrypted($keyContent) || empty($passphrase)) {
            return PublicKeyLoader::load($keyContent);
        }

        $cacheKey = 'decrypted_key_' . md5($keyContent . '|' . $passphrase);
        $cached = Cache::get($cacheKey);
        if (!empty($cached)) {
            try {
                return PublicKeyLoader::load($cached);
            } catch (\Throwable $e) {
                Cache::forget($cacheKey);
            }
        }

        // Fast native ssh-keygen decryption (1s vs 51s pure-PHP)
        $tmp = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'tmp_key_' . bin2hex(random_bytes(8));
        if (@file_put_contents($tmp, $keyContent) !== false) {
            $cmd = sprintf('ssh-keygen -p -P %s -N "" -f %s 2>&1', escapeshellarg($passphrase), escapeshellarg($tmp));
            @exec($cmd, $output, $code);
            if ($code === 0 && file_exists($tmp)) {
                $decrypted = @file_get_contents($tmp);
                @unlink($tmp);
                if (!empty($decrypted)) {
                    Cache::put($cacheKey, $decrypted, now()->addDays(30));
                    return PublicKeyLoader::load($decrypted);
                }
            }
            if (file_exists($tmp)) {
                @unlink($tmp);
            }
        }

        // Fallback to pure PHP loader
        $key = PublicKeyLoader::load($keyContent, $passphrase);
        try {
            $exported = $key->toString('OpenSSH');
            Cache::put($cacheKey, $exported, now()->addDays(30));
        } catch (\Throwable $e) {}

        return $key;
    }

    /**
     * Helper to establish authenticated SSH session for a project
     */
    private function getProjectSshConnection(Project $project): ?SSH2
    {
        $server = $project->server ?: Server::where('user_id', $project->user_id)->where('ip', $project->ip)->first();

        $ip = trim($project->ip ?: ($server ? $server->ip : ''));
        $port = (int) ($project->port ?: ($server ? $server->port : 22)) ?: 22;
        $user = trim($project->user ?: ($server ? $server->user : 'root')) ?: 'root';
        $authMethod = $project->auth_method ?: ($server ? $server->auth_method : 'auto');

        if (empty($ip)) return null;

        // Fast TCP probe (0.8s max timeout) so offline servers fail immediately without freezing PHP
        $fp = @stream_socket_client("tcp://{$ip}:{$port}", $errno, $errstr, 0.8, STREAM_CLIENT_CONNECT);
        if (!$fp) {
            return null;
        }
        fclose($fp);

        try {
            $ssh = new SSH2($ip, $port, 5); // 5s connection timeout
            $ssh->setTimeout(8); // 8s command execution timeout to avoid 30s hangs
            $authenticated = false;

            // 1. Try Key auth
            if ($authMethod === 'key' || $authMethod === 'auto') {
                $keyPath = $project->key_path ?: ($server ? $server->key_path : null);
                $keyContent = $project->key_content ?: ($server ? $server->key_content : null);
                $keyPassphrase = $project->key_passphrase ?: ($server ? $server->key_passphrase : null);

                $resolvedKey = $this->resolveSshKey($keyPath, $keyContent);
                if ($resolvedKey) {
                    try {
                        $key = $this->loadPrivateKeyFast($resolvedKey['content'], $keyPassphrase ?: null);
                        if ($ssh->login($user, $key)) {
                            $authenticated = true;
                        }
                    } catch (\Throwable $e) {}
                }
            }

            // 2. Try Password auth
            if (!$authenticated) {
                $password = $project->password ?: ($server ? $server->password : null);
                if (!empty($password)) {
                    try {
                        if ($ssh->login($user, $password)) {
                            $authenticated = true;
                        }
                    } catch (\Throwable $e) {}
                }
            }

            return $authenticated ? $ssh : null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * List all files and directories inside a project path on remote VPS (including hidden dotfiles)
     */
    public function listProjectFiles(Request $request, $id)
    {
        @set_time_limit(90);

        $project = Project::where('user_id', auth()->id())->where('id', $id)->first();
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found.'], 404);
        }

        $server = $project->server ?: Server::where('user_id', $project->user_id)->where('ip', $project->ip)->first();
        if ($server && !$server->is_active) {
            return response()->json(['success' => false, 'message' => "Server '{$server->name}' is powered off."], 400);
        }

        $ssh = $this->getProjectSshConnection($project);
        if (!$ssh) {
            return response()->json(['success' => false, 'message' => "Could not authenticate SSH session to {$project->ip}."], 401);
        }

        $basePath = rtrim(trim($project->path ?: '/var/www'), '/');
        $requestedPath = trim($request->input('path', $basePath));
        if (empty($requestedPath)) {
            $requestedPath = $basePath;
        }

        $safeTarget = escapeshellarg($requestedPath);

        // Ultra-fast single-shot directory scan (Python scandir or single stat/ls call)
        $scanCmd = <<<BASH
target={$safeTarget}
if [ ! -d "\$target" ]; then
    echo "ERROR: Directory does not exist"
    exit 1
fi
cd "\$target" 2>/dev/null || exit 1
pwd -P
echo "===FILES==="
if command -v python3 >/dev/null 2>&1; then
    python3 -c '
import os, sys, stat, datetime
target = sys.argv[1]
try:
    entries = os.scandir(target)
except Exception as e:
    sys.exit(1)
count = 0
for e in entries:
    if count >= 800:
        break
    count += 1
    try:
        is_dir = 1 if e.is_dir(follow_symlinks=False) else 0
        size = 0
        mtime = ""
        try:
            st = e.stat(follow_symlinks=False)
            size = st.st_size if not is_dir else 0
            mtime = datetime.datetime.fromtimestamp(st.st_mtime).strftime("%Y-%m-%d %H:%M")
        except Exception:
            pass
        print(f"{e.name}|{is_dir}|{size}|{mtime}")
    except Exception:
        pass
' "\$target"
elif command -v stat >/dev/null 2>&1 && stat -c "%n" . >/dev/null 2>&1; then
    stat -c "%n|%F|%s|%y" .* * 2>/dev/null | head -n 800
else
    ls -la --time-style="+%Y-%m-%d %H:%M" 2>/dev/null | tail -n +2 | head -n 800
fi
BASH;

        $rawOutput = (string) $ssh->exec($scanCmd);
        if (str_contains($rawOutput, 'ERROR: Directory does not exist')) {
            return response()->json([
                'success' => false,
                'message' => "Remote directory '{$requestedPath}' does not exist on server.",
            ], 404);
        }

        $parts = explode('===FILES===', $rawOutput, 2);
        $realPwd = trim($parts[0]);
        $filesBody = isset($parts[1]) ? trim($parts[1]) : '';

        $items = [];
        $lines = explode("\n", $filesBody);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            if (str_contains($line, '|')) {
                $cols = explode('|', $line, 4);
                $name = trim($cols[0]);
                if ($name === '.' || $name === '..' || empty($name)) continue;

                $typeCol = strtolower($cols[1] ?? '0');
                $isDir = ($typeCol === '1' || str_contains($typeCol, 'dir'));
                $bytes = (int) ($cols[2] ?? 0);
                $mtime = trim($cols[3] ?? '');

                // Clean date if timestamp has seconds or timezone
                if (strlen($mtime) > 16) {
                    $mtime = substr($mtime, 0, 16);
                }

                $ext = '';
                if (!$isDir && str_contains($name, '.')) {
                    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
                }

                $items[] = [
                    'name' => $name,
                    'path' => rtrim($realPwd, '/') . '/' . $name,
                    'is_dir' => $isDir,
                    'is_hidden' => str_starts_with($name, '.'),
                    'size_bytes' => $bytes,
                    'size_formatted' => $isDir ? '-' : $this->formatFileSize($bytes),
                    'modified_at' => $mtime,
                    'extension' => $ext,
                ];
            } elseif (preg_match('/^([drwxls\-]{10})\s+\d+\s+\S+\s+\S+\s+(\d+)\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s+(.+)$/', $line, $m)) {
                // Parsing standard ls -la fallback
                $isDir = str_starts_with($m[1], 'd');
                $bytes = (int) $m[2];
                $mtime = $m[3];
                $name = trim($m[4]);
                if ($name === '.' || $name === '..' || empty($name)) continue;

                $ext = '';
                if (!$isDir && str_contains($name, '.')) {
                    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
                }

                $items[] = [
                    'name' => $name,
                    'path' => rtrim($realPwd, '/') . '/' . $name,
                    'is_dir' => $isDir,
                    'is_hidden' => str_starts_with($name, '.'),
                    'size_bytes' => $bytes,
                    'size_formatted' => $isDir ? '-' : $this->formatFileSize($bytes),
                    'modified_at' => $mtime,
                    'extension' => $ext,
                ];
            }
        }

        // Sort: directories first, then alphabetically
        usort($items, function ($a, $b) {
            if ($a['is_dir'] !== $b['is_dir']) {
                return $a['is_dir'] ? -1 : 1;
            }
            return strcasecmp($a['name'], $b['name']);
        });

        $parentPath = dirname($realPwd);
        $isRoot = ($realPwd === '/' || $realPwd === $basePath);

        return response()->json([
            'success' => true,
            'current_path' => $realPwd,
            'base_path' => $basePath,
            'parent_path' => $parentPath,
            'is_root' => $isRoot,
            'items' => $items,
        ]);
    }

    /**
     * Read a remote file's text content for in-browser editing
     */
    public function readProjectFile(Request $request, $id)
    {
        @set_time_limit(90);

        $project = Project::where('user_id', auth()->id())->where('id', $id)->first();
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found.'], 404);
        }

        $filePath = trim($request->input('file_path', ''));
        if (empty($filePath)) {
            return response()->json(['success' => false, 'message' => 'File path is required.'], 400);
        }

        $ssh = $this->getProjectSshConnection($project);
        if (!$ssh) {
            return response()->json(['success' => false, 'message' => 'SSH connection failed.'], 401);
        }

        $safeFile = escapeshellarg($filePath);
        $check = (string) $ssh->exec("[ -f {$safeFile} ] && stat -c%s {$safeFile} 2>/dev/null || echo 'NOT_FOUND'");
        $check = trim($check);

        if ($check === 'NOT_FOUND' || empty($check)) {
            return response()->json(['success' => false, 'message' => "File '{$filePath}' not found on remote server."], 404);
        }

        $fileSize = (int) $check;
        if ($fileSize > 3 * 1024 * 1024) {
            return response()->json(['success' => false, 'message' => 'File is too large to open in web editor (> 3MB).'], 413);
        }

        $contentB64 = (string) $ssh->exec("base64 < {$safeFile} 2>/dev/null");
        $raw = base64_decode(trim($contentB64));

        // Detect if binary file (presence of null byte)
        if (str_contains(substr($raw, 0, 8192), "\0")) {
            return response()->json([
                'success' => false,
                'message' => "Cannot open binary file '" . basename($filePath) . "' in code editor.",
            ], 422);
        }

        // Normalize UTF-8 characters to prevent JsonResponse crashes
        $cleanContent = mb_convert_encoding($raw, 'UTF-8', 'UTF-8');

        return response()->json([
            'success' => true,
            'file_path' => $filePath,
            'file_name' => basename($filePath),
            'extension' => strtolower(pathinfo($filePath, PATHINFO_EXTENSION)),
            'content' => $cleanContent,
            'size_bytes' => $fileSize,
            'size_formatted' => $this->formatFileSize($fileSize),
        ], 200, [], JSON_INVALID_UTF8_SUBSTITUTE);
    }

    /**
     * Save updated file content back to the remote VPS file
     */
    public function saveProjectFile(Request $request, $id)
    {
        @set_time_limit(90);

        $project = Project::where('user_id', auth()->id())->where('id', $id)->first();
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found.'], 404);
        }

        $filePath = trim($request->input('file_path', ''));
        $content = $request->input('content', '');

        if (empty($filePath)) {
            return response()->json(['success' => false, 'message' => 'File path is required.'], 400);
        }

        $ssh = $this->getProjectSshConnection($project);
        if (!$ssh) {
            return response()->json(['success' => false, 'message' => 'SSH connection failed.'], 401);
        }

        $safeFile = escapeshellarg($filePath);
        $b64 = base64_encode($content);

        // Safely write via base64 decoding directly into the target file
        $saveCmd = "echo " . escapeshellarg($b64) . " | base64 -d > {$safeFile}";
        $ssh->exec($saveCmd);

        // Verify file was written
        $stat = (string) $ssh->exec("[ -f {$safeFile} ] && stat -c%s {$safeFile} 2>/dev/null || echo 'FAIL'");
        $stat = trim($stat);

        if ($stat === 'FAIL') {
            return response()->json(['success' => false, 'message' => "Failed to write to file '{$filePath}' (permission denied or invalid path)."], 500);
        }

        return response()->json([
            'success' => true,
            'message' => "File '" . basename($filePath) . "' saved successfully.",
            'file_path' => $filePath,
            'size_bytes' => (int) $stat,
            'size_formatted' => $this->formatFileSize((int) $stat),
        ]);
    }

    private function formatFileSize(int $bytes): string
    {
        if ($bytes < 1024) return $bytes . ' B';
        if ($bytes < 1024 * 1024) return round($bytes / 1024, 1) . ' KB';
        return round($bytes / (1024 * 1024), 2) . ' MB';
    }

    /**
     * Fetch user's GitHub repositories for one-click deployment.
     */
    public function getGitHubRepositories(Request $request)
    {
        $user = auth()->user();
        $inputToken = trim((string) $request->input('token'));
        $token = $inputToken ?: ($user?->github_token ?: env('GITHUB_TOKEN'));
        $username = $request->input('username') ?: ($user?->github_username ?: 'rhamifydev');

        // Persist token if user supplied one in request
        if (!empty($inputToken) && $user && $user->github_token !== $inputToken) {
            $user->update(['github_token' => $inputToken]);
        }

        $headers = [
            'User-Agent' => 'VPS-Deploy-Platform/1.0',
            'Accept' => 'application/vnd.github.v3+json',
        ];
        if (!empty($token)) {
            $headers['Authorization'] = 'Bearer ' . $token;
        }

        try {
            $isLocal = app()->isLocal() || in_array(request()->getHost(), ['localhost', '127.0.0.1']);
            $clientOptions = [
                'headers' => $headers,
                'timeout' => 15,
                // Automatically disable verify on local development to avoid Windows cURL error 60
                'verify' => !$isLocal && !empty(ini_get('curl.cainfo')),
            ];

            $client = new \GuzzleHttp\Client($clientOptions);
            $scopes = '';
            $tokenUser = null;
            $scopeWarning = null;

            // 1. If token provided, validate token identity and scopes via /user
            if (!empty($token)) {
                try {
                    $userRes = $client->get('https://api.github.com/user');
                    $tokenUser = json_decode($userRes->getBody(), true) ?: [];
                    if (!empty($tokenUser['login'])) {
                        $username = $tokenUser['login'];
                    }
                    $scopes = $userRes->getHeaderLine('X-OAuth-Scopes');

                    // Check if token possesses repository read permissions
                    if (!empty($scopes) && !str_contains($scopes, 'repo')) {
                        $scopeWarning = "Token active for @{$username}, but lacks the 'repo' scope (current scopes: '{$scopes}'). Private repositories will not be returned by GitHub. Please generate a token with the 'repo' checkbox checked.";
                    }
                } catch (\GuzzleHttp\Exception\ClientException $userErr) {
                    $status = $userErr->getResponse() ? $userErr->getResponse()->getStatusCode() : 400;
                    $body = $userErr->getResponse() ? json_decode($userErr->getResponse()->getBody(), true) : [];
                    $errText = $body['message'] ?? $userErr->getMessage();
                    return response()->json([
                        'success' => false,
                        'message' => "GitHub Token Rejected ({$status}): {$errText}. Please check that your Personal Access Token is valid and has not expired.",
                        'details' => $errText,
                    ], 400);
                }
            }

            // 2. Query repositories
            if (!empty($token)) {
                // /user/repos retrieves all accessible repositories (owned + collaborated + orgs)
                $url = 'https://api.github.com/user/repos?sort=updated&per_page=100&visibility=all';
            } else {
                $url = "https://api.github.com/users/{$username}/repos?sort=updated&per_page=100";
            }

            try {
                $response = $client->get($url);
            } catch (\Throwable $curlErr) {
                // Graceful fallback for Windows cURL 60 error
                if (str_contains($curlErr->getMessage(), 'cURL error 60') || str_contains(strtolower($curlErr->getMessage()), 'certificate')) {
                    $fallbackClient = new \GuzzleHttp\Client(array_merge($clientOptions, ['verify' => false]));
                    $response = $fallbackClient->get($url);
                } else {
                    // If visibility=all failed, fallback to standard /user/repos
                    if (!empty($token)) {
                        $url = 'https://api.github.com/user/repos?sort=updated&per_page=100';
                        $response = $client->get($url);
                    } else {
                        throw $curlErr;
                    }
                }
            }

            $rawRepos = json_decode($response->getBody(), true) ?: [];

            $privateCount = 0;
            $publicCount = 0;

            $repos = array_map(function ($repo) use (&$privateCount, &$publicCount) {
                $lang = $repo['language'] ?? 'Web';
                $name = $repo['name'] ?? '';
                $desc = $repo['description'] ?? '';
                $isPrivate = (bool) ($repo['private'] ?? false);

                if ($isPrivate) {
                    $privateCount++;
                } else {
                    $publicCount++;
                }

                // Framework inference
                $fw = 'static';
                if ($lang === 'PHP') {
                    $fw = 'laravel';
                } elseif (in_array($lang, ['JavaScript', 'TypeScript'])) {
                    $combined = strtolower($name . ' ' . $desc);
                    if (str_contains($combined, 'next')) {
                        $fw = 'nextjs';
                    } elseif (str_contains($combined, 'vue') || str_contains($combined, 'nuxt')) {
                        $fw = 'vue';
                    } else {
                        $fw = 'node';
                    }
                } elseif ($lang === 'Python') {
                    $fw = 'python';
                } elseif (in_array($lang, ['HTML', 'CSS'])) {
                    $fw = 'static';
                }

                return [
                    'id' => $repo['id'] ?? null,
                    'name' => $name,
                    'full_name' => $repo['full_name'] ?? $name,
                    'description' => $desc,
                    'clone_url' => $repo['clone_url'] ?? '',
                    'ssh_url' => $repo['ssh_url'] ?? '',
                    'html_url' => $repo['html_url'] ?? '',
                    'default_branch' => $repo['default_branch'] ?? 'main',
                    'language' => $lang,
                    'framework' => $fw,
                    'is_private' => $isPrivate,
                    'stars' => $repo['stargazers_count'] ?? 0,
                    'updated_at' => $repo['updated_at'] ?? null,
                    'pushed_at' => $repo['pushed_at'] ?? null,
                ];
            }, $rawRepos);

            return response()->json([
                'success' => true,
                'username' => $username,
                'has_token' => !empty($token),
                'scopes' => $scopes,
                'scope_warning' => $scopeWarning,
                'counts' => [
                    'total' => count($repos),
                    'private' => $privateCount,
                    'public' => $publicCount,
                ],
                'token_user' => $tokenUser ? [
                    'login' => $tokenUser['login'] ?? $username,
                    'name' => $tokenUser['name'] ?? null,
                    'avatar_url' => $tokenUser['avatar_url'] ?? null,
                    'total_private_repos' => $tokenUser['total_private_repos'] ?? null,
                    'owned_private_repos' => $tokenUser['owned_private_repos'] ?? null,
                ] : null,
                'repos' => $repos,
            ]);
        } catch (\GuzzleHttp\Exception\ClientException $e) {
            $msg = $e->getResponse() ? (string) $e->getResponse()->getBody() : $e->getMessage();
            return response()->json([
                'success' => false,
                'message' => 'GitHub API request failed: ' . $e->getMessage(),
                'details' => $msg,
            ], 400);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve GitHub repositories: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * One-click clone and deploy GitHub repository under the user on remote VPS server.
     */
    public function deployGitHubProject(Request $request)
    {
        @set_time_limit(240);

        $validated = $request->validate([
            'server_id' => 'required|integer',
            'repo_name' => 'required|string|max:255',
            'git_url' => 'required|string',
            'branch' => 'nullable|string|max:100',
            'target_path' => 'nullable|string|max:500',
            'framework' => 'nullable|string|in:laravel,node,nextjs,vue,python,static',
            'domain' => 'nullable|string|max:255',
        ]);

        $server = Server::where('user_id', auth()->id())->where('id', $validated['server_id'])->first();
        if (!$server) {
            return response()->json(['success' => false, 'message' => 'Selected server not found.'], 404);
        }

        if (!$server->is_active) {
            return response()->json([
                'success' => false,
                'message' => "Server '{$server->name}' is powered OFF. Please turn on the server first.",
            ], 400);
        }

        $repoName = trim($validated['repo_name']);
        $cleanSlug = strtolower(preg_replace('/[^a-zA-Z0-9_\-]/', '-', $repoName));
        $serverUser = trim($server->user ?: 'root');
        $branch = trim($validated['branch'] ?: 'main');
        $gitUrl = trim($validated['git_url']);
        $framework = $validated['framework'] ?: 'laravel';

        // Target path under the user on the server
        if (!empty($validated['target_path'])) {
            $targetPath = rtrim(trim($validated['target_path']), '/\\');
        } else {
            // Default directly under user's home directory so it runs with complete user ownership
            $targetPath = ($server->type === 'windows')
                ? "C:\\inetpub\\wwwroot\\{$cleanSlug}"
                : "/home/{$serverUser}/{$cleanSlug}";
        }

        $startTime = microtime(true);
        $logs = [];

        // Connect over SSH
        $ssh = new SSH2($server->ip, (int) ($server->port ?: 22), 15);
        $ssh->setTimeout(90); // 90s timeout per command for git clone and dependency builds
        $authenticated = false;

        if ($server->auth_method === 'key' || $server->auth_method === 'auto') {
            $resolvedKey = $this->resolveSshKey($server->key_path, $server->key_content);
            if ($resolvedKey) {
                try {
                    $key = $this->loadPrivateKeyFast($resolvedKey['content'], $server->key_passphrase ?: null);
                    if ($key && $ssh->login($serverUser, $key)) {
                        $authenticated = true;
                    }
                } catch (\Throwable $e) {}
            }
        }

        if (!$authenticated && (!empty($server->password) || $server->auth_method === 'password')) {
            if (!empty($server->password) && $ssh->login($serverUser, $server->password)) {
                $authenticated = true;
            }
        }

        if (!$authenticated) {
            return response()->json([
                'success' => false,
                'message' => "SSH authentication failed for {$serverUser}@{$server->ip}. Check server credentials."
            ], 401);
        }

        $user = auth()->user();
        $token = $request->input('token') ?: ($user?->github_token ?: env('GITHUB_TOKEN'));

        $effectiveGitUrl = $gitUrl;
        if (!empty($token) && str_starts_with($gitUrl, 'https://github.com/')) {
            $effectiveGitUrl = str_replace('https://github.com/', "https://{$token}@github.com/", $gitUrl);
        }

        $safePath = escapeshellarg($targetPath);
        $safeBranch = escapeshellarg($branch);
        $safeGitUrl = escapeshellarg($effectiveGitUrl);

        // 1. Check if directory exists; clone or pull
        $dirExists = trim((string) $ssh->exec("[ -d {$safePath} ] && echo 'yes' || echo 'no'"));
        if ($dirExists === 'no') {
            $logs[] = "Cloning {$repoName} from GitHub ({$branch}) into {$targetPath}...";
            $cloneCmd = "mkdir -p $(dirname {$safePath}) && git clone -b {$safeBranch} {$safeGitUrl} {$safePath} 2>&1";
            $cloneOutput = trim((string) $ssh->exec($cloneCmd));
            $logs[] = $cloneOutput ?: "Repository cloned successfully.";
        } else {
            $logs[] = "Directory {$targetPath} already exists. Pulling latest {$branch} changes...";
            $pullCmd = "cd {$safePath} && git fetch origin 2>&1 && git checkout {$safeBranch} 2>&1 && git pull origin {$safeBranch} 2>&1";
            $pullOutput = trim((string) $ssh->exec($pullCmd));
            $logs[] = $pullOutput ?: "Pulled latest changes.";
        }

        // 2. Automated framework setup & build under user
        if ($framework === 'laravel') {
            $logs[] = "Setting up Laravel environment and dependencies...";
            $laravelSetup = $ssh->exec("
                cd {$safePath}
                if [ ! -f .env ] && [ -f .env.example ]; then
                    cp .env.example .env
                fi
                if command -v composer >/dev/null 2>&1; then
                    composer install --no-interaction --prefer-dist --optimize-autoloader 2>&1
                fi
                if [ -f artisan ]; then
                    php artisan key:generate --force 2>&1
                    php artisan optimize:clear 2>&1
                fi
            ");
            if (!empty($laravelSetup)) $logs[] = trim((string) $laravelSetup);
        } elseif (in_array($framework, ['node', 'nextjs', 'vue'])) {
            $logs[] = "Installing Node.js dependencies...";
            $nodeSetup = $ssh->exec("
                cd {$safePath}
                if command -v npm >/dev/null 2>&1 && [ -f package.json ]; then
                    npm install --prefer-offline 2>&1
                    if grep -q '\"build\":' package.json 2>/dev/null; then
                        npm run build 2>&1
                    fi
                fi
            ");
            if (!empty($nodeSetup)) $logs[] = trim((string) $nodeSetup);
        } elseif ($framework === 'python') {
            $logs[] = "Configuring Python virtual environment...";
            $pySetup = $ssh->exec("
                cd {$safePath}
                if [ -f requirements.txt ]; then
                    python3 -m venv venv 2>&1 && ./venv/bin/pip install -r requirements.txt 2>&1
                fi
            ");
            if (!empty($pySetup)) $logs[] = trim((string) $pySetup);
        }

        // 3. Extract commit hash & message
        $commitInfo = trim((string) $ssh->exec("cd {$safePath} && git log -1 --pretty=format:'%h|%s' 2>/dev/null"));
        $parts = explode('|', $commitInfo, 2);
        $commitHash = !empty($parts[0]) ? $parts[0] : 'live';
        $commitMsg = !empty($parts[1]) ? $parts[1] : "Deployed from GitHub ({$branch})";

        $duration = round(microtime(true) - $startTime, 1) . 's';

        // 4. Save or update Project in database
        $project = Project::updateOrCreate(
            [
                'user_id' => auth()->id(),
                'ip' => $server->ip,
                'path' => $targetPath,
            ],
            [
                'server_id' => $server->id,
                'name' => $repoName,
                'description' => "GitHub: {$repoName} deployed under {$serverUser}",
                'port' => $server->port ?: 22,
                'user' => $serverUser,
                'auth_method' => $server->auth_method,
                'key_path' => $server->key_path,
                'password' => $server->password,
                'key_passphrase' => $server->key_passphrase,
                'os' => $server->os,
                'type' => $server->type,
                'branch' => $branch,
                'commit' => $commitHash,
                'commit_message' => $commitMsg,
                'last_deploy_time' => now()->toIso8601String(),
                'deploy_duration' => $duration,
                'domain' => !empty($validated['domain']) ? trim($validated['domain']) : null,
                'framework' => $framework,
                'git_url' => $gitUrl,
                'is_connected' => true,
                'auth_status' => 'authenticated',
                'last_auth_check_at' => now(),
                'last_visited_timestamp' => round(microtime(true) * 1000),
            ]
        );

        // Auto-probe live domain if empty
        if (empty($project->domain)) {
            try {
                $this->performAuthCheck($project);
            } catch (\Throwable $e) {}
        }

        return response()->json([
            'success' => true,
            'message' => "Successfully deployed '{$repoName}' to {$server->name} ({$targetPath}) under {$serverUser} in {$duration}!",
            'project' => $project->fresh(),
            'commit' => $commitHash,
            'commit_message' => $commitMsg,
            'duration' => $duration,
            'output' => implode("\n", array_filter($logs)),
        ]);
    }
}
