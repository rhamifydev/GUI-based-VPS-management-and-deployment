import React, { useState } from 'react';
import { useForm, usePage, Link } from '@inertiajs/react';
import { User, Mail, AtSign, Image as ImageIcon, CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name || '',
            github_username: user.github_username || '',
            email: user.email || '',
            avatar: user.avatar || '',
        });

    const [avatarPreview, setAvatarPreview] = useState(user.avatar || '');

    const handleAvatarChange = (val) => {
        setData('avatar', val);
        setAvatarPreview(val);
    };

    const resetToGitHubAvatar = () => {
        const gh = data.github_username || user.github_username;
        if (gh) {
            const ghAvatar = `https://github.com/${gh}.png`;
            handleAvatarChange(ghAvatar);
        } else {
            handleAvatarChange('https://avatars.githubusercontent.com/u/9919?v=4');
        }
    };

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    return (
        <section className={`bg-[#0E131F] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl ${className}`}>
            <header className="border-b border-slate-800/80 pb-5 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            Profile Information
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Update your public display name, handle username, avatar, and contact email.
                        </p>
                    </div>
                </div>
            </header>

            <form onSubmit={submit} className="space-y-6">
                {/* Avatar Preview & Quick Customizer */}
                <div className="p-4 rounded-xl bg-[#090C15] border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative group">
                        <img
                            src={avatarPreview || 'https://avatars.githubusercontent.com/u/9919?v=4'}
                            alt={data.name}
                            className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-indigo-500/40 object-cover shadow-lg shadow-indigo-950/40"
                            onError={(e) => {
                                e.target.src = 'https://avatars.githubusercontent.com/u/9919?v=4';
                            }}
                        />
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#090C15]" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <div className="text-xs font-semibold text-slate-200">
                            Profile Picture
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Enter any image URL or sync directly with your GitHub avatar.
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-2 justify-center sm:justify-start">
                            <button
                                type="button"
                                onClick={resetToGitHubAvatar}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Sync GitHub Avatar</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Display Name */}
                    <div>
                        <label htmlFor="name" className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Full / Display Name <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                <User className="w-4 h-4" />
                            </div>
                            <input
                                id="name"
                                type="text"
                                className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. John Doe"
                                required
                            />
                        </div>
                        {errors.name && (
                            <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{errors.name}</span>
                            </p>
                        )}
                    </div>

                    {/* Username */}
                    <div>
                        <label htmlFor="github_username" className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Username / Handle
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                <AtSign className="w-4 h-4" />
                            </div>
                            <input
                                id="github_username"
                                type="text"
                                className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                value={data.github_username}
                                onChange={(e) => setData('github_username', e.target.value)}
                                placeholder="e.g. dev_commander"
                            />
                        </div>
                        {errors.github_username && (
                            <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{errors.github_username}</span>
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Email Address <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                <Mail className="w-4 h-4" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="developer@example.com"
                                required
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{errors.email}</span>
                            </p>
                        )}
                    </div>

                    {/* Avatar URL */}
                    <div>
                        <label htmlFor="avatar" className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Custom Avatar URL
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                <ImageIcon className="w-4 h-4" />
                            </div>
                            <input
                                id="avatar"
                                type="url"
                                className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                value={data.avatar}
                                onChange={(e) => handleAvatarChange(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                        {errors.avatar && (
                            <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{errors.avatar}</span>
                            </p>
                        )}
                    </div>
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                        <span>Your email address is unverified.</span>
                        <Link
                            href={route('verification.send')}
                            method="post"
                            as="button"
                            className="text-xs font-semibold underline hover:text-white"
                        >
                            Resend verification link
                        </Link>
                    </div>
                )}

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                        {recentlySuccessful && (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg animate-fade-in">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Profile updated successfully
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                        {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Save Profile</span>
                    </button>
                </div>
            </form>
        </section>
    );
}
