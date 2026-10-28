import React, { useState, useEffect, useMemo, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import DeployGitHubModal from '@/Components/DeployGitHubModal';
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
    FolderTree,
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
    RefreshCw,
    CornerLeftUp,
    Save,
    LayoutGrid,
    List,
    Home,
    Sparkles,
    Maximize2,
    Minimize2,
    WrapText,
    Copy,
    Check
} from 'lucide-react';

export default function ServerShow({ server: initialServer, projects: initialProjects = [], allServers = [] }) {
    const [server, setServer] = useState(initialServer);
    const [projects, setProjects] = useState(initialProjects);

    // Active Selected Project for File Explorer (defaults to first project)
    const [activeProject, setActiveProject] = useState(() => {
        return initialProjects.length > 0 ? initialProjects[0] : null;
    });

    // File Explorer State
    const [currentPath, setCurrentPath] = useState(activeProject?.path || '');
    const [fileItems, setFileItems] = useState([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [showHiddenFiles, setShowHiddenFiles] = useState(true); // Enabled by default to show .env, .git, etc.
    const [fileSearchQuery, setFileSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [explorerError, setExplorerError] = useState(null);

    // In-Memory Client Directory Cache (keyed by `${projectId}:${normalizedPath}`)
    const dirCacheRef = useRef(new Map());
    const [isRevalidatingFiles, setIsRevalidatingFiles] = useState(false);

    // File Editor State
    const [editingFile, setEditingFile] = useState(null); // { path, name, content, originalContent, size, extension }
    const [isLoadingFileContent, setIsLoadingFileContent] = useState(false);
    const [loadingFileName, setLoadingFileName] = useState(null);
    const [isSavingFile, setIsSavingFile] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
    const [isWordWrap, setIsWordWrap] = useState(false);
    const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const editorTextareaRef = useRef(null);
    const editorLineNumbersRef = useRef(null);

    // Modals
    const [editProfileOpen, setEditProfileOpen] = useState(false);
    const [createProjectOpen, setCreateProjectOpen] = useState(false);

    // Action loaders & alerts
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [isPowerToggling, setIsPowerToggling] = useState(false);
    const [alertNotice, setAlertNotice] = useState(null);

    // Password & Passphrase visibility toggles in edit modal
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

    // Load files for current project and path with instant client-side caching
    const loadDirectory = async (projectId, targetPath, forceRefresh = false) => {
        if (!projectId) return;

        const cleanPath = (targetPath || '').replace(/\/+$/, '') || '/';
        const cacheKey = `${projectId}:${cleanPath}`;
        const cached = dirCacheRef.current.get(cacheKey);

        // If folder is already cached and not a forced reload, switch INSTANTLY (0ms delay)
        if (cached && !forceRefresh) {
            setCurrentPath(cached.current_path);
            setFileItems(cached.items || []);
            setExplorerError(null);
            setIsLoadingFiles(false);

            // Background Stale-While-Revalidate if cached more than 45 seconds ago
            const now = Date.now();
            if (now - (cached.timestamp || 0) > 45000) {
                setIsRevalidatingFiles(true);
                try {
                    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                    const res = await fetch(`/vps/projects/${projectId}/files`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-CSRF-TOKEN': csrfToken || '',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        body: JSON.stringify({ path: targetPath || '' }),
                    });
                    const data = await res.json();
                    if (data.success) {
                        dirCacheRef.current.set(cacheKey, {
                            current_path: data.current_path,
                            items: data.items || [],
                            timestamp: Date.now(),
                        });
                        // Only update UI if user is still on this folder
                        setCurrentPath(curr => {
                            if (curr === data.current_path) {
                                setFileItems(data.items || []);
                            }
                            return curr;
                        });
                    }
                } catch (e) {
                    // Ignore silent background update errors
                } finally {
                    setIsRevalidatingFiles(false);
                }
            }
            return;
        }

        // Cache miss or forceRefresh requested: show loading state
        setIsLoadingFiles(true);
        setExplorerError(null);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(`/vps/projects/${projectId}/files`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ path: targetPath || '' }),
            });
            let data;
            try {
                data = await res.json();
            } catch (jsonErr) {
                data = { success: false, message: `Server error (${res.status}): could not read directory.` };
            }

            if (data.success) {
                const fetchedPath = data.current_path;
                const fetchedItems = data.items || [];
                const actualKey = `${projectId}:${(fetchedPath || '').replace(/\/+$/, '') || '/'}`;

                dirCacheRef.current.set(actualKey, {
                    current_path: fetchedPath,
                    items: fetchedItems,
                    timestamp: Date.now(),
                });

                setCurrentPath(fetchedPath);
                setFileItems(fetchedItems);
            } else {
                setExplorerError(data.message || 'Failed to list remote directory.');
                setFileItems([]);
            }
        } catch (err) {
            setExplorerError(err.message || 'Network error while contacting server.');
            setFileItems([]);
        } finally {
            setIsLoadingFiles(false);
        }
    };

    // When active project changes, automatically load its base directory
    useEffect(() => {
        if (activeProject) {
            setCurrentPath(activeProject.path || '');
            loadDirectory(activeProject.id, activeProject.path);
        } else {
            setFileItems([]);
            setCurrentPath('');
        }
    }, [activeProject?.id]);

    // Open file in in-browser editor
    const handleOpenFile = async (fileItem) => {
        if (!activeProject || fileItem.is_dir) return;
        setIsLoadingFileContent(true);
        setLoadingFileName(fileItem.name);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(`/vps/projects/${activeProject.id}/file-content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ file_path: fileItem.path }),
            });
            const data = await res.json();
            if (data.success) {
                setEditingFile({
                    path: data.file_path,
                    name: data.file_name,
                    content: data.content ?? '',
                    originalContent: data.content ?? '',
                    size: data.size_formatted,
                    extension: data.extension,
                });
                setIsDirty(false);
            } else {
                triggerAlert(data.message || 'Could not read file.', 'File Error', 'error');
            }
        } catch (err) {
            triggerAlert(err.message || 'Error opening file.', 'Read Error', 'error');
        } finally {
            setIsLoadingFileContent(false);
            setLoadingFileName(null);
        }
    };

    // Save edited file
    const handleSaveFile = async () => {
        if (!activeProject || !editingFile) return;
        setIsSavingFile(true);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(`/vps/projects/${activeProject.id}/save-file`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    file_path: editingFile.path,
                    content: editingFile.content,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setEditingFile(prev => ({
                    ...prev,
                    originalContent: prev.content,
                    size: data.size_formatted,
                }));
                setIsDirty(false);
                triggerAlert(data.message || 'File saved successfully.', 'Saved', 'success');
                // Refresh folder list to update file size and timestamp
                loadDirectory(activeProject.id, currentPath, true);
            } else {
                triggerAlert(data.message || 'Failed to save file.', 'Save Error', 'error');
            }
        } catch (err) {
            triggerAlert(err.message, 'Network Error', 'error');
        } finally {
            setIsSavingFile(false);
        }
    };

    // Keyboard shortcut for saving file (Ctrl+S / Cmd+S)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                if (editingFile) {
                    e.preventDefault();
                    handleSaveFile();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editingFile, activeProject]);

    // Handle Tab key inside editor textarea
    const handleEditorKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;
            const newValue = value.substring(0, start) + '    ' + value.substring(end);
            setEditingFile(prev => ({ ...prev, content: newValue }));
            setIsDirty(true);
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 4;
            }, 0);
        }
    };

    // Synchronize vertical scroll between editor line numbers and textarea
    const handleEditorScroll = (e) => {
        if (editorLineNumbersRef.current) {
            editorLineNumbersRef.current.scrollTop = e.target.scrollTop;
        }
    };

    // Live update cursor Ln, Col
    const handleEditorCursorUpdate = (e) => {
        const textarea = e.target;
        const selStart = textarea.selectionStart || 0;
        const textBefore = (textarea.value || '').substring(0, selStart);
        const lines = textBefore.split('\n');
        setCursorPos({
            line: lines.length,
            col: lines[lines.length - 1].length + 1,
        });
    };

    // Copy file content to clipboard with feedback
    const handleCopyContent = () => {
        if (!editingFile) return;
        navigator.clipboard.writeText(editingFile.content || '');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Calculate line numbers array
    const lineNumbers = useMemo(() => {
        if (!editingFile) return [1];
        const count = (editingFile.content || '').split('\n').length;
        return Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1);
    }, [editingFile?.content]);

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
                    const updated = data.projects.filter(p => p.server_id === server.id || p.ip === server.ip);
                    setProjects(updated);
                    if (activeProject) {
                        const matched = updated.find(p => p.id === activeProject.id);
                        if (matched) setActiveProject(matched);
                    }
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
                const nextProjects = [data.project, ...projects.filter(p => p.id !== data.project.id)];
                setProjects(nextProjects);
                setActiveProject(data.project);
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
                triggerAlert(`Project '${data.project.name}' successfully initialized.`, 'Project Created', 'success');
            } else {
                triggerAlert(data.message || 'Failed to create project record.', 'Creation Error', 'error');
            }
        } catch (err) {
            triggerAlert(err.message, 'Creation Failed', 'error');
        } finally {
            setIsCreatingProject(false);
        }
    };

    // Navigate to parent folder
    const handleNavigateUp = () => {
        if (!currentPath || !activeProject) return;
        const trimmed = currentPath.replace(/\/+$/, '');
        const parent = trimmed.substring(0, trimmed.lastIndexOf('/')) || '/';
        loadDirectory(activeProject.id, parent);
    };

    // Filter files and folders based on hidden toggle and search query
    const displayedItems = useMemo(() => {
        return fileItems.filter(item => {
            if (!showHiddenFiles && item.is_hidden) return false;
            if (fileSearchQuery.trim() && !item.name.toLowerCase().includes(fileSearchQuery.toLowerCase())) {
                return false;
            }
            return true;
        });
    }, [fileItems, showHiddenFiles, fileSearchQuery]);

    // Split breadcrumb path into clickable components
    const breadcrumbParts = useMemo(() => {
        if (!currentPath) return [];
        const clean = currentPath.replace(/\/+$/, '');
        if (!clean) return [{ name: '/', path: '/' }];
        const parts = clean.split('/').filter(Boolean);
        const crumbs = [];
        let runningPath = '';
        for (const p of parts) {
            runningPath += '/' + p;
            crumbs.push({ name: p, path: runningPath });
        }
        return crumbs;
    }, [currentPath]);

    // Get specific file icon based on name and extension
    const renderFileIcon = (item, size = "w-4 h-4") => {
        if (!item) return <File className={`${size} text-slate-400 shrink-0`} />;
        if (item.is_dir) {
            return <Folder className={`${size} text-amber-400 group-hover:text-amber-300 transition-colors shrink-0`} />;
        }

        const name = (item.name || '').toLowerCase();
        const ext = (item.extension || '').toLowerCase();

        if (name === '.env' || name.startsWith('.env.')) {
            return <Lock className={`${size} text-emerald-400 shrink-0`} />;
        }
        if (name === 'composer.json' || name === 'package.json') {
            return <FileCode className={`${size} text-indigo-400 shrink-0`} />;
        }
        if (['php', 'blade.php'].includes(ext)) {
            return <FileCode className={`${size} text-indigo-400 shrink-0`} />;
        }
        if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) {
            return <FileCode className={`${size} text-cyan-400 shrink-0`} />;
        }
        if (['json', 'yaml', 'yml', 'xml'].includes(ext)) {
            return <FileCode className={`${size} text-amber-400 shrink-0`} />;
        }
        if (['html', 'css', 'scss'].includes(ext)) {
            return <FileCode className={`${size} text-rose-400 shrink-0`} />;
        }
        if (['md', 'txt', 'log'].includes(ext)) {
            return <FileText className={`${size} text-slate-400 shrink-0`} />;
        }
        if (['sh', 'bash', 'zsh'].includes(ext)) {
            return <Terminal className={`${size} text-emerald-400 shrink-0`} />;
        }

        return <File className={`${size} text-slate-400 shrink-0`} />;
    };

    return (
        <AuthenticatedLayout>
            <Head title={`${server.name} - Projects & Remote File Explorer`} />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                {/* Floating Notification Alert */}
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

                {/* Sleek Top Server Header Bar */}
                <div className="bg-[#0E131F] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <Link
                            href={route('servers.index')}
                            className="p-2 rounded-xl bg-[#090C15] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all flex items-center justify-center shrink-0"
                            title="Back to Servers"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-lg sm:text-xl font-extrabold text-white font-mono tracking-tight truncate">
                                    {server.name && !server.name.includes('@') ? server.name : `${server.user}@${server.ip}`}
                                </h1>
                                {server.is_active ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        ONLINE {server.latency_ms ? `(${server.latency_ms}ms)` : ''}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-mono font-bold">
                                        <Power className="w-3 h-3 text-rose-400" />
                                        OFFLINE
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                <span className="text-slate-200">{server.user}@{server.ip}:{server.port || 22}</span>
                                <span>•</span>
                                <span>{server.os || 'Ubuntu Linux'}</span>
                                <span>•</span>
                                <span className="text-indigo-400 font-semibold">{projects.length} Hosted Workloads</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                            type="button"
                            disabled={isPowerToggling}
                            onClick={handleTogglePower}
                            className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 border shadow-sm ${
                                server.is_active
                                    ? 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-800/60 text-rose-300'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                            }`}
                        >
                            {isPowerToggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                            <span>{server.is_active ? 'Turn OFF' : 'Power ON'}</span>
                        </button>

                        <Link
                            href={route('servers.metrics', { server_id: server.id })}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                            <Activity className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Metrics</span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => setEditProfileOpen(true)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Edit Server Profile</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setCreateProjectOpen(true)}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>New Project</span>
                        </button>
                    </div>
                </div>

                {/* Section 1: Projects Hosted on This Server (Medium-size folder selector) */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <div>
                            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                                <Folder className="w-4 h-4 text-indigo-400" />
                                <span>Projects Hosted on This Server</span>
                                <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300 font-mono">
                                    {projects.length}
                                </span>
                            </h2>
                            <p className="text-[11px] text-slate-400">
                                Click any project below to browse, edit, and save its remote files & folders.
                            </p>
                        </div>
                    </div>

                    {projects.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-[#0E131F]">
                            <Folder className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                            <p className="text-xs text-slate-400 mb-3">No projects found on this server yet.</p>
                            <button
                                onClick={() => setCreateProjectOpen(true)}
                                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                            >
                                Create First Project
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                            {projects.map((proj) => {
                                const isSelected = activeProject?.id === proj.id;
                                const hasFiles = Boolean(proj.commit || proj.last_deploy_time || proj.git_url);

                                return (
                                    <div
                                        key={proj.id}
                                        onClick={() => {
                                            setActiveProject(proj);
                                            setEditingFile(null);
                                        }}
                                        className={`group relative rounded-2xl p-3.5 flex flex-col items-center text-center cursor-pointer transition-all duration-200 border ${
                                            isSelected
                                                ? 'bg-gradient-to-b from-[#141B2D] to-[#0E131F] border-indigo-500 shadow-xl shadow-indigo-950/60 ring-2 ring-indigo-500/30'
                                                : 'bg-[#0E131F] hover:bg-[#121826] border-slate-800 hover:border-slate-700'
                                        }`}
                                    >
                                        {/* Medium Folder Icon Visual */}
                                        <div className="relative w-16 h-14 mb-2 flex items-center justify-center">
                                            {isSelected ? (
                                                <FolderOpen className="w-12 h-12 text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.5)] transition-transform group-hover:scale-105" />
                                            ) : hasFiles ? (
                                                <Folder className="w-12 h-12 text-indigo-400/90 transition-transform group-hover:scale-105" />
                                            ) : (
                                                <Folder className="w-12 h-12 text-slate-500 transition-transform group-hover:scale-105" />
                                            )}
                                            {isSelected && (
                                                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0E131F] shadow" />
                                            )}
                                        </div>

                                        {/* Project Name */}
                                        <div className="w-full">
                                            <h3 className={`text-xs font-bold font-mono truncate ${isSelected ? 'text-indigo-300' : 'text-white'}`}>
                                                {proj.name}
                                            </h3>
                                            <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                                                {proj.branch || 'main'} • {proj.framework || 'app'}
                                            </div>
                                            {isSelected ? (
                                                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                                                    Browsing Files ↓
                                                </span>
                                            ) : (
                                                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] text-slate-500 bg-slate-900 border border-slate-800">
                                                    Select to View
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Section 2: Windows-Like File & Folder Explorer (Downward from projects) */}
                {activeProject && (
                    <div className="bg-[#0E131F] border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                        {/* Windows-style Explorer Toolbar & Address Bar */}
                        <div className="p-3.5 bg-[#090C15] border-b border-slate-800 space-y-3">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                {/* Navigation Action Buttons & Address Breadcrumb */}
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <button
                                        type="button"
                                        onClick={handleNavigateUp}
                                        title="Up one folder"
                                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors shrink-0"
                                    >
                                        <CornerLeftUp className="w-4 h-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => loadDirectory(activeProject.id, activeProject.path)}
                                        title="Project Root"
                                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors shrink-0"
                                    >
                                        <Home className="w-4 h-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => loadDirectory(activeProject.id, currentPath, true)}
                                        title="Refresh Directory (Force Fetch)"
                                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors shrink-0"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isLoadingFiles || isRevalidatingFiles ? 'animate-spin text-indigo-400' : ''}`} />
                                    </button>

                                    {/* Address Bar / Clickable Breadcrumbs */}
                                    <div className="flex items-center gap-1 bg-[#080B12] border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-300 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 flex-1 min-w-0">
                                        <span className="text-slate-500 shrink-0">📁 /</span>
                                        {breadcrumbParts.map((crumb, idx) => (
                                            <React.Fragment key={crumb.path}>
                                                <button
                                                    type="button"
                                                    onClick={() => loadDirectory(activeProject.id, crumb.path)}
                                                    className="hover:text-indigo-400 hover:underline shrink-0 font-medium"
                                                >
                                                    {crumb.name}
                                                </button>
                                                {idx < breadcrumbParts.length - 1 && (
                                                    <span className="text-slate-600 shrink-0">/</span>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>

                                {/* Controls: Hidden Files Toggle, Search, View Mode */}
                                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                                    {/* Show Hidden Files Toggle (includes .env, .git, etc.) */}
                                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 cursor-pointer hover:bg-slate-800/80 transition-colors select-none">
                                        <input
                                            type="checkbox"
                                            checked={showHiddenFiles}
                                            onChange={(e) => setShowHiddenFiles(e.target.checked)}
                                            className="rounded bg-[#080B12] border-slate-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                                        />
                                        <span className="flex items-center gap-1 font-mono text-[11px]">
                                            <Lock className="w-3 h-3 text-emerald-400" />
                                            Show Hidden (.env, .git)
                                        </span>
                                    </label>

                                    {/* Search Files */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={fileSearchQuery}
                                            onChange={(e) => setFileSearchQuery(e.target.value)}
                                            placeholder="Filter files..."
                                            className="bg-[#080B12] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-36 sm:w-44 font-mono"
                                        />
                                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                                    </div>

                                    {/* View Mode Toggle */}
                                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('grid')}
                                            className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                            title="Grid View (Windows Icons)"
                                        >
                                            <LayoutGrid className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('list')}
                                            className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                            title="List / Details View"
                                        >
                                            <List className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* File Explorer Content Area */}
                        <div className="p-4 min-h-[300px]">
                            {isLoadingFiles ? (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-xs">
                                    <Loader2 className="w-7 h-7 text-indigo-400 animate-spin mb-3" />
                                    <span>Reading remote filesystem over SSH...</span>
                                </div>
                            ) : explorerError ? (
                                <div className="p-6 text-center text-rose-400 text-xs font-mono">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
                                    <p className="text-slate-400 mt-1 max-w-lg mx-auto break-words">{explorerError}</p>
                                    <div className="flex items-center justify-center gap-2 mt-4">
                                        <button
                                            type="button"
                                            onClick={() => loadDirectory(activeProject.id, currentPath || activeProject.path, true)}
                                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-semibold shadow transition-colors flex items-center gap-1.5"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            <span>Retry</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => loadDirectory(activeProject.id, activeProject.path)}
                                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-sans text-xs transition-colors"
                                        >
                                            Back to Project Root
                                        </button>
                                    </div>
                                </div>
                            ) : displayedItems.length === 0 ? (
                                <div className="py-16 text-center text-slate-500 text-xs font-mono">
                                    <Folder className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                                    <span>This directory is empty.</span>
                                </div>
                            ) : viewMode === 'grid' ? (
                                /* Compact Windows-Style File & Folder Explorer (No bulky containers, 8-10+ per line) */
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-x-2 gap-y-1">
                                    {displayedItems.map((item) => (
                                        <div
                                            key={item.path}
                                            onClick={() => {
                                                if (item.is_dir) {
                                                    loadDirectory(activeProject.id, item.path);
                                                } else {
                                                    handleOpenFile(item);
                                                }
                                            }}
                                            className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer select-none transition-colors ${
                                                item.name === '.env' || item.name.startsWith('.env.')
                                                    ? 'hover:bg-emerald-500/15 text-emerald-300'
                                                    : item.is_dir
                                                    ? 'hover:bg-amber-500/10 text-slate-200 hover:text-white'
                                                    : 'hover:bg-slate-800/70 text-slate-300 hover:text-white'
                                            }`}
                                            title={`${item.name} (${item.is_dir ? 'Folder' : item.size_formatted})`}
                                        >
                                            {renderFileIcon(item, "w-4 h-4")}
                                            <span className="text-xs font-mono font-medium truncate flex-1">{item.name}</span>
                                            {!item.is_dir && item.size_formatted !== '-' && (
                                                <span className="text-[10px] text-slate-500 font-mono shrink-0 hidden md:inline group-hover:text-slate-400">
                                                    {item.size_formatted}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Windows-Style List / Details View */
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs font-mono">
                                        <thead>
                                            <tr className="border-b border-slate-800 text-[11px] text-slate-500">
                                                <th className="pb-2 font-semibold">Name</th>
                                                <th className="pb-2 font-semibold">Date Modified</th>
                                                <th className="pb-2 font-semibold">Type</th>
                                                <th className="pb-2 font-semibold text-right">Size</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/40">
                                            {displayedItems.map((item) => (
                                                <tr
                                                    key={item.path}
                                                    onClick={() => {
                                                        if (item.is_dir) {
                                                            loadDirectory(activeProject.id, item.path);
                                                        } else {
                                                            handleOpenFile(item);
                                                        }
                                                    }}
                                                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                                                >
                                                    <td className="py-2 pr-4 flex items-center gap-2 text-slate-200 group-hover:text-indigo-400">
                                                        {renderFileIcon(item, "w-4 h-4")}
                                                        <span className="font-semibold truncate max-w-xs sm:max-w-md">{item.name}</span>
                                                    </td>
                                                    <td className="py-2 pr-4 text-slate-400 text-[11px]">{item.modified_at || '-'}</td>
                                                    <td className="py-2 pr-4 text-slate-500 uppercase text-[10px]">{item.is_dir ? 'Folder' : (item.extension || 'File')}</td>
                                                    <td className="py-2 text-right text-slate-400 text-[11px]">{item.size_formatted}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Explorer Footer Status Bar */}
                        <div className="px-4 py-2 bg-[#090C15] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                            <div className="flex items-center gap-3">
                                <span>{displayedItems.length} items</span>
                                <span>•</span>
                                <span>Click any file to edit & save (including .env)</span>
                            </div>
                            <span className="text-slate-400 truncate max-w-xs">{currentPath}</span>
                        </div>
                    </div>
                )}

                {/* Immediate File Loading Modal */}
                {isLoadingFileContent && !editingFile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                        <div className="bg-[#0A0E1A] border border-slate-800 rounded-2xl p-6 shadow-2xl flex items-center gap-4 text-slate-200 max-w-md w-full">
                            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin shrink-0" />
                            <div className="min-w-0 font-mono text-xs">
                                <p className="font-semibold text-white truncate">Opening {loadingFileName || 'file'}...</p>
                                <p className="text-slate-400 text-[11px] mt-0.5">Fetching remote file contents over SSH</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Redesigned In-Browser IDE Code Editor */}
                {editingFile && (
                    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isEditorFullscreen ? 'p-0' : 'p-2 sm:p-4 md:p-6'} bg-black/85 backdrop-blur-md animate-fade-in`}>
                        <div 
                            style={{
                                height: isEditorFullscreen ? '100vh' : '88vh',
                                maxHeight: isEditorFullscreen ? '100vh' : '92vh',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            className={`relative w-full ${isEditorFullscreen ? 'max-w-none rounded-none' : 'max-w-6xl rounded-2xl'} bg-[#0A0E1A] border border-slate-800 shadow-2xl overflow-hidden`}
                        >
                            {/* Editor Header Bar */}
                            <div className="px-4 py-2.5 bg-[#070A12] border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
                                {/* Tab & File Info */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex items-center gap-2 bg-[#0A0E1A] border-t-2 border-indigo-500 border-x border-slate-800/80 px-3 py-1.5 rounded-t-lg">
                                        {renderFileIcon(editingFile, "w-4 h-4")}
                                        <span className="text-xs font-mono font-bold text-white tracking-tight truncate">
                                            {editingFile.name}
                                        </span>
                                        {isDirty && (
                                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
                                        )}
                                    </div>
                                    <span className="text-[11px] text-slate-500 font-mono truncate hidden md:inline">
                                        {editingFile.path}
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Word wrap toggle */}
                                    <button
                                        type="button"
                                        onClick={() => setIsWordWrap(!isWordWrap)}
                                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1.5 ${
                                            isWordWrap
                                                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                        }`}
                                        title="Toggle Word Wrap"
                                    >
                                        <WrapText className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline text-[11px]">{isWordWrap ? 'Wrap: ON' : 'Wrap: OFF'}</span>
                                    </button>

                                    {/* Copy Content */}
                                    <button
                                        type="button"
                                        onClick={handleCopyContent}
                                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-mono transition-colors flex items-center gap-1.5"
                                        title="Copy File Content"
                                    >
                                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span className="hidden sm:inline text-[11px]">{isCopied ? 'Copied' : 'Copy'}</span>
                                    </button>

                                    {/* Fullscreen toggle */}
                                    <button
                                        type="button"
                                        onClick={() => setIsEditorFullscreen(!isEditorFullscreen)}
                                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                                        title={isEditorFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                                    >
                                        {isEditorFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                    </button>

                                    {/* Save Button */}
                                    <button
                                        type="button"
                                        disabled={isSavingFile}
                                        onClick={handleSaveFile}
                                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
                                        title="Save (Ctrl+S / Cmd+S)"
                                    >
                                        {isSavingFile ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Save className="w-3.5 h-3.5" />
                                        )}
                                        <span>Save</span>
                                        <span className="hidden sm:inline text-[10px] opacity-75 font-mono">(Ctrl+S)</span>
                                    </button>

                                    {/* Close Button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isDirty && !confirm('You have unsaved changes. Discard and close?')) {
                                                return;
                                            }
                                            setEditingFile(null);
                                            setIsDirty(false);
                                        }}
                                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                                        title="Close Editor"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Editor Core: Synchronized Line Numbers Gutter + Dark Textarea */}
                            <div 
                                style={{ flex: 1, minHeight: 0, display: 'flex' }}
                                className="relative bg-[#0A0E1A] overflow-hidden"
                            >
                                {/* Line Numbers Gutter */}
                                <div
                                    ref={editorLineNumbersRef}
                                    style={{ overflowY: 'hidden' }}
                                    className="w-12 sm:w-14 bg-[#070A12] border-r border-slate-800/80 py-4 select-none text-right pr-3 font-mono text-[13px] leading-6 text-slate-600 shrink-0"
                                >
                                    {lineNumbers.map((num) => (
                                        <div key={num} className={cursorPos.line === num ? 'text-indigo-400 font-bold' : ''}>
                                            {num}
                                        </div>
                                    ))}
                                </div>

                                {/* Editable Text Area */}
                                <textarea
                                    ref={editorTextareaRef}
                                    value={editingFile.content ?? ''}
                                    onChange={(e) => {
                                        setEditingFile({ ...editingFile, content: e.target.value });
                                        setIsDirty(true);
                                        handleEditorCursorUpdate(e);
                                    }}
                                    onKeyDown={handleEditorKeyDown}
                                    onClick={handleEditorCursorUpdate}
                                    onKeyUp={handleEditorCursorUpdate}
                                    onSelect={handleEditorCursorUpdate}
                                    onScroll={handleEditorScroll}
                                    spellCheck={false}
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    style={{
                                        backgroundColor: '#0A0E1A',
                                        color: '#E2E8F0',
                                        tabSize: 4,
                                        caretColor: '#818CF8',
                                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                        height: '100%',
                                        width: '100%',
                                        outline: 'none',
                                        border: 'none',
                                        resize: 'none'
                                    }}
                                    className={`!bg-[#0A0E1A] !text-slate-100 font-mono text-[13px] leading-6 flex-1 w-full h-full p-4 border-0 outline-none focus:ring-0 focus:outline-none selection:bg-indigo-600/50 selection:text-white ${
                                        isWordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
                                    }`}
                                    placeholder="Empty file..."
                                />
                            </div>

                            {/* Editor Footer / Status Bar */}
                            <div className="px-4 py-2 bg-[#070A12] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0 select-none">
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-300 font-semibold">
                                        Ln {cursorPos.line}, Col {cursorPos.col}
                                    </span>
                                    <span>•</span>
                                    <span>{lineNumbers.length} lines</span>
                                    <span>•</span>
                                    <span>{(editingFile.content || '').length} characters</span>
                                    {isDirty ? (
                                        <span className="text-amber-400 font-bold flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                            Unsaved
                                        </span>
                                    ) : (
                                        <span className="text-emerald-400/90 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            Saved
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 text-slate-500">
                                    <span className="hidden md:inline">{editingFile.size}</span>
                                    <span className="hidden md:inline">•</span>
                                    <span className="hidden sm:inline">UTF-8</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="hidden sm:inline">Spaces: 4</span>
                                    <span>•</span>
                                    <span className="text-emerald-400/90 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        {server.ip}
                                    </span>
                                </div>
                            </div>
                        </div>
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
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Server Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                                            placeholder="e.g. Production Node 01"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            SSH Username <span className="text-rose-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.user}
                                            onChange={(e) => setEditForm({ ...editForm, user: e.target.value })}
                                            className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                                            placeholder="root / ubuntu / deploy"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                {/* Deploy GitHub Project Modal */}
                <DeployGitHubModal
                    isOpen={createProjectOpen}
                    onClose={() => setCreateProjectOpen(false)}
                    servers={allServers && allServers.length > 0 ? [server, ...allServers.filter(s => s.id !== server.id)] : [server]}
                    initialServerId={server.id}
                    onProjectDeployed={(newProj) => {
                        setProjects(prev => [newProj, ...prev.filter(p => p.id !== newProj.id)]);
                        setActiveProject(newProj);
                        triggerAlert(`Project '${newProj.name}' deployed successfully under user ${server.user || 'server user'}.`, 'Deployment Succeeded', 'success');
                    }}
                />
            </div>
        </AuthenticatedLayout>
    );
}
