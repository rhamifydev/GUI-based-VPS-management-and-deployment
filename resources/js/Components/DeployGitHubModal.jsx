import React, { useState, useEffect, useMemo } from 'react';
import {
    GitBranch,
    FolderGit2,
    Search,
    RefreshCw,
    Check,
    AlertCircle,
    X,
    ExternalLink,
    Terminal,
    Server,
    Layers,
    ArrowRight,
    Globe,
    Lock,
    Sparkles,
    Shield,
    Loader2,
    CheckCircle2
} from 'lucide-react';

export default function DeployGitHubModal({
    isOpen,
    onClose,
    servers = [],
    initialServerId = null,
    onProjectDeployed = () => {},
}) {
    const [repositories, setRepositories] = useState([]);
    const [isLoadingRepos, setIsLoadingRepos] = useState(false);
    const [repoError, setRepoError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [githubUsername, setGithubUsername] = useState('rhamifydev');
    const [githubToken, setGithubToken] = useState(() => {
        try {
            return localStorage.getItem('vps_github_token') || '';
        } catch (e) {
            return '';
        }
    });
    const [hasToken, setHasToken] = useState(false);
    const [showTokenSettings, setShowTokenSettings] = useState(false);
    const [tokenInput, setTokenInput] = useState('');
    const [filterTab, setFilterTab] = useState('all'); // 'all' | 'private' | 'public'
    const [scopeWarning, setScopeWarning] = useState(null);
    const [repoCounts, setRepoCounts] = useState({ total: 0, private: 0, public: 0 });
    const [tokenUser, setTokenUser] = useState(null);

    // Selected state
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [selectedServerId, setSelectedServerId] = useState(() => {
        if (initialServerId) return initialServerId;
        const active = servers.find(s => s.is_active) || servers[0];
        return active ? active.id : null;
    });

    // Deployment form fields
    const [targetPath, setTargetPath] = useState('');
    const [branch, setBranch] = useState('main');
    const [framework, setFramework] = useState('laravel');
    const [domain, setDomain] = useState('');
    const [manualGitUrl, setManualGitUrl] = useState('');

    // Deployment progress state
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployResult, setDeployResult] = useState(null);
    const [deployLogs, setDeployLogs] = useState([]);

    // Keep selectedServerId in sync with initialServerId or servers
    useEffect(() => {
        if (initialServerId) {
            setSelectedServerId(initialServerId);
        } else if (!selectedServerId && servers.length > 0) {
            const active = servers.find(s => s.is_active) || servers[0];
            if (active) setSelectedServerId(active.id);
        }
    }, [initialServerId, servers]);

    const activeServer = useMemo(() => {
        return servers.find(s => String(s.id) === String(selectedServerId)) || servers[0] || null;
    }, [servers, selectedServerId]);

    // Load repositories on modal open
    useEffect(() => {
        if (isOpen) {
            loadGitHubRepos();
            setDeployResult(null);
            setDeployLogs([]);
        }
    }, [isOpen]);

    const loadGitHubRepos = async (customUser = null, explicitToken = null) => {
        setIsLoadingRepos(true);
        setRepoError(null);
        try {
            const userQuery = customUser !== null ? customUser : githubUsername;
            const tokenToUse = explicitToken !== null ? explicitToken : githubToken;
            const params = new URLSearchParams();
            if (userQuery) params.set('username', userQuery);
            if (tokenToUse) params.set('token', tokenToUse);

            const res = await fetch(`/vps/github/repos?${params.toString()}`, {
                headers: { 'Accept': 'application/json' }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setRepositories(data.repos || []);
                setHasToken(Boolean(data.has_token));
                setScopeWarning(data.scope_warning || null);
                if (data.counts) {
                    setRepoCounts(data.counts);
                } else {
                    const priv = (data.repos || []).filter(r => r.is_private).length;
                    setRepoCounts({
                        total: (data.repos || []).length,
                        private: priv,
                        public: (data.repos || []).length - priv,
                    });
                }
                if (data.token_user) setTokenUser(data.token_user);
                if (data.username) setGithubUsername(data.username);
                if (tokenToUse) {
                    try {
                        localStorage.setItem('vps_github_token', tokenToUse);
                    } catch (e) {}
                    setGithubToken(tokenToUse);
                }
            } else {
                setRepoError(data.message || 'Could not load GitHub repositories.');
            }
        } catch (err) {
            setRepoError(`Network error loading repositories: ${err.message}`);
        } finally {
            setIsLoadingRepos(false);
        }
    };

    const handleSaveToken = (e) => {
        e?.preventDefault();
        const trimmed = tokenInput.trim();
        if (!trimmed) return;
        setGithubToken(trimmed);
        try {
            localStorage.setItem('vps_github_token', trimmed);
        } catch (err) {}
        setShowTokenSettings(false);
        loadGitHubRepos(null, trimmed);
    };

    const handleClearToken = () => {
        setGithubToken('');
        setTokenInput('');
        setScopeWarning(null);
        setTokenUser(null);
        try {
            localStorage.removeItem('vps_github_token');
        } catch (err) {}
        setShowTokenSettings(false);
        loadGitHubRepos(null, '');
    };

    // When repository is selected, configure target path and framework
    const handleSelectRepo = (repo) => {
        setSelectedRepo(repo);
        const serverUser = activeServer?.user || 'deployer';
        const cleanSlug = repo.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        
        // Path strictly under the user on the server
        if (activeServer?.type === 'windows') {
            setTargetPath(`C:\\inetpub\\wwwroot\\${cleanSlug}`);
        } else {
            setTargetPath(`/home/${serverUser}/${cleanSlug}`);
        }

        setBranch(repo.default_branch || 'main');
        setFramework(repo.framework || 'laravel');
        setManualGitUrl(repo.clone_url);
    };

    // Update target path if server changes
    useEffect(() => {
        if (selectedRepo && activeServer) {
            const serverUser = activeServer.user || 'deployer';
            const cleanSlug = selectedRepo.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
            if (activeServer.type === 'windows') {
                setTargetPath(`C:\\inetpub\\wwwroot\\${cleanSlug}`);
            } else {
                setTargetPath(`/home/${serverUser}/${cleanSlug}`);
            }
        }
    }, [selectedServerId]);

    // Filtered repositories
    const filteredRepos = useMemo(() => {
        let list = repositories;
        if (filterTab === 'private') {
            list = list.filter(r => r.is_private);
        } else if (filterTab === 'public') {
            list = list.filter(r => !r.is_private);
        }
        if (!searchQuery.trim()) return list;
        const q = searchQuery.toLowerCase();
        return list.filter(r => 
            r.name.toLowerCase().includes(q) ||
            (r.description && r.description.toLowerCase().includes(q)) ||
            (r.language && r.language.toLowerCase().includes(q))
        );
    }, [repositories, searchQuery, filterTab]);

    const handleConfirmDeploy = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!activeServer) {
            alert('Please select a target server to deploy onto.');
            return;
        }

        const repoName = selectedRepo?.name || manualGitUrl.split('/').pop().replace('.git', '') || 'my-app';
        const gitUrl = selectedRepo?.clone_url || manualGitUrl;

        if (!gitUrl || !gitUrl.trim()) {
            alert('Please select or specify a GitHub repository.');
            return;
        }

        setIsDeploying(true);
        setDeployLogs([`Starting one-click GitHub deployment for ${repoName}...`]);
        setDeployResult(null);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/vps/projects/deploy-github', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    server_id: activeServer.id,
                    repo_name: repoName,
                    git_url: gitUrl,
                    branch: branch || 'main',
                    target_path: targetPath || `/home/${activeServer.user}/${repoName}`,
                    framework: framework || 'laravel',
                    domain: domain.trim() || null,
                    token: githubToken || undefined,
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setDeployResult(data);
                if (data.output) {
                    setDeployLogs(prev => [...prev, data.output]);
                }
                onProjectDeployed(data.project);
            } else {
                setDeployResult({ success: false, message: data.message || 'Deployment failed.' });
                if (data.output) {
                    setDeployLogs(prev => [...prev, data.output]);
                }
            }
        } catch (err) {
            setDeployResult({ success: false, message: `Network error: ${err.message}` });
        } finally {
            setIsDeploying(false);
        }
    };

    if (!isOpen) return null;

    const languageColors = {
        PHP: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        JavaScript: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        TypeScript: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        Python: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        Shell: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        HTML: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        CSS: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-4xl bg-[#0B0F19] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-indigo-950/60 max-h-[92vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-[1px] shadow-lg shadow-indigo-500/25">
                            <div className="w-full h-full bg-[#0B0F19] rounded-[15px] flex items-center justify-center">
                                <FolderGit2 className="w-5 h-5 text-indigo-400" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                <span>Deploy GitHub Project to VPS</span>
                                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                                    One-Click Deploy
                                </span>
                            </h3>
                            <p className="text-xs text-slate-400">
                                Select a GitHub repository to clone and deploy under user <strong className="text-white font-mono">{activeServer?.user || 'server user'}</strong>
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={isDeploying}
                        onClick={onClose}
                        className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-40"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800 pr-1">
                    {/* Step 1: GitHub Account & Search Bar */}
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                            <div className="flex items-center flex-wrap gap-2 text-xs">
                                <span className="text-slate-400">GitHub Source:</span>
                                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono font-semibold flex items-center gap-1.5">
                                    <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                                    @{githubUsername}
                                </span>

                                {/* Private Repo Token Status Badge */}
                                <button
                                    type="button"
                                    onClick={() => setShowTokenSettings(!showTokenSettings)}
                                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
                                        hasToken || githubToken
                                            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40'
                                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                                    }`}
                                    title="Click to configure GitHub Personal Access Token for private repositories"
                                >
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>{hasToken || githubToken ? 'Private & Public Enabled' : 'Unlock Private Repos'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => loadGitHubRepos()}
                                    disabled={isLoadingRepos}
                                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                                    title="Refresh repositories list"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRepos ? 'animate-spin text-cyan-400' : ''}`} />
                                </button>
                            </div>

                            {/* Search filter */}
                            <div className="relative w-full sm:w-64">
                                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Filter repositories..."
                                    className="w-full bg-[#070A11] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                                />
                            </div>
                        </div>

                        {/* Token Input Configuration Panel */}
                        {showTokenSettings && (
                            <form onSubmit={handleSaveToken} className="p-3.5 rounded-2xl bg-[#090D18] border border-indigo-500/30 space-y-2.5 animate-fade-in shadow-xl">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>GitHub Personal Access Token (for Private Repositories)</span>
                                    </span>
                                    {githubToken && (
                                        <button
                                            type="button"
                                            onClick={handleClearToken}
                                            className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                                        >
                                            Clear Token
                                        </button>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    GitHub's public API only returns public repositories. To fetch and deploy your <strong>private repositories</strong>, paste a GitHub Personal Access Token (with the <code className="text-indigo-300 font-mono">repo</code> scope).
                                </p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="password"
                                        value={tokenInput}
                                        onChange={(e) => setTokenInput(e.target.value)}
                                        placeholder={githubToken ? '•••••••••••••••••••••••••••••• (Token Saved)' : 'ghp_xxxxxxxxxxxxxxxxxxxxxx'}
                                        className="flex-1 bg-[#050811] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!tokenInput.trim() || isLoadingRepos}
                                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md transition-all shrink-0"
                                    >
                                        {isLoadingRepos ? 'Verifying...' : 'Save & Load Private Repos'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowTokenSettings(false)}
                                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                                    >
                                        Close
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Scope Warning Banner if token lacks repo scope */}
                        {scopeWarning && (
                            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                                <div className="space-y-1">
                                    <span className="font-bold">GitHub Scope Notice: </span>
                                    <span>{scopeWarning}</span>
                                </div>
                            </div>
                        )}

                        {/* Filter Tabs: All / Private / Public */}
                        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 pb-1">
                            <div className="inline-flex p-1 rounded-xl bg-[#070A11] border border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setFilterTab('all')}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                        filterTab === 'all'
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    All Repos ({repoCounts.total || repositories.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilterTab('private')}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                        filterTab === 'private'
                                            ? 'bg-amber-600 text-white shadow-sm'
                                            : 'text-slate-400 hover:text-amber-300'
                                    }`}
                                >
                                    <Lock className="w-3 h-3" />
                                    <span>Private ({repoCounts.private ?? repositories.filter(r => r.is_private).length})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilterTab('public')}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                        filterTab === 'public'
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Public ({repoCounts.public ?? repositories.filter(r => !r.is_private).length})
                                </button>
                            </div>

                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                                {hasToken || githubToken ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        Authenticated via PAT
                                    </span>
                                ) : (
                                    <span className="text-slate-500">Unauthenticated (Public Only)</span>
                                )}
                            </div>
                        </div>

                        {/* Repositories Scrollable Grid */}
                        <div className="border border-slate-800 rounded-2xl bg-[#070A11] p-2.5 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                            {isLoadingRepos ? (
                                <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                                    <span>Fetching repositories from GitHub API...</span>
                                </div>
                            ) : repoError ? (
                                <div className="py-8 text-center text-rose-400 text-xs px-4">
                                    <AlertCircle className="w-6 h-6 mx-auto mb-1 text-rose-400" />
                                    <p className="font-semibold">{repoError}</p>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Check your GitHub Personal Access Token or ensure your network can reach api.github.com.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => loadGitHubRepos()}
                                        className="mt-3 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : filteredRepos.length === 0 ? (
                                <div className="py-10 text-center text-slate-400 text-xs px-4">
                                    {filterTab === 'private' ? (
                                        <div className="space-y-1.5">
                                            <Lock className="w-6 h-6 text-amber-400 mx-auto" />
                                            <p className="font-bold text-slate-200">No private repositories found under this account.</p>
                                            <p className="text-[11px] text-slate-400">
                                                Ensure your GitHub token has the <strong className="text-amber-300 font-mono">repo</strong> scope checked, or click "Unlock Private Repos" to update your token.
                                            </p>
                                        </div>
                                    ) : (
                                        <p>No repositories found matching "{searchQuery}".</p>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {filteredRepos.map((repo) => {
                                        const isSelected = selectedRepo?.name === repo.name;
                                        const langBadgeClass = languageColors[repo.language] || 'text-slate-300 bg-slate-800 border-slate-700';

                                        return (
                                            <div
                                                key={repo.id || repo.name}
                                                onClick={() => handleSelectRepo(repo)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                                                    isSelected
                                                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500'
                                                        : 'bg-[#0B0F19] hover:bg-[#111726] border-slate-800/80 hover:border-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold text-xs text-white truncate font-mono">
                                                                {repo.name}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                                            {repo.description || 'No description provided'}
                                                        </p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                                            <Check className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-slate-500 border-t border-slate-800/50">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`px-2 py-0.5 rounded border font-semibold ${langBadgeClass}`}>
                                                            {repo.language || 'Web'}
                                                        </span>
                                                        {repo.is_private ? (
                                                            <span className="px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                                                <Lock className="w-2.5 h-2.5" />
                                                                <span>PRIVATE</span>
                                                            </span>
                                                        ) : (
                                                            <span className="px-1.5 py-0.5 rounded font-medium bg-slate-800/80 text-slate-400 border border-slate-700">
                                                                PUBLIC
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span>branch: {repo.default_branch}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 2: Deployment Destination Configuration */}
                    <form onSubmit={handleConfirmDeploy} className="space-y-4 pt-1">
                        <div className="p-4 rounded-2xl bg-[#070A11] border border-slate-800 space-y-3.5">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Server className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Target Server & Deployment Configuration</span>
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {/* Server Node Selector */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Target Server Node <span className="text-rose-400">*</span>
                                    </label>
                                    <select
                                        value={selectedServerId || ''}
                                        onChange={(e) => setSelectedServerId(e.target.value)}
                                        className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                                        required
                                    >
                                        {servers.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.user}@{s.ip}:{s.port || 22} ({s.name})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-emerald-400 mt-1 font-mono">
                                        ✓ Deploys under user: <strong>{activeServer?.user || 'server user'}</strong>
                                    </p>
                                </div>

                                {/* Framework Stack */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Application Stack
                                    </label>
                                    <select
                                        value={framework}
                                        onChange={(e) => setFramework(e.target.value)}
                                        className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                                    >
                                        <option value="laravel">Laravel (PHP & Composer auto-build)</option>
                                        <option value="node">Node.js (npm install & build)</option>
                                        <option value="nextjs">Next.js / React</option>
                                        <option value="vue">Vue.js / Nuxt</option>
                                        <option value="python">Python (virtualenv & pip)</option>
                                        <option value="static">Static HTML / CSS</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                {/* Destination Directory Path */}
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Directory Path on Server <span className="text-rose-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={targetPath}
                                        onChange={(e) => setTargetPath(e.target.value)}
                                        placeholder={`/home/${activeServer?.user || 'deployer'}/my-app`}
                                        className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                                        required
                                    />
                                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                                        Files and dependencies will be created under user {activeServer?.user}
                                    </span>
                                </div>

                                {/* Branch */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Git Branch
                                    </label>
                                    <input
                                        type="text"
                                        value={branch}
                                        onChange={(e) => setBranch(e.target.value)}
                                        placeholder="main"
                                        className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Optional Domain Binding */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Custom Domain / Subdomain (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    placeholder="e.g. store.mydomain.com"
                                    className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                                />
                            </div>
                        </div>

                        {/* Deployment Status & Console Logs */}
                        {(isDeploying || deployResult) && (
                            <div className="p-4 rounded-2xl bg-[#05070D] border border-slate-800 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-white flex items-center gap-1.5 font-mono">
                                        <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                                        Deployment Console
                                    </span>
                                    {isDeploying ? (
                                        <span className="flex items-center gap-1.5 text-cyan-400 font-mono text-[11px] animate-pulse">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Executing remote commands on VPS...
                                        </span>
                                    ) : deployResult?.success ? (
                                        <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px] font-bold">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Deployed Successfully ({deployResult.duration})
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-rose-400 font-mono text-[11px] font-bold">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Deployment Failed
                                        </span>
                                    )}
                                </div>

                                {deployResult?.message && (
                                    <p className={`text-xs font-mono p-2 rounded-lg ${
                                        deployResult.success ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/30 text-rose-300 border border-rose-500/30'
                                    }`}>
                                        {deployResult.message}
                                    </p>
                                )}

                                <div className="bg-black/90 p-3 rounded-xl border border-slate-900 font-mono text-[11px] text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                    {deployLogs.map((log, i) => (
                                        <div key={i} className="text-slate-300">
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Modal Footer Controls */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                                {selectedRepo ? `Selected: ${selectedRepo.name} (${branch})` : 'Select a repository above'}
                            </span>

                            <div className="flex items-center gap-3 ml-auto">
                                <button
                                    type="button"
                                    disabled={isDeploying}
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors"
                                >
                                    {deployResult?.success ? 'Close' : 'Cancel'}
                                </button>

                                <button
                                    type="submit"
                                    disabled={isDeploying || (!selectedRepo && !manualGitUrl)}
                                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 disabled:opacity-40 flex items-center gap-2 transition-all"
                                >
                                    {isDeploying ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Deploying under {activeServer?.user}...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 text-cyan-200" />
                                            <span>Confirm & Deploy Project 🚀</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
