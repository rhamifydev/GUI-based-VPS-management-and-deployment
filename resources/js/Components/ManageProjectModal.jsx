import React, { useState, useEffect } from 'react';
import {
    X,
    Globe,
    Server,
    Terminal,
    Shield,
    Lock,
    Key,
    Check,
    Copy,
    RefreshCw,
    ExternalLink,
    Zap,
    AlertCircle,
    CheckCircle2,
    Sliders,
    Folder,
    GitBranch,
    FileText,
    Play,
    Loader2
} from 'lucide-react';

export default function ManageProjectModal({
    isOpen,
    onClose,
    project,
    onProjectUpdated,
    onTriggerDeploy,
    allServers = []
}) {
    if (!isOpen || !project) return null;

    const [activeTab, setActiveTab] = useState('domain'); // 'domain' | 'general' | 'actions'
    const [domain, setDomain] = useState(project.domain || '');
    const [name, setName] = useState(project.name || '');
    const [branch, setBranch] = useState(project.branch || 'main');
    const [description, setDescription] = useState(project.description || '');
    const [autoConfigureServer, setAutoConfigureServer] = useState(true);
    const [enableSsl, setEnableSsl] = useState(false);
    const [sudoPassword, setSudoPassword] = useState('');
    const [rememberSudoPassword, setRememberSudoPassword] = useState(true);
    const [showSudoInput, setShowSudoInput] = useState(false);

    // Operation states
    const [isSaving, setIsSaving] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    const [isClearingCache, setIsClearingCache] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null); // { type, text }
    const [executionLogs, setExecutionLogs] = useState([]);
    const [copiedIp, setCopiedIp] = useState(false);

    useEffect(() => {
        if (project) {
            setDomain(project.domain || '');
            setName(project.name || '');
            setBranch(project.branch || 'main');
            setDescription(project.description || '');
            setAlertMessage(null);
            setExecutionLogs([]);
            setShowSudoInput(false);
        }
    }, [project]);

    const cleanDomainPreview = domain
        ? domain.trim().replace(/^https?:\/\//i, '').replace(/\/+.*$/, '')
        : '';

    const handleCopyIp = () => {
        navigator.clipboard.writeText(project.ip);
        setCopiedIp(true);
        setTimeout(() => setCopiedIp(false), 2000);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        setAlertMessage(null);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(`/vps/projects/${project.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    name: name.trim(),
                    domain: cleanDomainPreview || null,
                    branch: branch.trim(),
                    description: description.trim(),
                    auto_configure_server: autoConfigureServer,
                    enable_ssl: enableSsl,
                    sudo_password: sudoPassword || null,
                    remember_sudo_password: rememberSudoPassword,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                if (data.sudo_required) {
                    setShowSudoInput(true);
                    setAlertMessage({
                        type: 'warning',
                        text: data.message || 'Sudo password is required on this server to update /etc/nginx/ configurations.',
                    });
                } else {
                    setAlertMessage({
                        type: 'success',
                        text: data.message || 'Project and web server configuration saved!',
                    });
                }

                if (Array.isArray(data.logs) && data.logs.length > 0) {
                    setExecutionLogs(data.logs);
                }

                if (onProjectUpdated && data.project) {
                    onProjectUpdated(data.project);
                }
            } else {
                setAlertMessage({
                    type: 'error',
                    text: data.message || 'Failed to update project.',
                });
                if (Array.isArray(data.logs) && data.logs.length > 0) {
                    setExecutionLogs(data.logs);
                }
            }
        } catch (err) {
            setAlertMessage({
                type: 'error',
                text: `Network error: ${err.message}`,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePullChanges = async () => {
        setIsPulling(true);
        setAlertMessage(null);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(`/vps/projects/${project.id}/pull`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ branch: branch.trim() }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setAlertMessage({ type: 'success', text: data.message });
                if (data.output) setExecutionLogs([data.output]);
                if (onProjectUpdated && data.project) onProjectUpdated(data.project);
            } else {
                setAlertMessage({ type: 'error', text: data.message || 'Pull failed.' });
            }
        } catch (err) {
            setAlertMessage({ type: 'error', text: err.message });
        } finally {
            setIsPulling(false);
        }
    };

    const handleClearCache = async () => {
        setIsClearingCache(true);
        setAlertMessage(null);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(`/vps/projects/${project.id}/clear-cache`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setAlertMessage({ type: 'success', text: data.message });
                if (data.output) setExecutionLogs([data.output]);
            } else {
                setAlertMessage({ type: 'error', text: data.message || 'Cache clear failed.' });
            }
        } catch (err) {
            setAlertMessage({ type: 'error', text: err.message });
        } finally {
            setIsClearingCache(false);
        }
    };

    const liveUrl = cleanDomainPreview ? `http://${cleanDomainPreview}` : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-[#090D1A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 sm:p-5 bg-[#0C1122] border-b border-slate-800/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                            <Folder className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-white font-mono truncate">
                                    {project.name}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0">
                                    {project.framework || 'app'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                                {project.user}@{project.ip}:{project.port || 22} • {project.path}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 px-4 sm:px-5 pt-3 bg-[#0B0F20] border-b border-slate-800/80">
                    <button
                        type="button"
                        onClick={() => setActiveTab('domain')}
                        className={`px-3.5 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'domain'
                                ? 'text-cyan-400 border-cyan-400 bg-cyan-950/20'
                                : 'text-slate-400 border-transparent hover:text-slate-200'
                        }`}
                    >
                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Domain & Web Server</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('general')}
                        className={`px-3.5 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'general'
                                ? 'text-indigo-400 border-indigo-400 bg-indigo-950/20'
                                : 'text-slate-400 border-transparent hover:text-slate-200'
                        }`}
                    >
                        <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Project Details</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('actions')}
                        className={`px-3.5 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'actions'
                                ? 'text-emerald-400 border-emerald-400 bg-emerald-950/20'
                                : 'text-slate-400 border-transparent hover:text-slate-200'
                        }`}
                    >
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Server Actions</span>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                    {/* Feedback alert */}
                    {alertMessage && (
                        <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in ${
                            alertMessage.type === 'success'
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                : alertMessage.type === 'warning'
                                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                        }`}>
                            {alertMessage.type === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 leading-relaxed">{alertMessage.text}</div>
                        </div>
                    )}

                    {/* TAB 1: DOMAIN & WEB SERVER */}
                    {activeTab === 'domain' && (
                        <div className="space-y-4">
                            {/* Domain Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                                        Custom Domain / Subdomain URL
                                    </span>
                                    {liveUrl && (
                                        <a
                                            href={liveUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                                        >
                                            <span>Visit live</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={domain}
                                        onChange={(e) => setDomain(e.target.value)}
                                        placeholder="e.g. store.rhamify.com or mywebsite.com"
                                        className="w-full px-3.5 py-2.5 bg-[#050811] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400">
                                    Simply enter your domain or subdomain. Antigravity handles the web server configuration automatically.
                                </p>
                            </div>

                            {/* Automation Switches */}
                            <div className="p-3.5 bg-[#050811] border border-slate-800 rounded-xl space-y-3">
                                <label className="flex items-start gap-3 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={autoConfigureServer}
                                        onChange={(e) => setAutoConfigureServer(e.target.checked)}
                                        className="mt-0.5 rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-0 w-4 h-4"
                                    />
                                    <div>
                                        <span className="text-xs font-semibold text-slate-200 block">
                                            ✨ Automatically Configure Nginx on VPS
                                        </span>
                                        <span className="text-[11px] text-slate-400 leading-relaxed block mt-0.5">
                                            Creates or updates <code className="text-cyan-300 font-mono">/etc/nginx/sites-available</code>, routes traffic to <code className="text-indigo-300 font-mono">{project.path}/public</code>, links the PHP-FPM socket, updates <code className="text-amber-300 font-mono">.env</code> APP_URL, and reloads Nginx.
                                        </span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer select-none pt-2 border-t border-slate-800/80">
                                    <input
                                        type="checkbox"
                                        checked={enableSsl}
                                        onChange={(e) => setEnableSsl(e.target.checked)}
                                        className="mt-0.5 rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-0 w-4 h-4"
                                    />
                                    <div>
                                        <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                                            <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                            Issue Free SSL Certificate (HTTPS via Certbot)
                                        </span>
                                        <span className="text-[11px] text-slate-400 leading-relaxed block mt-0.5">
                                            Requires your domain's DNS A-Record to already be pointing to <code className="text-slate-200 font-mono">{project.ip}</code>.
                                        </span>
                                    </div>
                                </label>
                            </div>

                            {/* Sudo Password Input (if needed) */}
                            {(showSudoInput || autoConfigureServer) && (
                                <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                            <Key className="w-3.5 h-3.5 text-amber-400" />
                                            Server / Sudo Password {showSudoInput ? '(Required for /etc/nginx/)' : '(Optional)'}
                                        </label>
                                        <span className="text-[10px] text-slate-500 font-mono">Needed if sudo requires password</span>
                                    </div>
                                    <input
                                        type="password"
                                        value={sudoPassword}
                                        onChange={(e) => setSudoPassword(e.target.value)}
                                        placeholder="Enter password for sudo privileges"
                                        className="w-full px-3 py-2 bg-[#050811] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                                        <input
                                            type="checkbox"
                                            checked={rememberSudoPassword}
                                            onChange={(e) => setRememberSudoPassword(e.target.checked)}
                                            className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                                        />
                                        <span className="text-[11px] text-slate-400">
                                            Remember password for server <code className="text-slate-300">{project.ip}</code>
                                        </span>
                                    </label>
                                </div>
                            )}

                            {/* DNS A-Record Instructions */}
                            <div className="p-3.5 bg-[#050811] border border-slate-800 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5 text-indigo-400" />
                                        DNS Settings for your Domain Provider
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopyIp}
                                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 transition-colors"
                                    >
                                        {copiedIp ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                        <span>{copiedIp ? 'Copied' : 'Copy IP'}</span>
                                    </button>
                                </div>
                                <div className="text-[11px] text-slate-400 space-y-1">
                                    <p>At Cloudflare, Namecheap, or GoDaddy, add this DNS record:</p>
                                    <div className="grid grid-cols-3 gap-2 font-mono text-[11px] p-2 bg-[#020409] rounded-lg border border-slate-800/80 text-center">
                                        <div>
                                            <span className="text-slate-500 text-[9px] block uppercase">Type</span>
                                            <span className="text-emerald-400 font-bold">A</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 text-[9px] block uppercase">Name / Host</span>
                                            <span className="text-indigo-300 font-bold truncate block">
                                                {cleanDomainPreview.split('.')[0] || '@'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 text-[9px] block uppercase">Target / Value</span>
                                            <span className="text-cyan-300 font-bold">{project.ip}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: GENERAL PROJECT SETTINGS */}
                    {activeTab === 'general' && (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-300">Project Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-[#050811] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                    <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                                    Git Branch
                                </label>
                                <input
                                    type="text"
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                    placeholder="e.g. main"
                                    className="w-full px-3.5 py-2.5 bg-[#050811] border border-slate-800 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-300">Remote Server Path</label>
                                <input
                                    type="text"
                                    value={project.path}
                                    disabled
                                    className="w-full px-3.5 py-2.5 bg-[#050811]/60 border border-slate-800/60 rounded-xl text-slate-400 font-mono text-xs cursor-not-allowed"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-300">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Add notes about this workload..."
                                    className="w-full px-3.5 py-2.5 bg-[#050811] border border-slate-800 rounded-xl text-white text-xs focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* TAB 3: SERVER ACTIONS */}
                    {activeTab === 'actions' && (
                        <div className="space-y-3">
                            <div className="p-3.5 bg-[#050811] border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                                        <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                                        Pull Latest Git Changes
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Runs <code className="text-indigo-300 font-mono">git pull origin {branch}</code> and refreshes commit metadata.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handlePullChanges}
                                    disabled={isPulling}
                                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                                >
                                    {isPulling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                                    <span>{isPulling ? 'Pulling...' : 'Pull Now'}</span>
                                </button>
                            </div>

                            <div className="p-3.5 bg-[#050811] border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                                        Clear Application Cache
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Runs <code className="text-amber-300 font-mono">php artisan optimize:clear</code> on remote server.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClearCache}
                                    disabled={isClearingCache}
                                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                                >
                                    {isClearingCache ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                    <span>{isClearingCache ? 'Clearing...' : 'Clear Cache'}</span>
                                </button>
                            </div>

                            {project.server_id && (
                                <div className="p-3.5 bg-[#050811] border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-xs font-semibold text-white flex items-center gap-2">
                                            <Folder className="w-3.5 h-3.5 text-cyan-400" />
                                            Browse Remote Files
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Open Windows-style file explorer to inspect or edit files like <code className="text-emerald-300 font-mono">.env</code>.
                                        </p>
                                    </div>
                                    <a
                                        href={`/servers/${project.server_id}`}
                                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>Open Explorer</span>
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Live Server Logs / Console Output */}
                    {executionLogs.length > 0 && (
                        <div className="space-y-1.5 pt-2">
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                                Server Automation Output:
                            </span>
                            <div className="p-3 bg-[#020408] border border-slate-800 rounded-xl font-mono text-xs text-emerald-400/90 max-h-36 overflow-y-auto space-y-1">
                                {executionLogs.map((line, idx) => (
                                    <div key={idx} className="break-all whitespace-pre-wrap flex items-start gap-1.5">
                                        <span className="text-slate-600 select-none">$</span>
                                        <span>{line}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-4 bg-[#0B0F20] border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                    >
                        Close
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-indigo-700 hover:from-cyan-500 hover:to-indigo-600 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span>{isSaving ? 'Configuring on VPS...' : 'Save & Apply to Server'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
