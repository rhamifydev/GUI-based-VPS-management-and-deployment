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
    const [authMethod, setAuthMethod] = useState('key'); // 'key' | 'password'

    // Form fields for Linux
    const [linuxIp, setLinuxIp] = useState('147.93.85.120');
    const [linuxPort, setLinuxPort] = useState('22');
    const [linuxUser, setLinuxUser] = useState('');
    const [linuxPassword, setLinuxPassword] = useState('');
    const [linuxKey, setLinuxKey] = useState('~/.ssh/rhamify_app_deploy');
    const [linuxAppDir, setLinuxAppDir] = useState('~/rhamify_app');
    const [showLinuxBootstrap, setShowLinuxBootstrap] = useState(false);

    // Root prompt & sub-account creation state for Linux
    const [showRootPrompt, setShowRootPrompt] = useState(false);
    const [showNewAccountForm, setShowNewAccountForm] = useState(false);
    const [newAccountUser, setNewAccountUser] = useState('rhamifytechnology');
    const [newAccountPassword, setNewAccountPassword] = useState('');
    const [accountCreatedSuccess, setAccountCreatedSuccess] = useState(false);

    // Form fields for Windows
    const [windowsIp, setWindowsIp] = useState('147.93.85.130');
    const [windowsPort, setWindowsPort] = useState('22');
    const [windowsUser, setWindowsUser] = useState('');
    const [windowsPassword, setWindowsPassword] = useState('');
    const [windowsAppDir, setWindowsAppDir] = useState('C:\\inetpub\\wwwroot\\rhamify_app');
    const [showWinBootstrap, setShowWinBootstrap] = useState(false);

    // Sub-account creation state for Windows
    const [showWinAdminPrompt, setShowWinAdminPrompt] = useState(false);
    const [showWinAccountForm, setShowWinAccountForm] = useState(false);
    const [newWinAccountUser, setNewWinAccountUser] = useState('deployer');
    const [newWinAccountPassword, setNewWinAccountPassword] = useState('');
    const [winAccountCreatedSuccess, setWinAccountCreatedSuccess] = useState(false);

    // Connection testing state
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [testLog, setTestLog] = useState(null);
    const [connectedServer, setConnectedServer] = useState({
        name: 'Production VPS Node',
        ip: '147.93.85.120',
        port: '22',
        user: 'rhamifytechnology',
        os: 'Ubuntu 24.04 LTS (x86_64)',
        type: 'linux',
        status: 'Online & Synced'
    });

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

    const [projects, setProjects] = useState(defaultProjects);

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
            const user = (linuxUser || '').trim().toLowerCase();
            if (!user) {
                alert('Please enter an SSH username (e.g. root or sub-account).');
                return;
            }
            if (user === 'root') {
                setShowRootPrompt(true);
                return;
            }
            handleTestAndConnect('linux');
        } else {
            const user = (windowsUser || '').trim().toLowerCase();
            if (!user) {
                alert('Please enter a Windows username (e.g. Administrator or sub-account).');
                return;
            }
            if (user === 'administrator') {
                setShowWinAdminPrompt(true);
                return;
            }
            handleTestAndConnect('windows');
        }
    };

    const handleTestAndConnect = (os, userOverride = null) => {
        const targetUser = userOverride || (os === 'linux' ? linuxUser : windowsUser);
        setIsTestingConnection(true);
        setTestLog('Pinging host ' + (os === 'linux' ? linuxIp : windowsIp) + '...');

        setTimeout(() => {
            setTestLog('Initiating encrypted handshake on port ' + (os === 'linux' ? linuxPort : windowsPort) + '...');
        }, 800);

        setTimeout(() => {
            setTestLog('Validating user permissions for ' + targetUser + '...');
        }, 1600);

        setTimeout(() => {
            setIsTestingConnection(false);
            setTestLog('Success! Connection established.');

            // Update active node on dashboard
            if (os === 'linux') {
                setConnectedServer({
                    name: 'Linux Server Node',
                    ip: linuxIp,
                    port: linuxPort,
                    user: targetUser,
                    os: 'Ubuntu / Debian Linux (SSH)',
                    type: 'linux',
                    status: 'Connected & Verified'
                });
            } else {
                setConnectedServer({
                    name: 'Windows Server Node',
                    ip: windowsIp,
                    port: windowsPort,
                    user: targetUser,
                    os: 'Windows Server (PowerShell / WinRM)',
                    type: 'windows',
                    status: 'Connected & Verified'
                });
            }

            const newProj = {
                id: 'proj-' + Date.now(),
                name: os === 'linux' ? (linuxAppDir.replace(/^[~/\\]+/, '') || 'linux_vps_node') : (windowsAppDir.split('\\').pop() || 'windows_vps_node'),
                description: `${os === 'linux' ? 'Ubuntu Linux' : 'Windows Server'} node successfully connected via ${os === 'linux' ? 'SSH' : 'WinRM/OpenSSH'}.`,
                ip: os === 'linux' ? linuxIp : windowsIp,
                port: os === 'linux' ? linuxPort : windowsPort,
                user: targetUser,
                os: os === 'linux' ? 'Ubuntu 24.04 LTS (x86_64)' : 'Windows Server 2022',
                type: os,
                branch: 'main',
                commit: 'c90bf14',
                commitMessage: 'feat(server): initial node provisioning & health check verified',
                lastDeployTime: 'Just now',
                deployDuration: '14s',
                domain: os === 'linux' ? 'new.rhamify.com' : 'vps.rhamify.com',
                isConnected: true,
                status: 'Online & Synced',
                isDeploying: false,
                deployProgress: null,
                lastVisited: 'Just now',
                lastVisitedTimestamp: Date.now(),
            };
            setProjects(prev => [newProj, ...prev.filter(p => p.ip !== newProj.ip)]);

            setTimeout(() => {
                setSetupModalOpen(false);
                setTestLog(null);
                setShowRootPrompt(false);
                setShowWinAdminPrompt(false);
            }, 1200);
        }, 2400);
    };

    return (
        <AuthenticatedLayout>
            <Head title="VPS Management Dashboard" />

            <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
                {/* Dashboard Top Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800/80">
                    <div>
                        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
                            <Server className="w-6 h-6 text-indigo-400" />
                            <span>VPS Control Panel</span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Authenticated as <span className="text-indigo-400 font-semibold">{user.github_username ? `@${user.github_username}` : user.name}</span> &bull; Active: {connectedServer.ip}
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Open Setup Wizard Modal Button */}
                        <button
                            onClick={() => {
                                setSelectedOs(null);
                                setSetupModalOpen(true);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Connect / Setup Server</span>
                        </button>

                        {/* Trigger Deploy Action */}
                        <button
                            onClick={handleQuickDeploy}
                            disabled={isDeploying}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                        >
                            {isDeploying ? (
                                <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Deploying...</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-3.5 h-3.5 fill-white" />
                                    <span>Trigger Deploy (deploy.sh)</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Onboarding Intent Quick Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                                <span>VPS Connection Assistant</span>
                                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-mono">Linux & Windows Ready</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                Connect an existing server with login details, or start from scratch with guided cloud provisioning.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedOs(null);
                            setSetupModalOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 self-start sm:self-auto"
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
                                                        <p className="text-xs text-slate-200 font-sans leading-relaxed break-words pl-5">
                                                            "{project.commitMessage || project.commit}"
                                                        </p>
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
                    <div className="relative bg-[#0E131F] border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
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

                        {/* Step 1: Choose Operating System (Big Buttons: Windows vs Linux) */}
                        <div className="mt-6">
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
                            <div className="mt-8 p-5 bg-[#080B12] border border-indigo-500/30 rounded-2xl space-y-5">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="w-4 h-4 text-indigo-400" />
                                        <span className="font-bold text-sm text-white">Linux SSH Server Details</span>
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-400">Port: {linuxPort} &bull; OpenSSH</span>
                                </div>

                                {/* Connection Fields */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-medium text-slate-300 mb-1">
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
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1">
                                            SSH Port
                                        </label>
                                        <input
                                            type="text"
                                            value={linuxPort}
                                            onChange={(e) => setLinuxPort(e.target.value)}
                                            placeholder="22"
                                            className="w-full px-3.5 py-2.5 bg-[#0E131F] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1">
                                            Application Directory
                                        </label>
                                        <input
                                            type="text"
                                            value={linuxAppDir}
                                            onChange={(e) => setLinuxAppDir(e.target.value)}
                                            placeholder="~/rhamify_app"
                                            className="w-full px-3.5 py-2.5 bg-[#0E131F] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
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
                                                            if (!newAccountUser) return;
                                                            setLinuxUser(newAccountUser);
                                                            setShowRootPrompt(false);
                                                            setShowNewAccountForm(false);
                                                            setAccountCreatedSuccess(true);
                                                            handleTestAndConnect('linux', newAccountUser);
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
                                    <label className="block text-xs font-medium text-slate-300 mb-2">
                                        Authentication Method
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAuthMethod('key')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                                authMethod === 'key'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            SSH Private Key (Recommended)
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
                                    </div>

                                    {authMethod === 'key' ? (
                                        <div className="mt-3">
                                            <input
                                                type="text"
                                                value={linuxKey}
                                                onChange={(e) => setLinuxKey(e.target.value)}
                                                placeholder="~/.ssh/rhamify_app_deploy"
                                                className="w-full px-3.5 py-2.5 bg-[#0E131F] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                            />
                                            <span className="text-[11px] text-slate-400 mt-1 block">
                                                Path to stored SSH deploy key with 600 permissions.
                                            </span>
                                        </div>
                                    ) : (
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
                            <div className="mt-8 p-5 bg-[#080B12] border border-cyan-500/30 rounded-2xl space-y-5">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Monitor className="w-4 h-4 text-cyan-400" />
                                        <span className="font-bold text-sm text-white">Windows Server Details</span>
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-400">OpenSSH / WinRM</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-medium text-slate-300 mb-1">
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
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1">
                                            Port (SSH/WinRM)
                                        </label>
                                        <input
                                            type="text"
                                            value={windowsPort}
                                            onChange={(e) => setWindowsPort(e.target.value)}
                                            placeholder="22"
                                            className="w-full px-3.5 py-2.5 bg-[#0E131F] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500"
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
                                                            if (!newWinAccountUser) return;
                                                            setWindowsUser(newWinAccountUser);
                                                            setShowWinAdminPrompt(false);
                                                            setShowWinAccountForm(false);
                                                            setWinAccountCreatedSuccess(true);
                                                            handleTestAndConnect('windows', newWinAccountUser);
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

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">
                                        IIS / App Directory Path
                                    </label>
                                    <input
                                        type="text"
                                        value={windowsAppDir}
                                        onChange={(e) => setWindowsAppDir(e.target.value)}
                                        placeholder="C:\inetpub\wwwroot\rhamify_app"
                                        className="w-full px-3.5 py-2.5 bg-[#0E131F] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500"
                                    />
                                </div>

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
                </div>
            )}
        </AuthenticatedLayout>
    );
}
