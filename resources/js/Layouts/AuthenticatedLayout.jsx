import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    Server,
    Activity,
    Layers,
    Terminal,
    FolderTree,
    Shield,
    Radio,
    LogOut,
    Menu,
    X,
    ExternalLink,
    Cpu,
    GitBranch,
    Sliders,
    Globe,
    Home,
    Loader2,
    User,
    Settings
} from 'lucide-react';

export default function AuthenticatedLayout({ children }) {
    const user = usePage().props.auth.user;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [connectedServer, setConnectedServer] = useState(() => {
        try {
            const saved = localStorage.getItem('vps_connected_server');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    useEffect(() => {
        const unregisterStart = router.on('start', () => setIsPageLoading(true));
        const unregisterFinish = router.on('finish', () => setIsPageLoading(false));
        const unregisterCancel = router.on('cancel', () => setIsPageLoading(false));
        const unregisterError = router.on('error', () => setIsPageLoading(false));

        return () => {
            unregisterStart();
            unregisterFinish();
            unregisterCancel();
            unregisterError();
        };
    }, []);

    useEffect(() => {
        const handleStorage = () => {
            try {
                const saved = localStorage.getItem('vps_connected_server');
                setConnectedServer(saved ? JSON.parse(saved) : null);
            } catch (e) {}
        };
        window.addEventListener('storage', handleStorage);
        // Also poll briefly or listen to custom event if within same window
        const interval = setInterval(handleStorage, 2000);
        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(interval);
        };
    }, []);

    const navItems = [
        { label: 'VPS Dashboard', href: route('dashboard'), icon: Layers, active: route().current('dashboard') },
        { label: 'Servers & VPS', href: route('servers.index'), icon: Server, active: route().current('servers.index') },
        { label: 'Server Metrics', href: route('servers.metrics'), icon: Activity, active: route().current('servers.metrics') },
        { label: 'Profile & Settings', href: route('profile.edit'), icon: User, active: route().current('profile.edit') },
        { label: 'Workflow Guide', href: '/#pipeline', icon: Sliders, active: false },
    ];

    const sidebarContent = (
        <div className="flex flex-col h-full bg-[#0E131F] text-slate-200 border-l md:border-l-0 md:border-r border-slate-800/80">
            {/* Top Logo & Close Button */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                        <div className="w-full h-full bg-[#090C15] rounded-[11px] flex items-center justify-center">
                            <Server className="w-5 h-5 text-indigo-400" />
                        </div>
                    </div>
                    <span className="font-heading font-extrabold text-base tracking-tight text-white">
                        VPS<span className="text-indigo-400">Deploy</span>
                    </span>
                </Link>

                {/* Mobile Close Button (on the right drawer) */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="md:hidden p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                    aria-label="Close menu"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Target Server Node Telemetry Pill (Dynamic Real Data) */}
            <div className="p-4 border-b border-slate-800/80">
                <div className="p-3 rounded-xl bg-[#080B12] border border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">Target Node</span>
                        {connectedServer ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                Live
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                Offline
                            </span>
                        )}
                    </div>
                    {connectedServer ? (
                        <>
                            <div className="font-mono text-xs font-bold text-white mt-1 truncate">
                                {connectedServer.ip}:{connectedServer.port}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                                {connectedServer.user} • {connectedServer.os || 'Connected'}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="font-mono text-xs font-medium text-slate-400 mt-1">
                                No Node Connected
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                                Connect server to manage
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Navigation
                </div>

                {navItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={idx}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                                item.active
                                    ? 'bg-indigo-600/20 border border-indigo-500/40 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className={`w-4 h-4 ${item.active ? 'text-indigo-400' : 'text-slate-400'}`} />
                                <span>{item.label}</span>
                            </div>
                        </Link>
                    );
                })}

                <Link
                    href="/"
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                    <Home className="w-4 h-4 text-indigo-400" />
                    <span>Home Page</span>
                </Link>
            </nav>

            {/* User Profile & Logout at Bottom */}
            <div className="p-4 border-t border-slate-800/80 bg-[#0A0D14]/70">
                <Link
                    href={route('profile.edit')}
                    className="flex items-center gap-3 p-1.5 -m-1.5 rounded-xl hover:bg-slate-800/60 transition-all group"
                    title="Account Settings"
                >
                    <div className="relative">
                        <img
                            src={user.avatar || 'https://avatars.githubusercontent.com/u/9919?v=4'}
                            alt={user.name}
                            className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 object-cover group-hover:border-indigo-500 transition-colors"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0A0D14]" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors truncate flex items-center justify-between">
                            <span>{user.name}</span>
                            <Settings className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">
                            {user.github_username ? `@${user.github_username}` : user.email}
                        </div>
                    </div>
                </Link>

                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/40 text-slate-300 hover:text-rose-400 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0A0D14] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
            {/* Simple Top Navigation Loader Bar */}
            {isPageLoading && (
                <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
                    <div className="h-1 w-full bg-slate-900/60 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-600 animate-page-loader shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
                    </div>
                    {/* Floating Subtle Top-Right Indicator */}
                    <div className="absolute top-2.5 right-4 pointer-events-auto">
                        <div className="bg-[#0E131F]/95 backdrop-blur-md border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 shadow-xl shadow-indigo-950/50 text-[11px] font-medium text-slate-200">
                            <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                            <span>Loading...</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Fixed Left Sidebar */}
            <aside className="hidden md:flex fixed top-0 bottom-0 left-0 w-64 z-30">
                {sidebarContent}
            </aside>

            {/* Mobile Top Bar (No generic header, just brand & right-drawer trigger) */}
            <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-16 bg-[#0E131F] border-b border-slate-800">
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 p-[1px]">
                        <div className="w-full h-full bg-[#0E131F] rounded-[7px] flex items-center justify-center">
                            <Server className="w-4 h-4 text-indigo-400" />
                        </div>
                    </div>
                    <span className="font-heading font-extrabold text-sm text-white">
                        VPS<span className="text-indigo-400">Deploy</span>
                    </span>
                </Link>

                {/* Right Drawer Trigger Button on Mobile */}
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                    aria-label="Open navigation menu from right"
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            {/* Mobile Drawer (Slides in strictly from the RIGHT) */}
            <div
                className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
                    mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
            >
                {/* Backdrop Overlay */}
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />

                {/* Drawer Panel: Anchored to RIGHT (right-0, translating from translate-x-full to translate-x-0) */}
                <div
                    className={`fixed top-0 bottom-0 right-0 w-72 max-w-[85vw] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
                        mobileOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                >
                    {sidebarContent}
                </div>
            </div>

            {/* Main Content Area: Offset by left sidebar on desktop, full width on mobile */}
            <main className="md:pl-64 min-h-screen">
                {children}
            </main>
        </div>
    );
}
