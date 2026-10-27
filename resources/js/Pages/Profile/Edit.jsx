import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    User,
    KeyRound,
    Sliders,
    Key,
    AlertTriangle,
    Server,
    Layers,
    CheckCircle2,
    Calendar,
    Shield,
    ExternalLink,
    Sparkles,
    GitBranch
} from 'lucide-react';

const GitHubIcon = ({ className = 'w-3.5 h-3.5' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
);
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import DeploymentPreferencesForm from './Partials/DeploymentPreferencesForm';
import ApiTokensCard from './Partials/ApiTokensCard';
import DeleteUserForm from './Partials/DeleteUserForm';

export default function Edit({
    mustVerifyEmail,
    status,
    serverCount = 0,
    projectCount = 0,
    hasPassword = true
}) {
    const user = usePage().props.auth.user;
    const [activeTab, setActiveTab] = useState('profile');

    const formattedDate = user.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
          })
        : 'Recently';

    const tabs = [
        { id: 'profile', label: 'Profile Information', icon: User },
        { id: 'security', label: 'Security & Password', icon: KeyRound },
        { id: 'preferences', label: 'VPS Preferences', icon: Sliders },
        { id: 'api', label: 'API & Deploy Webhook', icon: Key },
        { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Profile & Settings" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                {/* Status Flash Banner */}
                {status && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-300 text-xs shadow-lg shadow-emerald-950/30 animate-fade-in">
                        <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>
                                {status === 'profile-updated' && 'Your profile details have been updated successfully.'}
                                {status === 'password-updated' && 'Your account password was updated successfully.'}
                                {status !== 'profile-updated' && status !== 'password-updated' && status}
                            </span>
                        </div>
                    </div>
                )}

                {/* Hero Header & User Identity Card */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0E131F] via-[#101728] to-[#0A0D14] border border-slate-800/90 p-6 sm:p-8 shadow-2xl">
                    {/* Ambient glow backgrounds */}
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-start sm:items-center gap-5">
                            <div className="relative shrink-0">
                                <img
                                    src={user.avatar || 'https://avatars.githubusercontent.com/u/9919?v=4'}
                                    alt={user.name}
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-800 border-2 border-indigo-500/40 object-cover shadow-xl shadow-indigo-950/60"
                                    onError={(e) => {
                                        e.target.src = 'https://avatars.githubusercontent.com/u/9919?v=4';
                                    }}
                                />
                                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0E131F] shadow-sm" />
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                                        {user.name}
                                    </h1>
                                    {user.github_username && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                                            <GitHubIcon className="w-3 h-3 text-indigo-400" />
                                            @{user.github_username}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-400 mt-1.5 font-sans">
                                    <span className="font-mono text-slate-300">{user.email}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1.5 text-slate-400">
                                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                        Joined {formattedDate}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                                        <Shield className="w-3 h-3 text-emerald-400" />
                                        {user.github_id ? 'GitHub Authenticated' : 'Standard Password'}
                                    </span>
                                    {user.email_verified_at ? (
                                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Verified Email
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] font-medium text-amber-300">
                                            Unverified
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Metrics Badges */}
                        <div className="flex sm:flex-row md:flex-col gap-3 shrink-0">
                            <Link
                                href={route('servers.index')}
                                className="flex-1 md:flex-initial flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-[#090C15]/90 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/40 transition-all group"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                                        <Server className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                                            Connected VPS
                                        </div>
                                        <div className="text-xs font-bold text-white font-mono">
                                            {serverCount} {serverCount === 1 ? 'Node' : 'Nodes'}
                                        </div>
                                    </div>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                            </Link>

                            <Link
                                href={route('dashboard')}
                                className="flex-1 md:flex-initial flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-[#090C15]/90 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/40 transition-all group"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                                        <Layers className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                                            Active Projects
                                        </div>
                                        <div className="text-xs font-bold text-white font-mono">
                                            {projectCount} {projectCount === 1 ? 'Deploy' : 'Deploys'}
                                        </div>
                                    </div>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation Controls */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                                    isActive
                                        ? tab.id === 'danger'
                                            ? 'bg-rose-950/60 border border-rose-800/80 text-rose-300 shadow-lg shadow-rose-950/40'
                                            : 'bg-indigo-600/25 border border-indigo-500/50 text-white shadow-lg shadow-indigo-950/40'
                                        : 'bg-[#0E131F] border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/60'
                                }`}
                            >
                                <Icon className={`w-3.5 h-3.5 ${
                                    isActive
                                        ? tab.id === 'danger' ? 'text-rose-400' : 'text-indigo-400'
                                        : 'text-slate-500'
                                }`} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}

                    <button
                        onClick={() => setActiveTab('all')}
                        className={`ml-auto px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                            activeTab === 'all'
                                ? 'bg-slate-800 text-white border border-slate-700'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        View All
                    </button>
                </div>

                {/* Tab Content Panels */}
                <div className="space-y-6">
                    {(activeTab === 'profile' || activeTab === 'all') && (
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />
                    )}

                    {(activeTab === 'security' || activeTab === 'all') && (
                        <UpdatePasswordForm hasPassword={hasPassword} />
                    )}

                    {(activeTab === 'preferences' || activeTab === 'all') && (
                        <DeploymentPreferencesForm />
                    )}

                    {(activeTab === 'api' || activeTab === 'all') && (
                        <ApiTokensCard />
                    )}

                    {(activeTab === 'danger' || activeTab === 'all') && (
                        <DeleteUserForm hasPassword={hasPassword} />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
