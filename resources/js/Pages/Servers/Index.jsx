import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import DeployGitHubModal from '@/Components/DeployGitHubModal';
import {
    Server,
    Power,
    RefreshCw,
    Terminal,
    Monitor,
    Plus,
    Activity,
    Layers,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Sliders,
    ExternalLink,
    Clock,
    X,
    Key,
    Lock,
    Shield,
    ChevronRight,
    Upload
} from 'lucide-react';

export default function ServersIndex({ servers: initialServers = [], projects = [] }) {
    const [servers, setServers] = useState(initialServers);
    const [powerTogglingServerId, setPowerTogglingServerId] = useState(null);
    const [checkingServerId, setCheckingServerId] = useState(null);
    const [alertNotice, setAlertNotice] = useState(null);
    const [githubDeployOpen, setGithubDeployOpen] = useState(false);
    const [deployTargetServerId, setDeployTargetServerId] = useState(null);

    // Modal state for adding new server
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [osType, setOsType] = useState('linux');
    const [serverIp, setServerIp] = useState('');
    const [serverPort, setServerPort] = useState('22');
    const [serverUser, setServerUser] = useState('root');
    const [serverName, setServerName] = useState('');
    const [authMethod, setAuthMethod] = useState('auto');
    const [serverPassword, setServerPassword] = useState('');
    const [serverKeyContent, setServerKeyContent] = useState('');
    const [serverPassphrase, setServerPassphrase] = useState('');
    const [uploadedKeyFileName, setUploadedKeyFileName] = useState('');
    const [isSavingServer, setIsSavingServer] = useState(false);

    const handleKeyFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadedKeyFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result;
            if (typeof text === 'string') {
                setServerKeyContent(text.trim());
            }
        };
        reader.readAsText(file);
    };

    const triggerAlert = (message, title = 'Notice', type = 'info') => {
        setAlertNotice({ title, message, type });
        setTimeout(() => setAlertNotice(null), 5000);
    };

    const handleTogglePower = async (server) => {
        if (!server || !server.id) return;
        setPowerTogglingServerId(server.id);
        const actionWord = server.is_active ? 'turn OFF' : 'turn ON';

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(`/vps/servers/${server.id}/toggle-power`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });
            const data = await res.json();
            if (data.success) {
                setServers(prev => prev.map(s => s.id === server.id ? data.server : s));
                triggerAlert(
                    data.message,
                    data.is_active ? 'Server Powered On' : 'Server Turned Off',
                    data.is_active ? 'success' : 'warning'
                );
            } else {
                triggerAlert(data.message || `Failed to ${actionWord} server.`, 'Power Error', 'error');
            }
        } catch (err) {
            triggerAlert(`Error connecting to API: ${err.message}`, 'Network Error', 'error');
        } finally {
            setPowerTogglingServerId(null);
        }
    };

    const handleCheckHealth = async (server) => {
        if (!server || !server.id || !server.is_active) return;
        setCheckingServerId(server.id);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(`/vps/servers/${server.id}/check`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });
            const data = await res.json();
            if (data.server) {
                setServers(prev => prev.map(s => s.id === server.id ? data.server : s));
            }
            triggerAlert(
                data.message,
                data.success ? 'Health Check Passed' : 'Health Check Notice',
                data.success ? 'success' : 'warning'
            );
        } catch (err) {
            triggerAlert(err.message, 'Check Failed', 'error');
        } finally {
            setCheckingServerId(null);
        }
    };

    const handleDeleteServer = async (server) => {
        if (!confirm(`Are you sure you want to remove '${server.name}' (${server.ip})? Hosted projects will remain in dashboard but be unlinked.`)) {
            return;
        }
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(`/vps/servers/${server.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });
            const data = await res.json();
            if (data.success) {
                setServers(prev => prev.filter(s => s.id !== server.id));
                triggerAlert(`Server '${server.name}' removed successfully.`, 'Server Removed', 'success');
            }
        } catch (err) {
            triggerAlert(err.message, 'Delete Failed', 'error');
        }
    };

    const handleSaveNewServer = async (e) => {
        e.preventDefault();
        if (!serverIp || !serverUser) return;
        setIsSavingServer(true);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/vps/servers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    name: serverName || `${serverUser}@${serverIp}`,
                    ip: serverIp,
                    port: serverPort || 22,
                    user: serverUser,
                    os: osType === 'linux' ? 'Ubuntu Linux' : 'Windows Server',
                    type: osType,
                    auth_method: authMethod,
                    password: serverPassword,
                    key_content: serverKeyContent,
                    key_passphrase: serverPassphrase,
                })
            });
            const data = await res.json();
            if (data.success) {
                if (Array.isArray(data.servers)) {
                    setServers(data.servers);
                } else if (data.server) {
                    setServers(prev => [...prev, data.server]);
                }
                setAddModalOpen(false);
                setServerIp('');
                setServerName('');
                setServerPassword('');
                setServerKeyContent('');
                triggerAlert(data.message, 'Server Added', 'success');
            } else {
                triggerAlert(data.message || 'Failed to save server.', 'Error', 'error');
            }
        } catch (err) {
            triggerAlert(err.message, 'Save Error', 'error');
        } finally {
            setIsSavingServer(false);
        }
    };

    const onlineCount = servers.filter(s => s.is_active && s.status === 'online').length;
    const offlineCount = servers.filter(s => !s.is_active || s.status === 'offline').length;

    return (
        <AuthenticatedLayout>
            <Head title="Connected Servers & VPS Management" />

            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
                {/* Alert Toast */}
                {alertNotice && (
                    <div className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between text-xs transition-all shadow-xl ${
                        alertNotice.type === 'success'
                            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                            : alertNotice.type === 'warning'
                            ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                            : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                    }`}>
                        <div className="flex items-center gap-2.5">
                            {alertNotice.type === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                            )}
                            <div>
                                <span className="font-bold">{alertNotice.title}: </span>
                                <span>{alertNotice.message}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setAlertNotice(null)}
                            className="text-slate-400 hover:text-white text-xs ml-3"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <Server className="w-5 h-5" />
                            </div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                                Servers & VPS Instances
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                            Add, manage, and toggle deliberate power status for multiple cloud and on-premise servers.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={route('servers.metrics')}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                            <Activity className="w-4 h-4 text-emerald-400" />
                            <span>Server Metrics</span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                setDeployTargetServerId(servers.length > 0 ? servers[0].id : null);
                                setGithubDeployOpen(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Deploy from GitHub</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setAddModalOpen(true)}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add New Server</span>
                        </button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-[#0E131F] border border-slate-800 p-4 rounded-xl">
                        <span className="text-[11px] text-slate-400 font-medium">Total Servers</span>
                        <div className="text-xl sm:text-2xl font-bold text-white mt-1 font-mono">{servers.length}</div>
                    </div>
                    <div className="bg-[#0E131F] border border-slate-800 p-4 rounded-xl">
                        <span className="text-[11px] text-emerald-400 font-medium">Online & Active</span>
                        <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1 font-mono">{onlineCount}</div>
                    </div>
                    <div className="bg-[#0E131F] border border-slate-800 p-4 rounded-xl">
                        <span className="text-[11px] text-rose-400 font-medium">Powered Offline</span>
                        <div className="text-xl sm:text-2xl font-bold text-rose-400 mt-1 font-mono">{offlineCount}</div>
                    </div>
                    <div className="bg-[#0E131F] border border-slate-800 p-4 rounded-xl">
                        <span className="text-[11px] text-indigo-400 font-medium">Linked Workloads</span>
                        <div className="text-xl sm:text-2xl font-bold text-indigo-400 mt-1 font-mono">{projects.length}</div>
                    </div>
                </div>

                {/* Information Callout Banner */}
                {/* <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/30 via-slate-900 to-slate-900 border border-indigo-500/20 flex items-start gap-3">
                    <Power className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-300 leading-relaxed">
                        <strong className="text-white">Cascading Server Power Control: </strong>
                        When you deliberately turn a server <strong>OFF</strong>, all hosted websites, applications, and deployment pipelines under that server are immediately marked offline and suspended. Turning the server back <strong>ON</strong> restores authentication and makes your projects ready for deployment.
                    </div>
                </div> */}

                {/* Servers Grid */}
                {servers.length === 0 ? (
                    <div className="py-16 text-center rounded-2xl border border-dashed border-slate-800 bg-[#0E131F] p-8">
                        <Server className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-white mb-1">No Servers Connected Yet</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                            Connect your first VPS instance to begin deploying applications and monitoring server metrics.
                        </p>
                        <button
                            onClick={() => setAddModalOpen(true)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                        >
                            Add Your First Server
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {servers.map((srv) => {
                            const isPowerToggling = powerTogglingServerId === srv.id;
                            const isChecking = checkingServerId === srv.id;
                            const hostedCount = projects.filter(p => p.server_id === srv.id || p.ip === srv.ip).length;

                            return (
                                <div
                                    key={srv.id}
                                    className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between shadow-xl ${
                                        !srv.is_active
                                            ? 'bg-[#090D15]/90 border-rose-950/60'
                                            : 'bg-[#0E131F] border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    <Link
                                        href={route('servers.show', srv.id)}
                                        className="block group/upper transition-all cursor-pointer"
                                        title="Click to view hosted projects & edit server profile"
                                    >
                                        {/* Card Header */}
                                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-transform group-hover/upper:scale-105 ${
                                                    !srv.is_active
                                                        ? 'bg-rose-950/30 border-rose-500/30 text-rose-400'
                                                        : srv.type === 'linux'
                                                        ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-400'
                                                        : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400'
                                                }`}>
                                                    {!srv.is_active ? (
                                                        <Power className="w-5 h-5 text-rose-400" />
                                                    ) : srv.type === 'linux' ? (
                                                        <Terminal className="w-5 h-5" />
                                                    ) : (
                                                        <Monitor className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <h3 className="text-sm font-bold text-white group-hover/upper:text-indigo-400 font-mono truncate transition-colors" title={srv.name && !srv.name.includes('@') ? srv.name : `${srv.user}@${srv.ip}`}>
                                                            {srv.name && !srv.name.includes('@') ? srv.name : `${srv.user}@${srv.ip}`}
                                                        </h3>
                                                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover/upper:opacity-100 group-hover/upper:translate-x-0.5 transition-all shrink-0" />
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 font-mono truncate">
                                                        {srv.name && !srv.name.includes('@') ? `${srv.user}@${srv.ip}:${srv.port || 22}` : `Port ${srv.port || 22} • ${srv.user}`}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="flex-shrink-0">
                                                {srv.is_active ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono font-semibold">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                        ONLINE {srv.latency_ms ? `(${srv.latency_ms}ms)` : ''}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold">
                                                        <Power className="w-3 h-3 text-rose-400" />
                                                        OFFLINE
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Specs & Workloads info */}
                                        <div className="mt-3.5 space-y-2 text-xs font-mono">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">Operating System:</span>
                                                <span className="text-slate-200 truncate max-w-[170px]">{srv.os || 'Ubuntu Linux'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">Hosted Projects:</span>
                                                <span className="text-indigo-400 font-semibold font-mono">
                                                    {hostedCount} {hostedCount === 1 ? 'workload' : 'workloads'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">Auth Method:</span>
                                                <span className="text-slate-300 uppercase text-[10px]">
                                                    {srv.auth_method || 'SSH Key / Auto'}
                                                </span>
                                            </div>

                                            {!srv.is_active && (
                                                <div className="mt-2.5 p-2 rounded-xl bg-rose-950/30 border border-rose-500/25 text-[11px] text-rose-300 font-sans leading-relaxed">
                                                    Server turned off deliberately. All {hostedCount} hosted projects are currently suspended.
                                                </div>
                                            )}

                                            <div className="pt-2 flex items-center justify-between text-[11px] text-indigo-400/90 font-sans font-semibold group-hover/upper:text-indigo-300 transition-colors">
                                                <span>View Projects & Edit Server Profile</span>
                                                <span>→</span>
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Action buttons */}
                                    <div className="mt-5 pt-3.5 border-t border-slate-800 space-y-2">
                                        <div className="flex items-center gap-2">
                                            {/* Power Toggle Button */}
                                            <button
                                                type="button"
                                                disabled={isPowerToggling}
                                                onClick={() => handleTogglePower(srv)}
                                                className={`flex-1 justify-center px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 ${
                                                    srv.is_active
                                                        ? 'bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 hover:text-white'
                                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                                                }`}
                                                title={srv.is_active ? "Deliberately turn off server (all hosted projects will go offline)" : "Power on server and restore hosted applications"}
                                            >
                                                {isPowerToggling ? (
                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Power className="w-3.5 h-3.5" />
                                                )}
                                                <span>{isPowerToggling ? 'Updating...' : srv.is_active ? 'Turn Off Server' : 'Turn On Server'}</span>
                                            </button>

                                            {/* Re-verify */}
                                            <button
                                                type="button"
                                                disabled={!srv.is_active || isChecking}
                                                onClick={() => handleCheckHealth(srv)}
                                                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-40"
                                                title="Check SSH connection & latency"
                                            >
                                                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isChecking ? 'animate-spin' : ''}`} />
                                                <span>{isChecking ? 'Checking...' : 'Verify'}</span>
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDeployTargetServerId(srv.id);
                                                    setGithubDeployOpen(true);
                                                }}
                                                className="flex-1 justify-center px-2.5 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                                                title="Deploy project from GitHub under server user"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Deploy</span>
                                            </button>

                                            <Link
                                                href={`/metrics?server_id=${srv.id}`}
                                                className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-cyan-400 hover:text-cyan-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                                                title="Live Metrics"
                                            >
                                                <Activity className="w-3.5 h-3.5" />
                                                <span>Metrics</span>
                                            </Link>

                                            <Link
                                                href={`/dashboard`}
                                                className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                                                title="Projects"
                                            >
                                                <Layers className="w-3.5 h-3.5" />
                                                <span>Projects ({hostedCount})</span>
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteServer(srv)}
                                                className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-400 transition-colors"
                                                title="Remove server"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add Server Modal */}
            {addModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-[#0E131F] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <Server className="w-5 h-5 text-indigo-400" />
                                <h3 className="text-base font-bold text-white">Add New VPS Server</h3>
                            </div>
                            <button
                                onClick={() => setAddModalOpen(false)}
                                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveNewServer} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Server Friendly Name</label>
                                <input
                                    type="text"
                                    value={serverName}
                                    onChange={e => setServerName(e.target.value)}
                                    placeholder="e.g. Production Cluster / DigitalOcean London"
                                    className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Server OS</label>
                                    <select
                                        value={osType}
                                        onChange={e => setOsType(e.target.value)}
                                        className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="linux">Ubuntu / Debian / Linux</option>
                                        <option value="windows">Windows Server</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">SSH Port</label>
                                    <input
                                        type="number"
                                        value={serverPort}
                                        onChange={e => setServerPort(e.target.value)}
                                        placeholder="22"
                                        className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">IP Address / Host</label>
                                    <input
                                        type="text"
                                        required
                                        value={serverIp}
                                        onChange={e => setServerIp(e.target.value)}
                                        placeholder="169.58.38.251"
                                        className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">SSH Username</label>
                                    <input
                                        type="text"
                                        required
                                        value={serverUser}
                                        onChange={e => setServerUser(e.target.value)}
                                        placeholder="root"
                                        className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Authentication Method</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAuthMethod('auto')}
                                        className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                                            authMethod === 'auto'
                                                ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                                                : 'bg-[#080B12] border-slate-800 text-slate-400'
                                        }`}
                                    >
                                        Auto (~/.ssh)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAuthMethod('key')}
                                        className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-center transition-all flex items-center justify-center gap-1 ${
                                            authMethod === 'key'
                                                ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                                                : 'bg-[#080B12] border-slate-800 text-slate-400'
                                        }`}
                                    >
                                        <Key className="w-3 h-3" />
                                        <span>Private Key</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAuthMethod('password')}
                                        className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                                            authMethod === 'password'
                                                ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                                                : 'bg-[#080B12] border-slate-800 text-slate-400'
                                        }`}
                                    >
                                        Password
                                    </button>
                                </div>
                            </div>

                            {authMethod === 'password' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Server Password</label>
                                    <input
                                        type="password"
                                        value={serverPassword}
                                        onChange={e => setServerPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            )}

                            {authMethod === 'key' && (
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-semibold text-slate-300">Private Key (.pem / id_rsa)</label>
                                        <label className="cursor-pointer text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                                            <Upload className="w-3 h-3" />
                                            <span>{uploadedKeyFileName ? `File: ${uploadedKeyFileName}` : 'Select .pem File'}</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".pem,.key,id_rsa,id_ed25519,*"
                                                onChange={handleKeyFileUpload}
                                            />
                                        </label>
                                    </div>
                                    <textarea
                                        rows={4}
                                        value={serverKeyContent}
                                        onChange={e => setServerKeyContent(e.target.value)}
                                        placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                                        className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-white font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                                    />
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">Optional Key Passphrase</label>
                                        <input
                                            type="password"
                                            value={serverPassphrase}
                                            onChange={e => setServerPassphrase(e.target.value)}
                                            placeholder="Leave blank if unencrypted"
                                            className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>
                            )}

                            {authMethod === 'auto' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Optional Key Passphrase</label>
                                    <input
                                        type="password"
                                        value={serverPassphrase}
                                        onChange={e => setServerPassphrase(e.target.value)}
                                        placeholder="If your private key in ~/.ssh is passphrase-protected"
                                        className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            )}

                            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAddModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingServer}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {isSavingServer ? (
                                        <>
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Connect & Save Server</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Deploy from GitHub Modal */}
            <DeployGitHubModal
                isOpen={githubDeployOpen}
                onClose={() => setGithubDeployOpen(false)}
                servers={servers}
                initialServerId={deployTargetServerId}
                onProjectDeployed={(newProj) => {
                    triggerAlert(`Project '${newProj.name}' deployed under server user successfully.`, 'Project Deployed', 'success');
                }}
            />
        </AuthenticatedLayout>
    );
}
