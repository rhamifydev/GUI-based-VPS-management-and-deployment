import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
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
    Home
} from 'lucide-react';

export default function AuthenticatedLayout({ children }) {
    const user = usePage().props.auth.user;
    const [mobileOpen, setMobileOpen] = useState(false);

    const navItems = [
        { label: 'VPS Dashboard', href: route('dashboard'), icon: Server, active: true },
        { label: '10-Step Workflow', href: '/#pipeline', icon: Sliders, active: false },
        { label: 'File Manager', href: '#', icon: FolderTree, active: false, badge: 'Soon' },
        { label: 'Command Terminal', href: '#', icon: Terminal, active: false, badge: 'Soon' },
        { label: 'Daemons & Workers', href: '#', icon: Radio, active: false },
        { label: 'Security & SSL', href: '#', icon: Shield, active: false },
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

            {/* Target Server Node Telemetry Pill */}
            <div className="p-4 border-b border-slate-800/80">
                <div className="p-3 rounded-xl bg-[#080B12] border border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">Target Node</span>
                        <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            Live
                        </span>
                    </div>
                    <div className="font-mono text-xs font-bold text-white mt-1">
                        147.93.85.120
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                        Ubuntu 24.04 LTS (SSH 22)
                    </div>
                </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Management
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
                            {item.badge && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}

                <div className="pt-4 px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    External
                </div>

                <a
                    href="http://new.rhamify.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-cyan-400" />
                        <span>Live Site</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

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
                <div className="flex items-center gap-3">
                    <img
                        src={user.avatar || 'https://avatars.githubusercontent.com/u/9919?v=4'}
                        alt={user.name}
                        className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                    <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">
                            {user.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">
                            {user.github_username ? `@${user.github_username}` : user.email}
                        </div>
                    </div>
                </div>

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
