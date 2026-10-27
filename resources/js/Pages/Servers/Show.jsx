import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Server,
    Terminal,
    Power,
    Plus,
    Activity,
    Layers,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    X,
    Folder,
    FolderOpen,
    FolderGit2,
    GitBranch,
    ExternalLink,
    Lock,
    Key,
    Shield,
    Trash2,
    Play,
    Loader2,
    Clock,
    Search,
    Sliders,
    Eye,
    EyeOff,
    FileCode,
    FileText,
    File,
    ChevronRight,
    Globe,
    Cpu,
    RefreshCw
} from 'lucide-react';

export default function ServerShow({ server: initialServer, projects: initialProjects = [], allServers = [] }) {
    const [server, setServer] = useState(initialServer);
    const [projects, setProjects] = useState(initialProjects);

    // Modals & Drawers
    const [editProfileOpen, setEditProfileOpen] = useState(false);
    const [createProjectOpen, setCreateProjectOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [frameworkFilter, setFrameworkFilter] = useState('all');

    // Action loaders
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [isPowerToggling, setIsPowerToggling] = useState(false);
    const [isDeployingId, setIsDeployingId] = useState(null);
    const [alertNotice, setAlertNotice] = useState(null);

    // Password & Passphrase visibility toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showPassphrase, setShowPassphrase] = useState(false);

    // Edit Server Profile Form State
    const [editForm, setEditForm] = useState({
        name: server.name || '',
        user: server.user || 'root',
        port: server.port || 22,
        auth_method: server.auth_method || 'auto',
        password: '',
        key_passphrase: '',
        key_content: '',
        key_path: server.key_path || '',
        os: server.os || 'Ubuntu Linux',
        type: server.type || 'linux',
    });

    // Create New Project Form State
    const [newProjectForm, setNewProjectForm] = useState({
        name: '',
        path: `/var/www/my-app`,
        git_url: '',
        branch: 'main',
        framework: 'laravel',
        domain: '',
        description: '',
    });

    const triggerAlert = (message, title = 'Notice', type = 'info') => {
        setAlertNotice({ title, message, type });
        setTimeout(() => setAlertNotice(null), 5000);
    };

    // Toggle server power
    const handleTogglePower = async () => {
        setIsPowerToggling(true);
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
                setServer(data.server);
                if (data.projects) {
                    setProjects(data.projects.filter(p => p.server_id === server.id || p.ip === server.ip));
                }
                triggerAlert(
                    data.message,
                    data.is_active ? 'Server Powered On' : 'Server Turned Off',
                    data.is_active ? 'success' : 'warning'
                );
            } else {
                triggerAlert(data.message || 'Failed to toggle power state.', 'Error', 'error');
            }
        } catch (err) {
            triggerAlert(err.message, 'Network Error', 'error');
        } finally {
            setIsPowerToggling(false);
        }
    };

    // Save edited server profile
    const handleSaveServerProfile = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(`/vps/servers/${server.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (data.success) {
                setServer(data.server);
                setEditProfileOpen(false);
                triggerAlert(data.message, 'Server Profile Updated', 'success');
            } else {
                triggerAlert(data.message || 'Failed to update server profile.', 'Validation Error', 'error');
            }
        } catch (err) {
            triggerAlert(err.message, 'Network Error', 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Create new project on this server
    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!newProjectForm.name.trim()) {
            triggerAlert('Project name is required.', 'Input Error', 'warning');
            return;
        }

        setIsCreatingProject(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const payload = {
                name: newProjectForm.name.trim(),
                ip: server.ip,
                port: server.port,
                user: server.user,
                path: newProjectForm.path.trim(),
                git_url: newProjectForm.git_url.trim() || null,
                branch: newProjectForm.branch.trim() || 'main',
                framework: newProjectForm.framework,
                domain: newProjectForm.domain.trim() || null,
                description: newProjectForm.description.trim() || `Hosted on ${server.name}`,
                auth_method: server.auth_method,
                is_connected: server.is_active,
            };

            const res = await fetch('/vps/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success && data.project) {
                setProjects(prev => [data.project, ...prev.filter(p => p.id !== data.project.id)]);
                setCreateProjectOpen(false);
                setNewProjectForm({
                    name: '',
                    path: `/var/www/app-${Date.now().toString().slice(-4)}`,
                    git_url: '',
                    branch: 'main',
                    framework: 'laravel',
                    domain: '',
                    description: '',
                });
                triggerAlert(`Project '${data.project.name}' successfully initialized on ${server.name}.`, 'Project Created', 'success');
            } else {
                triggerAlert(data.message || 'Failed to create project record.', 'Creation Error', 'error');
            }
        } catch (err) {
            triggerAlert(err.message, 'Creation Failed', 'error');
        } finally {
            setIsCreatingProject(false);
        }
    };

    // Quick deploy for a project
    const handleDeployProject = async (proj) => {
        if (!server.is_active) {
            triggerAlert(`Cannot deploy while '${server.name}' is turned off. Please power on the server first.`, 'Server Offline', 'warning');
            return;
        }

        setIsDeployingId(proj.id);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/vps/deploy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    project_id: proj.id,
                    branch: proj.branch || 'main',
                    path: proj.path,
                    ip: server.ip,
                    port: server.port,
                    user: server.user,
                }),
            });
            const data = await res.json();
            if (data.success && data.project) {
                setProjects(prev => prev.map(p => p.id === proj.id ? data.project : p));
                if (selectedProject?.id === proj.id) {
                    setSelectedProject(data.project);
                }
                triggerAlert(data.message || `Deployed latest commit: ${data.commit}`, 'Deploy Successful', 'success');
            } else {
                triggerAlert(data.message || 'Deployment execution encountered an error.', 'Deploy Error', 'error');
            }
        } catch (err) {
            triggerAlert(err.message, 'Deploy Failed', 'error');
        } finally {
            setIsDeployingId(null);
        }
    };

    // Delete a project
    const handleDeleteProject = async (proj) => {
        if (!confirm(`Are you sure you want to remove '${proj.name}'? The remote directory on ${server.ip} will not be deleted.`)) {
            return;
        }
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(`/vps/projects/${proj.id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });
            const data = await res.json();
            if (data.success) {
                setProjects(prev => prev.filter(p => p.id !== proj.id));
                if (selectedProject?.id === proj.id) {
                    setSelectedProject(null);
                }
                triggerAlert(`Project '${proj.name}' removed from dashboard.`, 'Project Removed', 'info');
            }
        } catch (err) {
            triggerAlert(err.message, 'Delete Error', 'error');
        }
    };

    // Filter projects
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchesSearch = !searchQuery.trim() ||
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.path && p.path.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (p.domain && p.domain.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesFramework = frameworkFilter === 'all' ||
                (p.framework && p.framework.toLowerCase().includes(frameworkFilter.toLowerCase()));

            return matchesSearch && matchesFramework;
        });
    }, [projects, searchQuery, frameworkFilter]);

    return (
        <AuthenticatedLayout>
            <Head title={`${server.name} - Projects & Server Profile`} />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                {/* Floating Notification */}
                {alertNotice && (
                    <div className={`p-4 rounded-2xl flex items-center justify-between text-xs shadow-xl animate-fade-in ${
                        alertNotice.type === 'error'
                            ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
                            : alertNotice.type === 'warning'
                            ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                            : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                    }`}>
                        <div className="flex items-center gap-2.5">
                            {alertNotice.type === 'error' ? (
                                <AlertCircle className="w-4 h-4 text-rose-400" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            )}
                            <div>
                                <span className="font-bold">{alertNotice.title}:</span> {alertNotice.message}
                            </div>
                        </div>
                        <button onClick={() => setAlertNotice(null)} className="text-slate-400 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Breadcrumbs & Navigation Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('servers.index')}
                            className="p-2 rounded-xl bg-[#0E131F] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all flex items-center justify-center"
                            title="Back to Servers"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Link href={route('servers.index')} className="hover:text-indigo-400 transition-colors">
                                    Servers & VPS
                                </Link>
                                <span>/</span>
                                <span className="text-slate-200 font-medium font-mono">{server.name}</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 mt-0.5">
                                <span className="font-mono">{server.name}</span>
                                {server.is_active ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        ONLINE {server.latency_ms ? `(${server.latency_ms}ms)` : ''}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold">
                                        <Power className="w-3 h-3 text-rose-400" />
                                        POWERED OFF
                                    </span>
                                )}
                            </h1>
                        </div>
                    </div>

                    {/* Quick Server Switcher & Primary Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                            href={route('servers.metrics', { server_id: server.id })}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                            <Activity className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Live Metrics</span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => setEditProfileOpen(true)}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Edit Server Profile</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setCreateProjectOpen(true)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Project</span>
                        </button>
                    </div>
                </div>

                {/* Server Profile Identity Hero Card */}
                <div className={`rounded-3xl p-6 sm:p-7 border transition-all shadow-2xl relative overflow-hidden ${
                    !server.is_active
                        ? 'bg-[#090D15]/95 border-rose-950/60'
                        : 'bg-gradient-to-br from-[#0E131F] via-[#101728] to-[#0A0D14] border-slate-800/90'
                }`}>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
                        <div className="flex items-start sm:items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl ${
                                !server.is_active
                                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-400'
                                    : server.type === 'linux'
                                    ? 'bg-indigo-950/50 border-indigo-500/40 text-indigo-400'
                                    : 'bg-cyan-950/50 border-cyan-500/40 text-cyan-400'
                            }`}>
                                {!server.is_active ? (
                                    <Power className="w-7 h-7 text-rose-400" />
                                ) : (
                                    <Server className="w-7 h-7" />
                                )}
                            </div>

                            <div className="min-w-0">
                                <div className="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span className="text-white font-bold text-sm">{server.user}@{server.ip}:{server.port || 22}</span>
                                    <span>•</span>
                                    <span>{server.os || 'Ubuntu Linux'}</span>
                                    <span>•</span>
                                    <span className="uppercase text-[11px] text-slate-300">{server.type || 'linux'}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                                        <Key className="w-3 h-3 text-indigo-400" />
                                        Auth: {server.auth_method === 'key' ? 'SSH Key' : (server.auth_method === 'password' ? 'Password' : 'Auto / Key')}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                                        <Lock className="w-3 h-3 text-cyan-400" />
                                        Passphrase: {server.has_key || server.key_passphrase ? 'Configured' : 'None'}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
                                        <Layers className="w-3 h-3" />
                                        {projects.length} Hosted {projects.length === 1 ? 'Project' : 'Projects'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Power Control & Live Toggle Button */}
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                type="button"
                                disabled={isPowerToggling}
                                onClick={handleTogglePower}
                                className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 shadow-lg ${
                                    server.is_active
                                        ? 'bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300'
                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                                }`}
                            >
                                {isPowerToggling ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Power className="w-4 h-4" />
                                )}
                                <span>{server.is_active ? 'Turn Server OFF' : 'Power Server ON'}</span>
                            </button>
                        </div>
                    </div>

                    {!server.is_active && (
                        <div className="mt-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2.5">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                            <span>
                                This server is currently switched OFF. All hosted projects and deployment webhooks are inactive until the server is turned back on.
                            </span>
                        </div>
                    )}
                </div>

                {/* Projects Section Header & Search Controls */}
                <div className="bg-[#0E131F] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                                <Folder className="w-4 h-4 text-indigo-400" />
                                <span>Projects Hosted on This Server</span>
                                <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300 font-mono">
                                    {filteredProjects.length}
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Medium-size interactive folder cards representing projects. Folders show open with files when deployed.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setCreateProjectOpen(true)}
                            className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create Project</span>
                        </button>
                    </div>

                    {/* Filter / Search Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-slate-800/80">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                <Search className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search projects by name, path, or domain..."
                                className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono"
                            />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <select
                                value={frameworkFilter}
                                onChange={(e) => setFrameworkFilter(e.target.value)}
                                className="bg-[#080B12] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
                            >
                                <option value="all">All Stacks</option>
                                <option value="laravel">Laravel</option>
                                <option value="node">Node / Express</option>
                                <option value="next">Next.js</option>
                                <option value="static">HTML / Static</option>
                            </select>

                            {(searchQuery || frameworkFilter !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setFrameworkFilter('all');
                                    }}
                                    className="px-2.5 py-2 text-xs text-slate-400 hover:text-white"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Medium-Size Folder Grid */}
                {filteredProjects.length === 0 ? (
                    <div className="py-16 text-center rounded-2xl border border-dashed border-slate-800 bg-[#0E131F] p-8">
                        <Folder className="w-14 h-14 text-slate-600 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-white mb-1">
                            {projects.length === 0 ? 'No Projects on this Server Yet' : 'No matching projects found'}
                        </h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
                            {projects.length === 0
                                ? `Initialize your first project on ${server.name} to start deploying websites and services.`
                                : 'Try clearing your search query or stack filters.'}
                        </p>
                        {projects.length === 0 && (
                            <button
                                onClick={() => setCreateProjectOpen(true)}
                                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
                            >
                                Create Your First Project
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                        {filteredProjects.map((proj) => {
                            // Determine if folder has files (has commit, deploy time, git url, or domain)
                            const hasFiles = Boolean(
                                (proj.commit && proj.commit !== 'empty') ||
                                (proj.last_deploy_time) ||
                                (proj.git_url) ||
                                (proj.framework && proj.framework !== 'none')
                            );

                            const isDeploying = isDeployingId === proj.id;

                            return (
                                <div
                                    key={proj.id}
                                    onClick={() => setSelectedProject(proj)}
                                    className="group relative bg-[#0E131F] hover:bg-[#121929] border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-indigo-950/40 hover:-translate-y-1"
                                >
                                    {/* Medium Size Cyber Folder Icon Container */}
                                    <div className="relative w-24 h-20 mb-3 flex items-center justify-center">
                                        {hasFiles ? (
                                            /* Open Folder with Protruding Code Files */
                                            <div className="relative w-20 h-16 transition-transform duration-300 group-hover:scale-105">
                                                {/* Back flap of folder */}
                                                <div className="absolute inset-x-1 bottom-0 h-12 bg-indigo-950/80 border border-indigo-500/40 rounded-xl" />

                                                {/* Protruding file 1 (Left code file) */}
                                                <div className="absolute left-2.5 top-0 w-6 h-8 bg-[#090C15] border border-cyan-400/50 rounded shadow-md transform -rotate-6 group-hover:-translate-y-1.5 transition-transform flex items-center justify-center">
                                                    <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                                                </div>

                                                {/* Protruding file 2 (Center document) */}
                                                <div className="absolute left-6 top-0.5 w-6 h-8 bg-[#090C15] border border-indigo-400/60 rounded shadow-md group-hover:-translate-y-2 transition-transform flex items-center justify-center">
                                                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                                </div>

                                                {/* Protruding file 3 (Right env file) */}
                                                <div className="absolute right-2.5 top-1 w-6 h-8 bg-[#090C15] border border-emerald-400/50 rounded shadow-md transform rotate-6 group-hover:-translate-y-1 transition-transform flex items-center justify-center">
                                                    <File className="w-3.5 h-3.5 text-emerald-400" />
                                                </div>

                                                {/* Open Front folder flap with gradient */}
                                                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 rounded-xl shadow-lg border-t border-indigo-300/40 flex items-end justify-between px-2 pb-1.5 opacity-95">
                                                    <span className="w-2 h-1 bg-white/40 rounded-full" />
                                                    <span className="text-[9px] font-mono font-bold text-white tracking-wider uppercase">
                                                        {proj.framework ? proj.framework.slice(0, 4) : 'APP'}
                                                    </span>
                                                </div>

                                                {/* Live Status indicator pill */}
                                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0E131F] shadow" />
                                            </div>
                                        ) : (
                                            /* Closed / Empty Folder */
                                            <div className="relative w-18 h-14 transition-transform duration-300 group-hover:scale-105 flex items-center justify-center">
                                                <div className="w-16 h-12 bg-slate-900 border border-slate-700/80 rounded-xl flex items-center justify-center shadow-md">
                                                    <Folder className="w-8 h-8 text-slate-500 group-hover:text-slate-400 transition-colors" />
                                                </div>
                                                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-slate-600 border-2 border-[#0E131F]" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Name under the Folder Icon */}
                                    <div className="w-full">
                                        <h3
                                            className="text-xs font-bold text-white group-hover:text-indigo-400 font-mono truncate transition-colors"
                                            title={proj.name}
                                        >
                                            {proj.name}
                                        </h3>

                                        {/* Branch & Framework subline */}
                                        <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono truncate">
                                            <GitBranch className="w-3 h-3 text-indigo-400 shrink-0" />
                                            <span className="truncate">{proj.branch || 'main'}</span>
                                        </div>

                                        {/* Status badge / Contains files tag */}
                                        <div className="mt-2 flex items-center justify-center">
                                            {hasFiles ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                                    Active Files
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center text-[10px] font-medium text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                                                    Empty Directory
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Edit Server Profile Modal */}
                {editProfileOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="relative w-full max-w-xl bg-[#0E131F] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                            <button
                                type="button"
                                onClick={() => setEditProfileOpen(false)}
                                className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                                    <Sliders className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white tracking-tight">
                                        Edit Server Profile
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Modify SSH credentials, username, and key passphrase for {server.ip}
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSaveServerProfile} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Server Friendly Name */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Server Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                                            placeholder="e.g. Production Node 01"
                                            required
                                        />
                                    </div>

                                    {/* SSH User / Username */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            SSH Username <span className="text-rose-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.user}
                                            onChange={(e) => setEditForm({ ...editForm, user: e.target.value })}
                                            className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                                            placeholder="root / ubuntu / deploy"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* SSH Port */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            SSH Port
                                        </label>
                                        <input
                                            type="number"
                                            value={editForm.port}
                                            onChange={(e) => setEditForm({ ...editForm, port: parseInt(e.target.value) || 22 })}
                                            className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                                            placeholder="22"
                                        />
                                    </div>

                                    {/* Auth Method */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Authentication Mode
                                        </label>
                                        <select
                                            value={editForm.auth_method}
                                            onChange={(e) => setEditForm({ ...editForm, auth_method: e.target.value })}
                                            className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                                        >
                                            <option value="auto">Auto-Detect</option>
                                            <option value="key">SSH Private Key</option>
                                            <option value="password">Password Only</option>
                                        </select>
                                    </div>

                                    {/* OS Type */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            OS Type
                                        </label>
                                        <select
                                            value={editForm.type}
                                            onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                                            className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                                        >
                                            <option value="linux">Linux (Bash/Nginx)</option>
                                            <option value="windows">Windows (IIS/PowerShell)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* SSH Key Passphrase */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                                        <span>SSH Key Passphrase (if encrypted key)</span>
                                        <span className="text-[11px] text-slate-500">Leave blank if unchanged</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassphrase ? 'text' : 'password'}
                                            value={editForm.key_passphrase}
                                            onChange={(e) => setEditForm({ ...editForm, key_passphrase: e.target.value })}
                                            placeholder={server.key_passphrase ? '•••••••••••• (Encrypted in database)' : 'Enter key passphrase'}
                                            className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassphrase(!showPassphrase)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                                        >
                                            {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Server Password */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                                        <span>Server SSH / Sudo Password</span>
                                        <span className="text-[11px] text-slate-500">Leave blank if unchanged</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={editForm.password}
                                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                            placeholder={server.has_password ? '•••••••••••• (Encrypted in database)' : 'Enter server password'}
                                            className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Custom SSH Key Content */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                                        <span>Private Key PEM Content (optional)</span>
                                        <span className="text-[11px] text-slate-500">Auto-probes ~/.ssh/id_ed25519 if empty</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={editForm.key_content}
                                        onChange={(e) => setEditForm({ ...editForm, key_content: e.target.value })}
                                        placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                                        className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl p-3 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setEditProfileOpen(false)}
                                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingProfile}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSavingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        <span>Save Server Profile</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Create New Project Modal */}
                {createProjectOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="relative w-full max-w-lg bg-[#0E131F] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 max-h-[90vh] overflow-y-auto">
                            <button
                                type="button"
                                onClick={() => setCreateProjectOpen(false)}
                                className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-[1px]">
                                    <div className="w-full h-full bg-[#0E131F] rounded-[11px] flex items-center justify-center">
                                        <Plus className="w-5 h-5 text-indigo-400" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white tracking-tight">
                                        Create New Project on {server.name}
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Adds a new workload folder to this server instance.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateProject} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Project Name <span className="text-rose-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newProjectForm.name}
                                        onChange={(e) => {
                                            const name = e.target.value;
                                            const slug = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
                                            setNewProjectForm({
                                                ...newProjectForm,
                                                name,
                                                path: `/var/www/${slug || 'my-app'}`
                                            });
                                        }}
                                        placeholder="e.g. My Nextjs Portal"
                                        className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Target Server Directory Path <span className="text-rose-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newProjectForm.path}
                                        onChange={(e) => setNewProjectForm({ ...newProjectForm, path: e.target.value })}
                                        placeholder="/var/www/my-app"
                                        className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Application Framework
                                        </label>
                                        <select
                                            value={newProjectForm.framework}
                                            onChange={(e) => setNewProjectForm({ ...newProjectForm, framework: e.target.value })}
                                            className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                                        >
                                            <option value="laravel">Laravel (PHP)</option>
                                            <option value="node">Node.js / Express</option>
                                            <option value="nextjs">Next.js / React</option>
                                            <option value="vue">Vue.js / Nuxt</option>
                                            <option value="python">Python / Django / Flask</option>
                                            <option value="static">Static HTML / CSS</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Git Branch
                                        </label>
                                        <input
                                            type="text"
                                            value={newProjectForm.branch}
                                            onChange={(e) => setNewProjectForm({ ...newProjectForm, branch: e.target.value })}
                                            placeholder="main"
                                            className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Git Repository URL (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={newProjectForm.git_url}
                                        onChange={(e) => setNewProjectForm({ ...newProjectForm, git_url: e.target.value })}
                                        placeholder="git@github.com:username/repository.git"
                                        className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                                    />
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        If provided, deployment triggers will pull latest commits from this repo.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Domain / Nginx Host (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={newProjectForm.domain}
                                        onChange={(e) => setNewProjectForm({ ...newProjectForm, domain: e.target.value })}
                                        placeholder="app.example.com"
                                        className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setCreateProjectOpen(false)}
                                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreatingProject}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isCreatingProject && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        <span>Create Project Folder</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Project Quick Inspector / Drawer Modal */}
                {selectedProject && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="relative w-full max-w-lg bg-[#0E131F] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-indigo-950/40">
                            <button
                                type="button"
                                onClick={() => setSelectedProject(null)}
                                className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-4 mb-5 pb-4 border-b border-slate-800">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                                    <FolderOpen className="w-6 h-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-base font-bold text-white font-mono truncate">
                                        {selectedProject.name}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-mono truncate">
                                        {selectedProject.path}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 text-xs font-mono mb-6">
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080B12] border border-slate-800/80">
                                    <span className="text-slate-400">Target Server:</span>
                                    <span className="text-white font-bold">{server.name} ({server.ip})</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080B12] border border-slate-800/80">
                                    <span className="text-slate-400">Active Branch:</span>
                                    <span className="text-indigo-400 font-bold flex items-center gap-1">
                                        <GitBranch className="w-3.5 h-3.5" />
                                        {selectedProject.branch || 'main'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080B12] border border-slate-800/80">
                                    <span className="text-slate-400">Latest Commit:</span>
                                    <span className="text-slate-200 truncate max-w-[200px]">
                                        {selectedProject.commit || 'live / uncommitted'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080B12] border border-slate-800/80">
                                    <span className="text-slate-400">Last Deploy:</span>
                                    <span className="text-slate-200">
                                        {selectedProject.last_deploy_human || 'Never'}
                                    </span>
                                </div>
                                {selectedProject.domain && (
                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080B12] border border-slate-800/80">
                                        <span className="text-slate-400">Live Domain:</span>
                                        <a
                                            href={`http://${selectedProject.domain}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-cyan-400 hover:underline flex items-center gap-1 truncate max-w-[200px]"
                                        >
                                            <span>{selectedProject.domain}</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => handleDeleteProject(selectedProject)}
                                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900 text-rose-400 text-xs font-medium transition-colors flex items-center gap-1.5"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                </button>

                                <div className="flex items-center gap-2">
                                    <Link
                                        href={route('dashboard')}
                                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium"
                                    >
                                        Open in Dashboard
                                    </Link>
                                    <button
                                        type="button"
                                        disabled={isDeployingId === selectedProject.id || !server.is_active}
                                        onClick={() => handleDeployProject(selectedProject)}
                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        {isDeployingId === selectedProject.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Play className="w-3.5 h-3.5" />
                                        )}
                                        <span>Deploy Now</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
