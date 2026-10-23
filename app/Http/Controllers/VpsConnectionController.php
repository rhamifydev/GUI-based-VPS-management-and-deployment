<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use phpseclib4\Net\SSH2;
use phpseclib4\Crypt\PublicKeyLoader;
use Illuminate\Support\Facades\Log;

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
          fw="Laravel 11"
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
          commitMsg=$(git -C "$dir" log -1 --pretty=%B 2>/dev/null | head -n 1 || echo "")
        fi
        
        echo "RHAMIFY_DIR|$bname|$dir|$fw|$branch|$commit|$commitMsg"
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

                            $folders[] = [
                                'id' => 'real-' . md5($path),
                                'name' => $name,
                                'path' => $path,
                                'framework' => $framework,
                                'type' => str_contains(strtolower($framework), 'laravel') ? 'laravel' : (str_contains(strtolower($framework), 'node') ? 'node' : 'static'),
                                'branch' => $branch ?: 'main',
                                'commit' => $commit ?: 'c90bf14',
                                'commitMessage' => $msg ?: 'Live directory on ' . $ip,
                                'lastUpdated' => 'Live Node',
                                'domain' => "{$name}.{$ip}.nip.io",
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
                            'domain' => "vps.{$ip}.nip.io",
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
