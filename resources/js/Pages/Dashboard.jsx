import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import {
    Server,
    CheckCircle2,
    Play,
    RefreshCw,
    Activity,
    Cpu,
    HardDrive,
    Database,
    Radio,
    Terminal,
    GitBranch,
    Shield,
    ExternalLink,
    Zap,
    Clock,
    Check,
    Plus,
    X,
    Monitor,
    ChevronRight,
    ArrowLeft,
    Copy,
    Lock,
    Key,
    AlertCircle,
    Sparkles,
    UserPlus,
    ShieldAlert,
    FolderGit2,
    Folder,
    Search,
    Power,
    Globe,
    Trash2,
    RotateCcw,
    Layers,
    Sliders,
    ArrowUpRight
} from 'lucide-react';

export default function Dashboard() {
    const user = usePage().props.auth.user;

    // Quick deploy state
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployStatus, setDeployStatus] = useState(null);

    // Modal state for Server Setup & Onboarding
    const [setupModalOpen, setSetupModalOpen] = useState(false);
    const [selectedOs, setSelectedOs] = useState(null); // 'linux' | 'windows' | null
    const [authMethod, setAuthMethod] = useState('auto'); // 'auto' | 'password' | 'custom_key'

    // Form fields for Linux
    const [linuxIp, setLinuxIp] = useState('');
    const [linuxPort, setLinuxPort] = useState('22');
    const [linuxUser, setLinuxUser] = useState('');
    const [linuxPassword, setLinuxPassword] = useState('');
    const [linuxKey, setLinuxKey] = useState('');
    const [keyPassphrase, setKeyPassphrase] = useState('');
    const [showPassphrasePrompt, setShowPassphrasePrompt] = useState(false);
    const [passphraseKeyName, setPassphraseKeyName] = useState('');
    const [showLinuxBootstrap, setShowLinuxBootstrap] = useState(false);

    // Root prompt & sub-account creation state for Linux
    const [showRootPrompt, setShowRootPrompt] = useState(false);
    const [showNewAccountForm, setShowNewAccountForm] = useState(false);
    const [newAccountUser, setNewAccountUser] = useState('rhamifytechnology');
    const [newAccountPassword, setNewAccountPassword] = useState('');
    const [accountCreatedSuccess, setAccountCreatedSuccess] = useState(false);

    // Form fields for Windows
    const [windowsIp, setWindowsIp] = useState('');
    const [windowsPort, setWindowsPort] = useState('22');
    const [windowsUser, setWindowsUser] = useState('');
    const [windowsPassword, setWindowsPassword] = useState('');
    const [showWinBootstrap, setShowWinBootstrap] = useState(false);

    // Sub-account creation state for Windows
    const [showWinAdminPrompt, setShowWinAdminPrompt] = useState(false);
    const [showWinAccountForm, setShowWinAccountForm] = useState(false);
    const [newWinAccountUser, setNewWinAccountUser] = useState('deployer');
    const [newWinAccountPassword, setNewWinAccountPassword] = useState('');
    const [winAccountCreatedSuccess, setWinAccountCreatedSuccess] = useState(false);

    // Custom center verification alert state
    const [centerAlert, setCenterAlert] = useState(null);

    const triggerAlert = (message, title = 'Verification Notice', type = 'warning', buttonText = 'Understood') => {
        setCenterAlert({ message, title, type, buttonText });
    };

    // Modal Step & Server Explorer state
    const [setupStep, setSetupStep] = useState('credentials'); // 'credentials' | 'explorer'
    const [explorerTab, setExplorerTab] = useState('existing'); // 'existing' | 'new' | 'logs'
    const [folderSearchQuery, setFolderSearchQuery] = useState('');
    const [serverFolders, setServerFolders] = useState([]);

    // Live Command Visibility State
    const [copiedCmd, setCopiedCmd] = useState(false);
    const [liveCommandLogs, setLiveCommandLogs] = useState([]);

    const handleCopyCommand = (cmdText) => {
        if (!cmdText) return;
        navigator.clipboard.writeText(cmdText);
        setCopiedCmd(true);
        setTimeout(() => setCopiedCmd(false), 2000);
    };

    // New project form state in explorer
    const [newProjName, setNewProjName] = useState('');
    const [newProjDir, setNewProjDir] = useState('/var/www/');
    const [newProjType, setNewProjType] = useState('laravel');
    const [newProjGit, setNewProjGit] = useState('');
    const [newProjBranch, setNewProjBranch] = useState('main');
    const [newProjDomain, setNewProjDomain] = useState('');

    // Connection testing state
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [testLog, setTestLog] = useState(null);
    const [connectedServer, setConnectedServer] = useState(null);

    const generatedLinuxCmd = (() => {
        const user = linuxUser || '<username>';
        const host = linuxIp || '<server-ip>';
        const portPart = (linuxPort && linuxPort !== '22') ? `-p ${linuxPort} ` : '';
        const keyPart = authMethod === 'custom_key' && linuxKey ? `-i ${linuxKey} ` : '';
        return `ssh ${portPart}${keyPart}${user}@${host}`;
    })();
    const generatedWinCmd = `ssh -p ${windowsPort || '22'} ${windowsUser || '<username>'}@${windowsIp || '<server-ip>'}`;

    const defaultProjects = [
        {
            id: 'proj-1',
            name: 'rhamify_app',
            description: 'Core Laravel + Inertia.js web platform with queue workers, Redis cache, and Supervisor daemons.',
            ip: '147.93.85.120',
            port: '22',
            user: 'rhamifytechnology',
            os: 'Ubuntu 24.04 LTS (x86_64)',
            type: 'linux',
            branch: 'main',
            commit: '47317d1',
            commitMessage: 'fix(mobile): optimize header layout, prevent button wrapping',
            lastDeployTime: '14 mins ago',
            deployDuration: '18s',
            domain: 'new.rhamify.com',
            isConnected: true,
            status: 'Online & Synced',
            isDeploying: false,
            deployProgress: null,
            lastVisited: 'Just now',
            lastVisitedTimestamp: Date.now(),
        },
        {
            id: 'proj-2',
            name: 'gui-vps-management',
            description: 'Automated VPS deployment, cloud server provisioning, and daemon orchestration dashboard.',
            ip: '147.93.85.130',
            port: '22',
            user: 'deployer',
            os: 'Windows Server 2022 (WinRM / OpenSSH)',
            type: 'windows',
            branch: 'feature/vps-gui',
            commit: '8cad496',
            commitMessage: 'feat(ui): implement interactive VPS wizard & real-time deployment status',
            lastDeployTime: '3 hours ago',
            deployDuration: '24s',
            domain: 'vps.rhamify.com',
            isConnected: false,
            status: 'Disconnected (Logged out)',
            isDeploying: false,
            deployProgress: null,
            lastVisited: '2 hours ago',
            lastVisitedTimestamp: Date.now() - 7200000,
        }
    ];

    const [projects, setProjects] = useState([]);

    // Toggle server connection on a project card (Connect Server / Disconnect Server)
    const toggleServerConnection = (projectId) => {
        const now = Date.now();
        setProjects(prevProjects => {
            const updated = prevProjects.map(proj => {
                if (proj.id === projectId) {
                    const nextConnected = !proj.isConnected;
                    return {
                        ...proj,
                        isConnected: nextConnected,
                        status: nextConnected ? 'Online & Synced' : 'Disconnected (Logged out)',
                        lastVisited: 'Just now',
                        lastVisitedTimestamp: now,
                    };
                }
                return proj;
            });
            // Automatically arrange by last visited (newest first)
            return [...updated].sort((a, b) => b.lastVisitedTimestamp - a.lastVisitedTimestamp);
        });
    };

    // Trigger ongoing deployment on a specific project card
    const handleProjectDeploy = (projectId) => {
        const now = Date.now();
        setProjects(prevProjects => {
            const updated = prevProjects.map(p => {
                if (p.id === projectId) {
                    return {
                        ...p,
                        isDeploying: true,
                        deployProgress: 'Starting automated build & deployment sequence...',
                        lastVisited: 'Just now',
                        lastVisitedTimestamp: now,
                    };
                }
                return p;
            });
            return [...updated].sort((a, b) => b.lastVisitedTimestamp - a.lastVisitedTimestamp);
        });

        setTimeout(() => {
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, deployProgress: 'Pulling git updates & compiling assets...' } : p));
        }, 1200);

        setTimeout(() => {
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, deployProgress: 'Running database migrations & restarting daemons...' } : p));
        }, 2200);

        setTimeout(() => {
            setProjects(prev => prev.map(p => p.id === projectId ? {
                ...p,
                isDeploying: false,
                deployProgress: null,
                isConnected: true,
                status: 'Online & Synced',
                lastDeployTime: 'Just now',
                deployDuration: '18s',
                commit: 'a1f89c2',
                commitMessage: 'chore(deploy): automated production sync & asset compilation',
                lastVisited: 'Just now',
                lastVisitedTimestamp: Date.now(),
            } : p));
        }, 3200);
    };

    const removeProject = (projectId) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
    };

    const restoreSampleProjects = () => {
        setProjects(defaultProjects);
    };

    const handleQuickDeploy = () => {
        setIsDeploying(true);
        setDeployStatus('Starting deployment sequence...');
        setTimeout(() => setDeployStatus('Entering maintenance mode & pulling main branch...'), 800);
        setTimeout(() => setDeployStatus('Installing composer packages & compiling assets...'), 1600);
        setTimeout(() => setDeployStatus('Running database migrations & restarting queue...'), 2400);
        setTimeout(() => {
            setIsDeploying(false);
            setDeployStatus('Deployment completed successfully! Live on new.rhamify.com');
        }, 3200);
    };

    const handleSignInAttempt = (os) => {
        if (os === 'linux') {
            if (!linuxIp || !linuxIp.trim()) {
                triggerAlert('Please enter your Server IP address or hostname before connecting.', 'Server IP Required', 'warning');
                return;
            }
            if (!linuxPort || !linuxPort.trim()) {
                triggerAlert('Please specify a valid SSH port (default is 22).', 'SSH Port Required', 'warning');
                return;
            }
            const user = (linuxUser || '').trim().toLowerCase();
            if (!user) {
                triggerAlert('Please enter an SSH username (e.g. root or sub-account).', 'Username Required', 'warning');
                return;
            }
            if (authMethod === 'custom_key' && (!linuxKey || !linuxKey.trim())) {
                triggerAlert('Please enter your custom SSH Private Key path (or switch to Auto-detect).', 'SSH Key Required', 'warning');
                return;
            }
            if (authMethod === 'password' && (!linuxPassword || !linuxPassword.trim())) {
                triggerAlert('Please enter your SSH account password to proceed.', 'Password Required', 'warning');
                return;
            }
            if (user === 'root') {
                setShowRootPrompt(true);
                return;
            }
            handleTestAndConnect('linux');
        } else {
            if (!windowsIp || !windowsIp.trim()) {
                triggerAlert('Please enter your Windows Host or IP address before connecting.', 'Windows Host Required', 'warning');
                return;
            }
            if (!windowsPort || !windowsPort.trim()) {
                triggerAlert('Please specify a valid port (default is 22).', 'Port Required', 'warning');
                return;
            }
            const user = (windowsUser || '').trim().toLowerCase();
            if (!user) {
                triggerAlert('Please enter a Windows username (e.g. Administrator or sub-account).', 'Username Required', 'warning');
                return;
            }
            if (!windowsPassword || !windowsPassword.trim()) {
                triggerAlert('Please enter the password for this Windows user account.', 'Password Required', 'warning');
                return;
            }
            if (user === 'administrator') {
                setShowWinAdminPrompt(true);
                return;
            }
            handleTestAndConnect('windows');
        }
    };

    const handleTestAndConnect = async (os, userOverride = null, passphraseOverride = null) => {
        const targetUser = (userOverride || (os === 'linux' ? linuxUser : windowsUser) || '').trim();
        const targetIp = (os === 'linux' ? linuxIp : windowsIp || '').trim();
        const targetPort = (os === 'linux' ? linuxPort : windowsPort || '22').trim();
        const targetPassword = os === 'linux' ? linuxPassword : windowsPassword;
        const targetKeyPath = os === 'linux' && authMethod === 'custom_key' ? linuxKey : '';
        const currentPassphrase = passphraseOverride !== null ? passphraseOverride : keyPassphrase;

        const portPart = (targetPort && targetPort !== '22') ? `-p ${targetPort} ` : '';
        const keyPart = targetKeyPath ? `-i ${targetKeyPath} ` : '';
        const activeConnectCmd = `ssh ${portPart}${keyPart}${targetUser}@${targetIp}`;

        setIsTestingConnection(true);
        setTestLog(`Connecting via SSH to ${targetUser}@${targetIp}...`);

        setLiveCommandLogs((prev) => [
            ...prev.slice(-3),
            {
                time: new Date().toLocaleTimeString(),
                cmd: activeConnectCmd,
                status: 'running',
                output: `Initiating encrypted SSH-2.0 connection to ${targetIp}:${targetPort}...`
            }
        ]);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/vps/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    os: os,
                    ip: targetIp,
                    port: targetPort,
                    user: targetUser,
                    auth_method: authMethod === 'custom_key' ? 'key' : authMethod,
                    password: targetPassword,
                    key_path: targetKeyPath,
                    key_passphrase: currentPassphrase || null,
                })
            });

            const data = await res.json();

            // Check if key requires passphrase unlock
            if (data.requires_passphrase) {
                setIsTestingConnection(false);
                setTestLog(null);
                setShowPassphrasePrompt(true);
                setPassphraseKeyName(data.key_name || 'id_ed25519');
                if (data.commands && Array.isArray(data.commands)) {
                    setLiveCommandLogs(data.commands);
                }
                return;
            }

            if (!res.ok || !data.success) {
                setIsTestingConnection(false);
                setTestLog(null);
                setShowPassphrasePrompt(false);
                if (data.commands && Array.isArray(data.commands)) {
                    setLiveCommandLogs(data.commands);
                } else {
                    setLiveCommandLogs([
                        {
                            time: new Date().toLocaleTimeString(),
                            cmd: activeConnectCmd,
                            status: 'failed',
                            output: data.message || `Unable to establish SSH connection to ${targetUser}@${targetIp}.`
                        }
                    ]);
                }
                triggerAlert(
                    data.message || `Unable to establish SSH connection to ${targetUser}@${targetIp}. Please verify your credentials and ensure port ${targetPort} is open in your server firewall.`,
                    'SSH Authentication Failed',
                    'error'
                );
                return;
            }

            // Real live connection succeeded!
            setIsTestingConnection(false);
            setTestLog(null);
            setShowPassphrasePrompt(false);
            setKeyPassphrase('');
            if (data.commands && Array.isArray(data.commands)) {
                setLiveCommandLogs(data.commands);
            }
            setConnectedServer(data.server);
            setServerFolders(data.folders || []);
            setNewProjDir(os === 'linux' ? '/var/www/' : 'C:\\inetpub\\wwwroot\\');
            setSetupStep('explorer');
            setExplorerTab('existing');
            setShowRootPrompt(false);
            setShowWinAdminPrompt(false);

        } catch (err) {
            setIsTestingConnection(false);
            setTestLog(null);
            setShowPassphrasePrompt(false);
            setLiveCommandLogs([
                {
                    time: new Date().toLocaleTimeString(),
                    cmd: activeConnectCmd,
                    status: 'failed',
                    output: `Network error: ${err.message}`
                }
            ]);
            triggerAlert(
                `Network error connecting to VPS backend: ${err.message}.`,
                'Connection Network Error',
                'error'
            );
        }
    };

    const handlePassphraseSubmit = (e) => {
        if (e) e.preventDefault();
        if (!keyPassphrase.trim()) {
            triggerAlert('Please enter the passphrase for your key.', 'Passphrase Required', 'warning');
            return;
        }
        handleTestAndConnect('linux', null, keyPassphrase);
    };

    const handleSelectServerFolder = (folder) => {
        const newProject = {
            id: 'proj-' + Date.now(),
            name: folder.name,
            description: folder.description || `${folder.framework} project on ${connectedServer.os}`,
            ip: connectedServer.ip,
            port: connectedServer.port,
            user: connectedServer.user,
            os: connectedServer.os,
            type: connectedServer.type,
            branch: folder.branch || 'main',
            commit: folder.commit || '47317d1',
            commitMessage: 'feat(deploy): linked server directory ' + folder.path,
            lastDeployTime: 'Just now',
            deployDuration: '12s',
            domain: folder.domain || `${folder.name}.rhamify.com`,
            path: folder.path,
            framework: folder.framework,
            isConnected: true,
            status: 'Online & Synced',
            isDeploying: false,
            deployProgress: null,
            lastVisited: 'Just now',
            lastVisitedTimestamp: Date.now(),
        };

        const existingIndex = projects.findIndex(p => p.ip === connectedServer.ip && p.name === folder.name);
        if (existingIndex >= 0) {
            setProjects(prev => {
                const copy = [...prev];
                copy[existingIndex] = {
                    ...copy[existingIndex],
                    isConnected: true,
                    status: 'Online & Synced',
                    lastVisited: 'Just now',
                    lastVisitedTimestamp: Date.now()
                };
                return copy.sort((a, b) => b.lastVisitedTimestamp - a.lastVisitedTimestamp);
            });
        } else {
            setProjects(prev => [newProject, ...prev]);
        }

        setSetupModalOpen(false);
        triggerAlert(`Project "${folder.name}" (${folder.path}) is now active on your dashboard.`, 'Project Successfully Linked', 'success');
    };

    const handleCreateNewProject = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!newProjName || !newProjName.trim()) {
            triggerAlert('Please provide a name for your new project.', 'Project Name Required', 'warning');
            return;
        }

        const cleanName = newProjName.trim().replace(/\s+/g, '-').toLowerCase();
        const basePath = newProjDir.trim() || (connectedServer?.type === 'windows' ? 'C:\\inetpub\\wwwroot\\' : '/var/www/');
        const fullPath = basePath.endsWith('/') || basePath.endsWith('\\') 
            ? `${basePath}${cleanName}` 
            : `${basePath}/${cleanName}`;

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/vps/create-project', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    ip: connectedServer?.ip,
                    port: connectedServer?.port,
                    user: connectedServer?.user,
                    auth_method: authMethod,
                    password: connectedServer?.type === 'linux' ? linuxPassword : windowsPassword,
                    key_path: connectedServer?.type === 'linux' ? linuxKey : '',
                    project_name: cleanName,
                    project_path: fullPath,
                    framework: newProjType,
                    git_url: newProjGit.trim() || null
                })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                triggerAlert(data.message || 'Failed to create directory on remote server.', 'Creation Failed', 'error');
                return;
            }

            const newProject = {
                id: 'proj-' + Date.now(),
                name: cleanName,
                description: `Live ${newProjType.toUpperCase()} project created on ${connectedServer?.ip} at ${fullPath}`,
                ip: connectedServer?.ip,
                port: connectedServer?.port,
                user: connectedServer?.user,
                os: connectedServer?.os,
                type: connectedServer?.type,
                branch: newProjBranch.trim() || 'main',
                commit: 'live-init',
                commitMessage: `chore(init): initialized project directory on ${connectedServer?.ip}`,
                lastDeployTime: 'Just now',
                deployDuration: '6s',
                domain: newProjDomain.trim() || `${cleanName}.${connectedServer?.ip}.nip.io`,
                path: fullPath,
                gitUrl: newProjGit.trim(),
                framework: newProjType === 'laravel' ? 'Laravel 11 (PHP 8.4)' : newProjType === 'node' ? 'Node.js / Express' : newProjType === 'python' ? 'Python / Django' : 'Static Web / HTML',
                isConnected: true,
                status: 'Online & Synced',
                isDeploying: false,
                deployProgress: null,
                lastVisited: 'Just now',
                lastVisitedTimestamp: Date.now(),
            };

            setProjects(prev => [newProject, ...prev]);
            
            // Add to server folders list
            setServerFolders(prev => [
                {
                    id: 'fold-' + Date.now(),
                    name: cleanName,
                    path: fullPath,
                    framework: newProject.framework,
                    type: newProjType,
                    branch: newProject.branch,
                    commit: newProject.commit,
                    lastUpdated: 'Just now',
                    domain: newProject.domain,
                    description: newProject.description
                },
                ...prev
            ]);

            setSetupModalOpen(false);
            triggerAlert(`Project "${cleanName}" was created on ${connectedServer?.ip} at ${fullPath} and linked to your dashboard!`, 'Project Created & Linked', 'success');

            setNewProjName('');
            setNewProjGit('');
            setNewProjDomain('');
        } catch (err) {
            triggerAlert('Network error while creating project on server: ' + err.message, 'Project Creation Error', 'error');
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="VPS Management Dashboard" />

            <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
               
                {/* Onboarding Intent Quick Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-white">VPS Connection Assistant</span>
                                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-mono whitespace-nowrap inline-block">
                                    Linux & Windows Ready
                                </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-relaxed">
                                Connect an existing server with login details, or start from scratch with guided cloud provisioning.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedOs(null);
                            setSetupModalOpen(true);
                        }}
                        className="w-full sm:w-auto justify-center px-4 py-2.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 flex-shrink-0"
                    >
                        <span>Configure Server</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="space-y-8">
                    {/* Live deployment toast banner */}
                    {deployStatus && (
                        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-200 shadow-xl">
                            <div className="flex items-center gap-3">
                                {isDeploying ? (
                                    <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                )}
                                <span className="font-mono">{deployStatus}</span>
                            </div>
                            {!isDeploying && (
                                <button
                                    onClick={() => setDeployStatus(null)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    Dismiss
                                </button>
                            )}
                        </div>
                    )}

                    {/* Big Container for Projects / Ongoing Deployments */}
                    <div className="bg-[#0E131F] border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl relative">
                        {/* Container Header Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-slate-800/80">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-indigo-400" />
                                        <span>Projects & Deployments</span>
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                                        {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                    <span>Active instances & previous work</span>                                
                                </p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                {projects.length > 0 ? (
                                    <>
                                        <button
                                            onClick={() => setProjects([])}
                                            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
                                            title="Simulate / View empty state"
                                        >
                                            View Empty State
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedOs(null);
                                                setSetupStep(connectedServer.status === 'Connected & Verified' ? 'explorer' : 'credentials');
                                                setSetupModalOpen(true);
                                            }}
                                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>New Project</span>
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={restoreSampleProjects}
                                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>Restore Sample Projects</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Big Container Body */}
                        <div className="mt-5 sm:mt-6">
                            {projects.length === 0 ? (
                                /* Empty State: You have no project run for */
                                <div className="py-14 sm:py-20 px-4 sm:px-6 text-center flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 bg-[#080B12]/60">
                                    <div className="w-16 h-16 rounded-3xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center mb-5 text-indigo-400 shadow-xl shadow-indigo-950/50">
                                        <FolderGit2 className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2">
                                        You have no project run for
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
                                        There are currently no ongoing deployments or active server projects running. Use the VPS Connection Assistant above to connect an instance and deploy your first application.
                                    </p>
                                    <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={() => {
                                                setSelectedOs(null);
                                                setSetupModalOpen(true);
                                            }}
                                            className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Deploy First Project</span>
                                        </button>
                                        <button
                                            onClick={restoreSampleProjects}
                                            className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium text-xs transition-colors flex items-center gap-2"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                                            <span>Load Sample Projects</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Project Cards Grid */
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                    {projects.map((project) => (
                                        <div
                                            key={project.id}
                                            className="bg-[#080B12] border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 lg:p-6 transition-all shadow-xl flex flex-col justify-between relative group"
                                        >
                                            {/* Top section: Project info & Switch Button */}
                                            <div>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800/70">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                                                            project.type === 'linux'
                                                                ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-400'
                                                                : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400'
                                                        }`}>
                                                            {project.type === 'linux' ? (
                                                                <Terminal className="w-5 h-5" />
                                                            ) : (
                                                                <Monitor className="w-5 h-5" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h4 className="text-sm sm:text-base font-bold text-white font-mono truncate">
                                                                    {project.name}
                                                                </h4>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                                                                    project.type === 'linux'
                                                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                                                }`}>
                                                                    {project.type}
                                                                </span>
                                                            </div>
                                                            <div className="mt-1 flex items-center gap-2 flex-wrap">
                                                                {project.isDeploying ? (
                                                                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] sm:text-[11px] font-medium flex items-center gap-1.5 animate-pulse">
                                                                        <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                                                                        Ongoing Deploy...
                                                                    </span>
                                                                ) : project.isConnected ? (
                                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-[11px] font-medium flex items-center gap-1.5">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                                                        Online & Synced
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] sm:text-[11px] font-medium flex items-center gap-1.5">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                                                        Disconnected (Logged out)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Switch Button for Connect Server / Disconnect Server (Logout Server) */}
                                                    <div className="flex items-center justify-between sm:justify-end gap-2.5 bg-slate-900/90 border border-slate-800 px-3 py-2 sm:py-1.5 rounded-xl w-full sm:w-auto flex-shrink-0">
                                                        <div className="flex flex-col text-left sm:text-right">
                                                            <span className={`text-[11px] font-bold ${project.isConnected ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                                {project.isConnected ? 'Server Connected' : 'Server Disconnected'}
                                                            </span>
                                                            <span className="text-[9px] text-slate-400">
                                                                {project.isConnected ? 'Click to logout / disconnect' : 'Click to connect server'}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={project.isConnected}
                                                            onClick={() => toggleServerConnection(project.id)}
                                                            title={project.isConnected ? 'Disconnect Server (Logout Server)' : 'Connect Server'}
                                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                                project.isConnected
                                                                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                                                                    : 'bg-slate-700'
                                                            }`}
                                                        >
                                                            <span className="sr-only">Toggle server connection</span>
                                                            <span
                                                                aria-hidden="true"
                                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                    project.isConnected ? 'translate-x-5' : 'translate-x-0'
                                                                }`}
                                                            />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Ongoing deploy alert banner if deploying */}
                                                {project.isDeploying && (
                                                    <div className="mt-3.5 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-pulse">
                                                        <div className="flex items-center gap-2">
                                                            <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin flex-shrink-0" />
                                                            <span className="font-mono text-[11px] break-all">{project.deployProgress || 'Ongoing project deploy in progress...'}</span>
                                                        </div>
                                                        <span className="text-[10px] uppercase font-bold text-indigo-300 self-start sm:self-auto">Active Deploy</span>
                                                    </div>
                                                )}

                                                {/* Project description */}
                                                <p className="text-xs text-slate-300 mt-3 leading-relaxed break-words">
                                                    {project.description}
                                                </p>

                                                {/* Deployment Stats: Last Deploy Time, Time it takes, and Commit Message */}
                                                <div className="mt-3.5 p-3 sm:p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2.5">
                                                    {/* Deploy timing & duration */}
                                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-2.5 border-b border-slate-800/70">
                                                        <div className="flex items-center gap-1.5 font-mono">
                                                            <Clock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                                            <span className="text-slate-400 text-[11px]">Last deploy:</span>
                                                            <span className="text-slate-200 font-semibold text-[11px]">{project.lastDeployTime || 'Just now'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 font-mono">
                                                            <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                                            <span className="text-slate-400 text-[11px]">Time it takes:</span>
                                                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-[11px]">
                                                                {project.deployDuration || '18s'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Commit & commit message */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-[11px] flex-wrap">
                                                            <GitBranch className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                                            <span className="font-mono text-indigo-300 font-semibold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 text-[10px]">
                                                                commit: {project.commit || '47317d1'}
                                                            </span>
                                                            <span className="text-slate-400 text-[10px] font-mono">({project.branch || 'main'})</span>
                                                        </div>
                                                    </div>

                                                    {/* Server Host & Domain details */}
                                                    <div className="pt-2 border-t border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] font-mono text-slate-400">
                                                        <div className="truncate">
                                                            <span className="text-slate-400 uppercase text-[10px]">Host: </span>
                                                            <span className="text-slate-200 font-medium">{project.ip}:{project.port} ({project.user})</span>
                                                        </div>
                                                        <div className="truncate">
                                                            <span className="text-slate-400 uppercase text-[10px]">Domain: </span>
                                                            <span className="text-cyan-400 font-semibold">{project.domain}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Last Visited Indicator */}
                                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                                        <span>Last visited: <strong className="text-slate-200">{project.lastVisited}</strong></span>
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">OS: {project.os}</span>
                                                </div>
                                            </div>

                                            {/* Card Action Buttons (Mobile-friendly) */}
                                            <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                    <button
                                                        onClick={() => handleProjectDeploy(project.id)}
                                                        disabled={project.isDeploying}
                                                        className="flex-1 sm:flex-initial justify-center px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-600/30"
                                                    >
                                                        {project.isDeploying ? (
                                                            <>
                                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                                <span>Deploying...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Play className="w-3.5 h-3.5 fill-white" />
                                                                <span>Trigger Deploy</span>
                                                            </>
                                                        )}
                                                    </button>
                                                    <a
                                                        href={`http://${project.domain}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex-1 sm:flex-initial justify-center px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                                                    >
                                                        <span>Visit Site</span>
                                                        <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                                                    </a>
                                                </div>

                                                <div className="flex items-center justify-end gap-2 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 sm:border-transparent">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedOs(project.type);
                                                            setSetupModalOpen(true);
                                                        }}
                                                        className="flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs"
                                                        title="Server Settings"
                                                    >
                                                        <Sliders className="w-3.5 h-3.5" />
                                                        <span className="sm:hidden text-[11px]">Settings</span>
                                                    </button>
                                                    <button
                                                        onClick={() => removeProject(project.id)}
                                                        className="flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors flex items-center gap-1.5 text-xs"
                                                        title="Remove project"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        <span className="sm:hidden text-[11px]">Remove</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* BIG VPS CONNECTION & SETUP WIZARD MODAL (LINUX VS WINDOWS + INTENT) */}
            {/* ========================================================================= */}
            {setupModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
                        onClick={() => setSetupModalOpen(false)}
                    />

                    {/* Modal Card */}
                    <div className="relative bg-[#0E131F] border border-slate-800 rounded-2xl sm:rounded-3xl max-w-3xl w-full p-4 sm:p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                        {setupStep === 'explorer' ? (
                            <div>
                                {/* Explorer Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => setSetupStep('credentials')}
                                            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2 transition-colors font-medium"
                                        >
                                            <ArrowLeft className="w-3.5 h-3.5" />
                                            <span>Back to Server Credentials</span>
                                        </button>
                                        <h3 className="font-heading text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                                            <FolderGit2 className="w-6 h-6 text-indigo-400" />
                                            <span>Server Projects & Directories</span>
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                                <span>Connected: {connectedServer?.user}@{connectedServer?.ip}:{connectedServer?.port}</span>
                                            </span>
                                            <span className="text-xs text-slate-400 font-mono">
                                                {connectedServer?.os}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSetupModalOpen(false)}
                                        className="self-start sm:self-center p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Tab switch: Folders on Server vs Create New Project */}
                                <div className="mt-5 flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800/80">
                                    <div className="inline-flex p-1 rounded-xl bg-slate-900/90 border border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => setExplorerTab('existing')}
                                            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                                                explorerTab === 'existing'
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            <Folder className="w-4 h-4" />
                                            <span>Folders on Server ({serverFolders.length})</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setExplorerTab('new')}
                                            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                                                explorerTab === 'new'
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Create New Project</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setExplorerTab('logs')}
                                            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                                                explorerTab === 'logs'
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            <Terminal className="w-4 h-4 text-emerald-400" />
                                            <span>Commands Run ({liveCommandLogs.length})</span>
                                        </button>
                                    </div>

                                    {explorerTab === 'existing' && (
                                        <div className="relative w-full sm:w-64">
                                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={folderSearchQuery}
                                                onChange={(e) => setFolderSearchQuery(e.target.value)}
                                                placeholder="Filter folders or path..."
                                                className="w-full pl-8 pr-3 py-1.5 bg-[#080B12] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Tab 1: Folders on Server */}
                                {explorerTab === 'existing' && (
                                    <div className="mt-5 space-y-3.5">
                                        <p className="text-xs text-slate-400">
                                            The following project directories were detected on your VPS node. Select any folder to link it to your dashboard:
                                        </p>

                                        {serverFolders.filter(f => 
                                            f.name.toLowerCase().includes(folderSearchQuery.toLowerCase()) ||
                                            f.path.toLowerCase().includes(folderSearchQuery.toLowerCase()) ||
                                            f.framework.toLowerCase().includes(folderSearchQuery.toLowerCase())
                                        ).length === 0 ? (
                                            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
                                                <Folder className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                                                <p className="text-xs font-semibold text-slate-300">No matching folders found</p>
                                                <p className="text-[11px] text-slate-500 mt-1">Try another search term or click "Create New Project" to initialize one.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-3">
                                                {serverFolders.filter(f => 
                                                    f.name.toLowerCase().includes(folderSearchQuery.toLowerCase()) ||
                                                    f.path.toLowerCase().includes(folderSearchQuery.toLowerCase()) ||
                                                    f.framework.toLowerCase().includes(folderSearchQuery.toLowerCase())
                                                ).map((folder) => (
                                                    <div
                                                        key={folder.id}
                                                        className="p-4 rounded-2xl bg-[#080B12] border border-slate-800/90 hover:border-indigo-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                                                    >
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                                                                    <Folder className="w-4 h-4" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <h4 className="font-bold text-white text-sm truncate">
                                                                            {folder.name}
                                                                        </h4>
                                                                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                                                                            {folder.framework}
                                                                        </span>
                                                                        {folder.branch && (
                                                                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-mono flex items-center gap-1">
                                                                                <GitBranch className="w-2.5 h-2.5" />
                                                                                {folder.branch}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[11px] font-mono text-cyan-400 mt-0.5 truncate">
                                                                        {folder.path}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-slate-400 mt-2 line-clamp-1">
                                                                {folder.description}
                                                            </p>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelectServerFolder(folder)}
                                                            className="sm:self-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 flex-shrink-0"
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>Select & Link</span>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Tab 2: Create New Project */}
                                {explorerTab === 'new' && (
                                    <form onSubmit={handleCreateNewProject} className="mt-5 space-y-4">
                                        <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-200">
                                            Create a new deployment workspace on this VPS node. The system will set up directory permissions, git tracking, and web server bindings.
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-300 mb-1">
                                                    Project Name <span className="text-indigo-400">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newProjName}
                                                    onChange={(e) => setNewProjName(e.target.value)}
                                                    placeholder="e.g. store-app or api-backend"
                                                    className="w-full px-3.5 py-2.5 bg-[#080B12] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-300 mb-1">
                                                    Server Directory Path
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newProjDir}
                                                    onChange={(e) => setNewProjDir(e.target.value)}
                                                    placeholder={connectedServer.type === 'windows' ? 'C:\\inetpub\\wwwroot\\' : '/var/www/'}
                                                    className="w-full px-3.5 py-2.5 bg-[#080B12] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-300 mb-2">
                                                Application Stack / Framework
                                            </label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {[
                                                    { id: 'laravel', label: 'Laravel (PHP 8.4)' },
                                                    { id: 'node', label: 'Node.js / React' },
                                                    { id: 'static', label: 'Static HTML / Web' },
                                                    { id: 'python', label: 'Python / Django' },
                                                ].map((stack) => (
                                                    <button
                                                        key={stack.id}
                                                        type="button"
                                                        onClick={() => setNewProjType(stack.id)}
                                                        className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                                                            newProjType === stack.id
                                                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                                                                : 'bg-[#080B12] border-slate-800 text-slate-400 hover:text-white'
                                                        }`}
                                                    >
                                                        {stack.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-300 mb-1">
                                                    Git Repository URL (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newProjGit}
                                                    onChange={(e) => setNewProjGit(e.target.value)}
                                                    placeholder="https://github.com/rhamify/app.git"
                                                    className="w-full px-3.5 py-2.5 bg-[#080B12] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-300 mb-1">
                                                    Primary Domain / Host (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newProjDomain}
                                                    onChange={(e) => setNewProjDomain(e.target.value)}
                                                    placeholder="app.rhamify.com"
                                                    className="w-full px-3.5 py-2.5 bg-[#080B12] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span>Initialize & Create Project on Server</span>
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Tab 3: Commands Executed on Server */}
                                {explorerTab === 'logs' && (
                                    <div className="mt-5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                                    <Terminal className="w-4 h-4 text-emerald-400" />
                                                    <span>Commands Dispatched to Remote VPS</span>
                                                </h4>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    Real-time commands executed during SSH handshake and directory scanning:
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyCommand(liveCommandLogs.map(l => `$ ${l.cmd}\n${l.output || ''}`).join('\n\n'))}
                                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
                                            >
                                                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                <span>{copiedCmd ? 'Copied' : 'Copy Full Stream'}</span>
                                            </button>
                                        </div>

                                        <div className="p-4 bg-[#05070D] border border-slate-800 rounded-2xl font-mono text-xs space-y-3 max-h-96 overflow-y-auto">
                                            {liveCommandLogs.length === 0 ? (
                                                <div className="text-slate-500 py-8 text-center">
                                                    No commands recorded for this session yet.
                                                </div>
                                            ) : (
                                                liveCommandLogs.map((log, i) => (
                                                    <div key={i} className="p-3 bg-black/50 rounded-xl border border-slate-800/80 space-y-1.5">
                                                        <div className="flex items-center justify-between text-[11px]">
                                                            <span className="text-slate-500">[{log.time}]</span>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                                log.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                            }`}>
                                                                {log.status || 'success'}
                                                            </span>
                                                        </div>
                                                        <div className="text-emerald-400 font-semibold break-all select-all flex items-start gap-1.5">
                                                            <span className="text-slate-600 select-none font-bold">$</span>
                                                            <span>{log.cmd}</span>
                                                        </div>
                                                        {log.output && (
                                                            <div className="text-slate-300 pl-3 border-l-2 border-slate-700/80 whitespace-pre-wrap text-[11px] leading-relaxed bg-[#0A0D16] p-2 rounded-lg">
                                                                {log.output}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                {/* Modal Header */}
                                <div className="flex items-start justify-between pb-6 border-b border-slate-800">
                                    <div>
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
                                            <Server className="w-3.5 h-3.5 text-indigo-400" />
                                            <span>Server Provisioning & Connection Wizard</span>
                                        </div>
                                        <h3 className="font-heading text-2xl font-bold text-white">
                                            Connect Your VPS Node
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Choose your server OS. Connect using default login credentials or a dedicated deployer sub-account.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSetupModalOpen(false)}
                                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                        {/* Mobile Compact Tab Switch: Shown on mobile once OS is selected to save vertical scrolling */}
                        {selectedOs && (
                            <div className="mt-4 sm:hidden">
                                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                                    <span className="text-[11px] font-bold text-slate-400 pl-1 uppercase tracking-wider">
                                        Active OS:
                                    </span>
                                    <div className="inline-flex p-0.5 rounded-lg bg-[#080B12] border border-slate-800/80">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedOs('linux')}
                                            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                                selectedOs === 'linux'
                                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
                                                    : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            <Terminal className="w-3.5 h-3.5" />
                                            <span>Linux</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedOs('windows')}
                                            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                                selectedOs === 'windows'
                                                    ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/40'
                                                    : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            <Monitor className="w-3.5 h-3.5" />
                                            <span>Windows</span>
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedOs(null)}
                                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
                                        title="View full OS selection cards"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 1: Choose Operating System (Big Buttons: Windows vs Linux - Hidden on mobile if OS selected) */}
                        <div className={`mt-6 ${selectedOs ? 'hidden sm:block' : 'block'}`}>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                                Select Server Operating System
                            </label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Linux Option Card */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedOs('linux')}
                                    className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                                        selectedOs === 'linux'
                                            ? 'bg-indigo-600/20 border-indigo-500 shadow-xl shadow-indigo-500/15 ring-1 ring-indigo-500'
                                            : 'bg-[#080B12] border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                                            <Terminal className="w-6 h-6" />
                                        </div>
                                        {selectedOs === 'linux' && (
                                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold">
                                                Selected
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-4">
                                        <h4 className="font-bold text-base text-white">Linux Server</h4>
                                        <p className="text-xs text-slate-400 mt-1">
                                             Ubuntu 24.04 / 22.04 LTS, Debian, AlmaLinux, CentOS
                                        </p>
                                        <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-indigo-300">
                                            <span>SSH &bull; OpenSSH &bull; Nginx &bull; PHP-FPM</span>
                                        </div>
                                    </div>
                                </button>

                                {/* Windows Option Card */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedOs('windows')}
                                    className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                                        selectedOs === 'windows'
                                            ? 'bg-cyan-600/20 border-cyan-500 shadow-xl shadow-cyan-500/15 ring-1 ring-cyan-500'
                                            : 'bg-[#080B12] border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                                            <Monitor className="w-6 h-6" />
                                        </div>
                                        {selectedOs === 'windows' && (
                                            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500 text-white text-[10px] font-bold">
                                                Selected
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-4">
                                        <h4 className="font-bold text-base text-white">Windows Server</h4>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Windows Server 2025 / 2022 / 2019, Windows 11 Pro
                                        </p>
                                        <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-cyan-300">
                                            <span>PowerShell &bull; WinRM &bull; OpenSSH &bull; IIS</span>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Linux Server Configuration Details */}
                        {selectedOs === 'linux' && (
                            <div className="mt-4 sm:mt-8 p-4 sm:p-5 bg-[#080B12] border border-indigo-500/30 rounded-2xl space-y-5">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="w-4 h-4 text-indigo-400" />
                                        <span className="font-bold text-sm text-white">Linux SSH Server Details</span>
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-400">Port: {linuxPort} &bull; OpenSSH</span>
                                </div>

                                {/* Connection Fields: Server IP & Port on a straight line on mobile */}
                                <div className="grid grid-cols-12 gap-2 sm:gap-3">
                                    <div className="col-span-8 sm:col-span-9">
                                        <label className="block text-xs font-medium text-slate-300 mb-1 truncate">
                                            Server IP Address / Hostname
                                        </label>
                                        <input
                                            type="text"
                                            value={linuxIp}
                                            onChange={(e) => setLinuxIp(e.target.value)}
                                            placeholder="147.93.85.120"
                                            className="w-full px-3.5 py-2.5 bg-[#0E131F] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="col-span-4 sm:col-span-3">
                                        <label className="block text-xs font-medium text-slate-300 mb-1 truncate">
                                            SSH Port
                                        </label>
                                        <input
                                            type="text"
                                            value={linuxPort}
                                            onChange={(e) => setLinuxPort(e.target.value)}
                                            placeholder="22"
                                            className="w-full px-3 sm:px-3.5 py-2.5 bg-[#0E131F] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* SSH Username */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-medium text-slate-300">
                                            SSH Username
                                        </label>
                                        <div className="flex items-center gap-1.5 text-[10px]">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setLinuxUser('root');
                                                    setShowRootPrompt(false);
                                                    setShowNewAccountForm(false);
                                                }}
                                                className={`px-1.5 py-0.5 rounded ${
                                                    linuxUser.toLowerCase() === 'root'
                                                        ? 'bg-amber-500/20 text-amber-300 font-bold'
                                                        : 'text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                root
                                            </button>
                                            <span className="text-slate-600">|</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setLinuxUser('rhamifytechnology');
                                                    setShowRootPrompt(false);
                                                    setShowNewAccountForm(false);
                                                }}
                                                className={`px-1.5 py-0.5 rounded ${
                                                    linuxUser.toLowerCase() !== 'root' && linuxUser !== ''
                                                        ? 'bg-indigo-500/20 text-indigo-300 font-bold'
                                                        : 'text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                sub-account
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={linuxUser}
                                        onChange={(e) => {
                                            setLinuxUser(e.target.value);
                                            setShowRootPrompt(false);
                                        }}
                                        placeholder="Enter username (e.g. root or deployer)"
                                        className="w-full px-3.5 py-2.5 bg-[#0E131F] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                    />

                                    {/* Reactive Command Preview right after IP & Username */}
                                    {(linuxIp || linuxUser) && (
                                        <div className="mt-2.5 p-2.5 bg-[#06080F] border border-slate-800 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isTestingConnection ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isTestingConnection ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                                    </span>
                                                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                                                        Command to Run:
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyCommand(generatedLinuxCmd)}
                                                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 transition-colors border border-slate-700/60"
                                                >
                                                    {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                    <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                                                </button>
                                            </div>
                                            <div className="p-2 bg-[#030508] border border-slate-800/80 rounded-lg font-mono text-xs text-emerald-400 break-all select-all flex items-center gap-2">
                                                <span className="text-slate-600 select-none font-bold">$</span>
                                                <span className="truncate">{generatedLinuxCmd}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ROOT USER NOTIFICATION & SUB-ACCOUNT CREATION DETAILS (Only shown if user attempts sign in as root) */}
                                {showRootPrompt && (
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3.5">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                                                    <span>Root User Detected (Default Login)</span>
                                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 text-[10px] font-mono">Works, but root is risky</span>
                                                </div>
                                                <p className="text-[11px] text-amber-200/80 mt-1 leading-relaxed">
                                                    Your connection will work fine with <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-amber-300">root</code>. However, deploying applications directly under root is not recommended for security. We suggest creating a dedicated deployer sub-account with sudo privileges.
                                                </p>
                                            </div>
                                        </div>

                                        {!showNewAccountForm ? (
                                            <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewAccountForm(true)}
                                                    className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold border border-amber-500/40 transition-colors flex items-center gap-2 shadow-sm"
                                                >
                                                    <UserPlus className="w-4 h-4 text-amber-400" />
                                                    <span>Create Dedicated Sub-Account</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowRootPrompt(false);
                                                        handleTestAndConnect('linux', 'root');
                                                    }}
                                                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                                                >
                                                    Proceed with root below
                                                </button>
                                            </div>
                                        ) : (
                                            /* Form collecting the new sub-account creation details */
                                            <div className="pt-3 border-t border-amber-500/20 space-y-3.5 bg-black/20 p-4 rounded-xl border">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                                        <UserPlus className="w-4 h-4 text-indigo-400" />
                                                        <span>Sub-Account Creation Details</span>
                                                    </div>
                                                    <span className="text-[10px] text-indigo-300 font-mono">Automated Provisioning</span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                                                            New Sub-Account Username
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={newAccountUser}
                                                            onChange={(e) => setNewAccountUser(e.target.value)}
                                                            placeholder="rhamifytechnology"
                                                            className="w-full px-3 py-2 bg-[#0E131F] border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                                                            Account Password
                                                        </label>
                                                        <input
                                                            type="password"
                                                            value={newAccountPassword}
                                                            onChange={(e) => setNewAccountPassword(e.target.value)}
                                                            placeholder="Set sub-account password"
                                                            className="w-full px-3 py-2 bg-[#0E131F] border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="p-3 bg-[#080B12] rounded-xl border border-slate-800 space-y-1.5 text-xs">
                                                    <div className="flex items-center justify-between text-slate-300">
                                                        <div className="flex items-center gap-2">
                                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                            <span>Configure passwordless sudo in <code className="font-mono text-indigo-300 text-[10px]">/etc/sudoers.d/{newAccountUser || 'deployer'}</code></span>
                                                        </div>
                                                        <span className="text-[10px] text-emerald-400 font-mono font-bold">NOPASSWD:ALL</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-slate-300">
                                                        <div className="flex items-center gap-2">
                                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                            <span>Add to <code className="font-mono text-indigo-300 text-[10px]">www-data</code> and set <code className="font-mono text-indigo-300 text-[10px]">775</code> permissions</span>
                                                        </div>
                                                        <span className="text-[10px] text-emerald-400 font-mono font-bold">Enabled</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!newAccountUser || !newAccountUser.trim()) {
                                                                triggerAlert('Please enter a username for the new Linux sub-account.', 'Username Required', 'warning');
                                                                return;
                                                            }
                                                            if (!newAccountPassword || !newAccountPassword.trim()) {
                                                                triggerAlert('Please set a password for the new Linux sub-account.', 'Password Required', 'warning');
                                                                return;
                                                            }
                                                            setLinuxUser(newAccountUser.trim());
                                                            setShowRootPrompt(false);
                                                            setShowNewAccountForm(false);
                                                            setAccountCreatedSuccess(true);
                                                            handleTestAndConnect('linux', newAccountUser.trim());
                                                        }}
                                                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                        <span>Save & Sign In With Sub-Account ({newAccountUser})</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewAccountForm(false)}
                                                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Sub-Account Confirmed Badge */}
                                {linuxUser && linuxUser.trim().toLowerCase() !== 'root' && (
                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                            <span>
                                                Connecting with dedicated sub-account: <strong className="font-mono text-white">{linuxUser}</strong> (sudo enabled)
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setLinuxUser('root')}
                                            className="text-[10px] text-slate-400 hover:text-white underline font-mono"
                                        >
                                            Switch to root
                                        </button>
                                    </div>
                                )}

                                {/* Auth Method Toggle */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-medium text-slate-300">
                                            Authentication Method
                                        </label>
                                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" /> Auto-detection active
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAuthMethod('auto')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                                authMethod === 'auto'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            Auto-detect SSH Key (Default)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAuthMethod('password')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                                authMethod === 'password'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            Password
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAuthMethod('custom_key')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                                authMethod === 'custom_key'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            Custom Key Path
                                        </button>
                                    </div>

                                    {authMethod === 'auto' && (
                                        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5 bg-[#0A0E18] p-2.5 rounded-xl border border-slate-800/80">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                            <span>Automatically detects standard keys (<code>id_ed25519</code>, <code>id_rsa</code>) from your system behind the scenes.</span>
                                        </div>
                                    )}

                                    {authMethod === 'custom_key' && (
                                        <div className="mt-3">
                                            <input
                                                 type="text"
                                                 value={linuxKey}
                                                 onChange={(e) => setLinuxKey(e.target.value)}
                                                 placeholder="~/.ssh/id_ed25519"
                                                 className="w-full px-3.5 py-2.5 bg-[#0E131F] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                            />
                                            <span className="text-[11px] text-slate-400 mt-1 block">
                                                Path to stored SSH deploy key with 600 permissions.
                                            </span>
                                        </div>
                                    )}

                                    {authMethod === 'password' && (
                                        <div className="mt-3">
                                            <input
                                                type="password"
                                                value={linuxPassword}
                                                onChange={(e) => setLinuxPassword(e.target.value)}
                                                placeholder="Enter SSH password"
                                                className="w-full px-3.5 py-2.5 bg-[#0E131F] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Optional Fresh VPS Bootstrap Helper */}
                                <div className="pt-2 border-t border-slate-800/80">
                                    <button
                                        type="button"
                                        onClick={() => setShowLinuxBootstrap(!showLinuxBootstrap)}
                                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>{showLinuxBootstrap ? 'Hide' : 'Starting from fresh VPS? View'} 1-Line Bootstrap Script</span>
                                    </button>

                                    {showLinuxBootstrap && (
                                        <div className="mt-2.5 p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs space-y-2">
                                            <div className="p-2.5 bg-[#0E131F] rounded-lg font-mono text-[11px] text-cyan-300 break-all select-all border border-slate-800">
                                                curl -fsSL https://raw.githubusercontent.com/rhamifydev/vps-scripts/main/bootstrap.sh | sudo bash
                                            </div>
                                            <p className="text-[11px] text-slate-400">
                                                Installs Git, PHP 8.4, Composer, Nginx, and configures SSH deploy keys automatically.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Full Live Command Execution & Terminal Console */}
                                {(linuxIp || linuxUser || liveCommandLogs.length > 0) && (
                                    <div className="pt-2">
                                        <div className="p-3.5 bg-[#06080F] border border-slate-800 rounded-2xl space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                                        <Terminal className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-white flex items-center gap-2">
                                                            <span>{isTestingConnection ? 'Executing Command on Remote VPS...' : 'Live SSH Execution Command'}</span>
                                                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                                                                isTestingConnection ? 'bg-amber-500/20 text-amber-300 animate-pulse' : 'bg-emerald-500/20 text-emerald-300'
                                                            }`}>
                                                                {isTestingConnection ? 'Executing' : 'Live Ready'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyCommand(generatedLinuxCmd)}
                                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1.5 transition-colors border border-slate-700/60"
                                                >
                                                    {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                    <span>{copiedCmd ? 'Copied' : 'Copy Command'}</span>
                                                </button>
                                            </div>

                                            {/* Primary Command Snippet */}
                                            <div className="p-2.5 bg-[#030508] border border-slate-800/80 rounded-xl font-mono text-xs text-emerald-300 break-all select-all flex items-start gap-2 shadow-inner">
                                                <span className="text-slate-500 select-none font-bold">$</span>
                                                <div className="flex-1">
                                                    <span className="text-emerald-300 font-semibold">{generatedLinuxCmd}</span>
                                                    {isTestingConnection && (
                                                        <span className="inline-block w-2 h-3.5 bg-emerald-400 ml-1.5 animate-pulse align-middle" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Live Diagnostics Log Output */}
                                            {liveCommandLogs.length > 0 && (
                                                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                                                    <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                                                        <span>Live Command Output & Diagnostics</span>
                                                        <span className="text-slate-500">{liveCommandLogs.length} events</span>
                                                    </div>
                                                    <div className="p-2.5 bg-black/60 border border-slate-800/60 rounded-xl max-h-36 overflow-y-auto space-y-1.5 text-[11px] font-mono">
                                                        {liveCommandLogs.map((log, idx) => (
                                                            <div key={idx} className="leading-relaxed">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-slate-500 text-[10px]">[{log.time}]</span>
                                                                    <span className={log.status === 'failed' ? 'text-rose-400 font-semibold' : (log.status === 'running' ? 'text-amber-300 font-semibold' : 'text-emerald-400 font-semibold')}>
                                                                        $ {log.cmd}
                                                                    </span>
                                                                </div>
                                                                {log.output && (
                                                                    <div className="text-slate-300 pl-4 border-l border-slate-700/60 whitespace-pre-wrap text-[10px] mt-0.5">
                                                                        {log.output}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Interactive Passphrase Prompt inside Terminal console */}
                                            {showPassphrasePrompt && (
                                                <form
                                                    onSubmit={handlePassphraseSubmit}
                                                    className="p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-xl space-y-2 animate-in fade-in duration-200"
                                                >
                                                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                                                        <Key className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                                        <span>Enter passphrase for key '{passphraseKeyName}':</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400">
                                                        Your private key is protected with a passphrase. Type your passphrase below to unlock and proceed.
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="password"
                                                            autoFocus
                                                            value={keyPassphrase}
                                                            onChange={(e) => setKeyPassphrase(e.target.value)}
                                                            placeholder="Enter key passphrase"
                                                            className="flex-1 px-3.5 py-2 bg-[#0E131F] border border-indigo-500/40 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                                        />
                                                        <button
                                                            type="submit"
                                                            disabled={isTestingConnection}
                                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/30"
                                                        >
                                                            {isTestingConnection ? (
                                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                            )}
                                                            <span>Unlock & Connect</span>
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Test Action Button */}
                                <div className="pt-3">
                                    <button
                                        type="button"
                                        onClick={() => handleSignInAttempt('linux')}
                                        disabled={isTestingConnection}
                                        className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                                    >
                                        {isTestingConnection ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                <span>{testLog || 'Connecting...'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>Sign In & Connect Linux VPS</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Windows Server Configuration Details */}
                        {selectedOs === 'windows' && (
                            <div className="mt-4 sm:mt-8 p-4 sm:p-5 bg-[#080B12] border border-cyan-500/30 rounded-2xl space-y-5">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Monitor className="w-4 h-4 text-cyan-400" />
                                        <span className="font-bold text-sm text-white">Windows Server Details</span>
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-400">OpenSSH / WinRM</span>
                                </div>

                                <div className="grid grid-cols-12 gap-2 sm:gap-3">
                                    <div className="col-span-8 sm:col-span-9">
                                        <label className="block text-xs font-medium text-slate-300 mb-1 truncate">
                                            Windows Host / IP Address
                                        </label>
                                        <input
                                            type="text"
                                            value={windowsIp}
                                            onChange={(e) => setWindowsIp(e.target.value)}
                                            placeholder="147.93.85.130"
                                            className="w-full px-3.5 py-2.5 bg-[#0E131F] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div className="col-span-4 sm:col-span-3">
                                        <label className="block text-xs font-medium text-slate-300 mb-1 truncate">
                                            Port (SSH/WinRM)
                                        </label>
                                        <input
                                            type="text"
                                            value={windowsPort}
                                            onChange={(e) => setWindowsPort(e.target.value)}
                                            placeholder="22"
                                            className="w-full px-3 sm:px-3.5 py-2.5 bg-[#0E131F] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-xs font-medium text-slate-300">
                                                Windows Username
                                            </label>
                                            <div className="flex items-center gap-1.5 text-[10px]">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setWindowsUser('Administrator');
                                                        setShowWinAdminPrompt(false);
                                                        setShowWinAccountForm(false);
                                                    }}
                                                    className={`px-1.5 py-0.5 rounded ${
                                                        windowsUser.toLowerCase() === 'administrator'
                                                            ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                                                            : 'text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    Administrator
                                                </button>
                                                <span className="text-slate-600">|</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setWindowsUser('deployer');
                                                        setShowWinAdminPrompt(false);
                                                        setShowWinAccountForm(false);
                                                    }}
                                                    className={`px-1.5 py-0.5 rounded ${
                                                        windowsUser.toLowerCase() !== 'administrator' && windowsUser !== ''
                                                            ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                                                            : 'text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    Sub-account
                                                </button>
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            value={windowsUser}
                                            onChange={(e) => {
                                                setWindowsUser(e.target.value);
                                                setShowWinAdminPrompt(false);
                                            }}
                                            placeholder="Enter username (e.g. Administrator or deployer)"
                                            className="w-full px-3.5 py-2.5 bg-[#0E131F] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            value={windowsPassword}
                                            onChange={(e) => setWindowsPassword(e.target.value)}
                                            placeholder="Enter Windows Password"
                                            className="w-full px-3.5 py-2.5 bg-[#0E131F] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500"
                                        />
                                    </div>
                                </div>

                                {/* Reactive Command Preview right after Windows IP & Username */}
                                {(windowsIp || windowsUser) && (
                                    <div className="mt-2.5 p-2.5 bg-[#06080F] border border-slate-800 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className="relative flex h-2 w-2">
                                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isTestingConnection ? 'bg-amber-400' : 'bg-cyan-400'} opacity-75`}></span>
                                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isTestingConnection ? 'bg-amber-500' : 'bg-cyan-500'}`}></span>
                                                </span>
                                                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                                                    Command to Run:
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyCommand(generatedWinCmd)}
                                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 transition-colors border border-slate-700/60"
                                            >
                                                {copiedCmd ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
                                                <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                                            </button>
                                        </div>
                                        <div className="p-2 bg-[#030508] border border-slate-800/80 rounded-lg font-mono text-xs text-cyan-300 break-all select-all flex items-center gap-2">
                                            <span className="text-slate-600 select-none font-bold">$</span>
                                            <span className="truncate">{generatedWinCmd}</span>
                                        </div>
                                    </div>
                                )}

                                {/* ADMINISTRATOR USER NOTIFICATION (Only shown if user attempts sign in as Administrator) */}
                                {showWinAdminPrompt && (
                                    <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl space-y-3">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <div className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                                                    <span>Administrator Account Detected</span>
                                                    <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-200 text-[10px] font-mono">Default Account</span>
                                                </div>
                                                <p className="text-[11px] text-cyan-200/80 mt-1 leading-relaxed">
                                                    You can connect directly with Administrator, or configure a dedicated Windows service sub-account.
                                                </p>
                                            </div>
                                        </div>

                                        {!showWinAccountForm ? (
                                            <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowWinAccountForm(true)}
                                                    className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-semibold border border-cyan-500/40 transition-colors flex items-center gap-2"
                                                >
                                                    <UserPlus className="w-4 h-4 text-cyan-400" />
                                                    <span>Configure Dedicated Windows Sub-Account</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowWinAdminPrompt(false);
                                                        handleTestAndConnect('windows', 'Administrator');
                                                    }}
                                                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                                                >
                                                    Proceed with Administrator
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="pt-3 border-t border-cyan-500/20 space-y-3 bg-black/20 p-4 rounded-xl border">
                                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                                    <UserPlus className="w-4 h-4 text-cyan-400" />
                                                    <span>Windows Sub-Account Details</span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                                                            New Windows Username
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={newWinAccountUser}
                                                            onChange={(e) => setNewWinAccountUser(e.target.value)}
                                                            placeholder="deployer"
                                                            className="w-full px-3 py-2 bg-[#0E131F] border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                                                            Password
                                                        </label>
                                                        <input
                                                            type="password"
                                                            value={newWinAccountPassword}
                                                            onChange={(e) => setNewWinAccountPassword(e.target.value)}
                                                            placeholder="Set password"
                                                            className="w-full px-3 py-2 bg-[#0E131F] border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!newWinAccountUser || !newWinAccountUser.trim()) {
                                                                triggerAlert('Please enter a username for the new Windows sub-account.', 'Username Required', 'warning');
                                                                return;
                                                            }
                                                            if (!newWinAccountPassword || !newWinAccountPassword.trim()) {
                                                                triggerAlert('Please set a password for the new Windows sub-account.', 'Password Required', 'warning');
                                                                return;
                                                            }
                                                            setWindowsUser(newWinAccountUser.trim());
                                                            setShowWinAdminPrompt(false);
                                                            setShowWinAccountForm(false);
                                                            setWinAccountCreatedSuccess(true);
                                                            handleTestAndConnect('windows', newWinAccountUser.trim());
                                                        }}
                                                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                        <span>Save & Sign In ({newWinAccountUser})</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowWinAccountForm(false)}
                                                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Optional OpenSSH Command on Windows */}
                                <div className="pt-2 border-t border-slate-800/80">
                                    <button
                                        type="button"
                                        onClick={() => setShowWinBootstrap(!showWinBootstrap)}
                                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1.5"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>{showWinBootstrap ? 'Hide' : 'Need OpenSSH on Windows? View'} PowerShell Setup Command</span>
                                    </button>

                                    {showWinBootstrap && (
                                        <div className="mt-2.5 p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-xs space-y-2">
                                            <div className="p-2.5 bg-[#0E131F] rounded-lg font-mono text-[11px] text-cyan-300 break-all select-all border border-slate-800">
                                                Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0; Start-Service sshd; Set-Service -Name sshd -StartupType 'Automatic'
                                            </div>
                                            <p className="text-[11px] text-slate-400">
                                                Enables native OpenSSH Server daemon and opens the firewall port automatically.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Full Live Command Execution & Terminal Console (Windows) */}
                                {(windowsIp || windowsUser || liveCommandLogs.length > 0) && (
                                    <div className="pt-2">
                                        <div className="p-3.5 bg-[#06080F] border border-slate-800 rounded-2xl space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                                                        <Terminal className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-white flex items-center gap-2">
                                                            <span>{isTestingConnection ? 'Executing OpenSSH Command on Windows Host...' : 'Live Windows Command Stream'}</span>
                                                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                                                                isTestingConnection ? 'bg-amber-500/20 text-amber-300 animate-pulse' : 'bg-cyan-500/20 text-cyan-300'
                                                            }`}>
                                                                {isTestingConnection ? 'Executing' : 'Live Ready'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyCommand(generatedWinCmd)}
                                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1.5 transition-colors border border-slate-700/60"
                                                >
                                                    {copiedCmd ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
                                                    <span>{copiedCmd ? 'Copied' : 'Copy Command'}</span>
                                                </button>
                                            </div>

                                            {/* Primary Command Snippet */}
                                            <div className="p-2.5 bg-[#030508] border border-slate-800/80 rounded-xl font-mono text-xs text-cyan-300 break-all select-all flex items-start gap-2 shadow-inner">
                                                <span className="text-slate-500 select-none font-bold">$</span>
                                                <div className="flex-1">
                                                    <span className="text-cyan-300 font-semibold">{generatedWinCmd}</span>
                                                    {isTestingConnection && (
                                                        <span className="inline-block w-2 h-3.5 bg-cyan-400 ml-1.5 animate-pulse align-middle" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Live Diagnostics Log Output */}
                                            {liveCommandLogs.length > 0 && (
                                                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                                                    <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                                                        <span>Live Command Output & Diagnostics</span>
                                                        <span className="text-slate-500">{liveCommandLogs.length} events</span>
                                                    </div>
                                                    <div className="p-2.5 bg-black/60 border border-slate-800/60 rounded-xl max-h-36 overflow-y-auto space-y-1.5 text-[11px] font-mono">
                                                        {liveCommandLogs.map((log, idx) => (
                                                            <div key={idx} className="leading-relaxed">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-slate-500 text-[10px]">[{log.time}]</span>
                                                                    <span className={log.status === 'failed' ? 'text-rose-400 font-semibold' : (log.status === 'running' ? 'text-amber-300 font-semibold' : 'text-cyan-400 font-semibold')}>
                                                                        $ {log.cmd}
                                                                    </span>
                                                                </div>
                                                                {log.output && (
                                                                    <div className="text-slate-300 pl-4 border-l border-slate-700/60 whitespace-pre-wrap text-[10px] mt-0.5">
                                                                        {log.output}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Test Action Button */}
                                <div className="pt-3">
                                    <button
                                        type="button"
                                        onClick={() => handleSignInAttempt('windows')}
                                        disabled={isTestingConnection}
                                        className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2"
                                    >
                                        {isTestingConnection ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                <span>{testLog || 'Connecting...'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>Sign In & Connect Windows Server</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )}

            {/* Custom Center Verification Alert Modal */}
            {centerAlert && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                        onClick={() => setCenterAlert(null)}
                    />

                    {/* Centered Alert Box */}
                    <div className="relative bg-[#0E131F] border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl z-10 text-center animate-in fade-in zoom-in-95 duration-150">
                        <button
                            type="button"
                            onClick={() => setCenterAlert(null)}
                            className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400 shadow-lg shadow-amber-950/40">
                            <ShieldAlert className="w-6 h-6" />
                        </div>

                        <h4 className="text-base font-bold text-white mb-1.5">
                            {centerAlert.title || 'Verification Notice'}
                        </h4>

                        <p className="text-xs text-slate-300 leading-relaxed mb-5">
                            {centerAlert.message}
                        </p>

                        <button
                            type="button"
                            onClick={() => setCenterAlert(null)}
                            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30"
                            autoFocus
                        >
                            {centerAlert.buttonText || 'Understood'}
                        </button>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
