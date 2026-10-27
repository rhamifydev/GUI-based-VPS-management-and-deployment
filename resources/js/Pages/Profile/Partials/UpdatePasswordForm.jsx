import React, { useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { KeyRound, ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle, Info } from 'lucide-react';

export default function UpdatePasswordForm({ hasPassword = true, className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    // Calculate basic password strength
    const getStrength = (pwd) => {
        if (!pwd) return 0;
        let score = 0;
        if (pwd.length >= 8) score += 25;
        if (pwd.length >= 12) score += 25;
        if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 25;
        if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score += 25;
        return score;
    };

    const strength = getStrength(data.password);
    const strengthColor =
        strength <= 25 ? 'bg-rose-500' :
        strength <= 50 ? 'bg-amber-500' :
        strength <= 75 ? 'bg-cyan-500' : 'bg-emerald-500';

    const strengthLabel =
        strength <= 25 ? 'Weak' :
        strength <= 50 ? 'Fair' :
        strength <= 75 ? 'Good' : 'Strong';

    return (
        <section className={`bg-[#0E131F] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl ${className}`}>
            <header className="border-b border-slate-800/80 pb-5 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            {hasPassword ? 'Change Password' : 'Set Master Password'}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {hasPassword
                                ? 'Ensure your deployment account is protected with a long, robust password.'
                                : 'Enable direct credential authentication alongside your GitHub OAuth sign-in.'}
                        </p>
                    </div>
                </div>
            </header>

            {!hasPassword && (
                <div className="mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-3">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-semibold text-white">Direct Login Not Set:</span> You originally authenticated through GitHub. You can set a password below to sign in using your email address and password at any time.
                    </div>
                </div>
            )}

            <form onSubmit={updatePassword} className="space-y-6">
                {hasPassword && (
                    <div>
                        <label
                            htmlFor="current_password"
                            className="block text-xs font-semibold text-slate-300 mb-1.5"
                        >
                            Current Password <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                id="current_password"
                                ref={currentPasswordInput}
                                value={data.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                                type={showCurrent ? 'text' : 'password'}
                                className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                                autoComplete="current-password"
                                placeholder="••••••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                            >
                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.current_password && (
                            <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{errors.current_password}</span>
                            </p>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-xs font-semibold text-slate-300 mb-1.5"
                        >
                            New Password <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                id="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                type={showNew ? 'text' : 'password'}
                                className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                                autoComplete="new-password"
                                placeholder="••••••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                            >
                                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{errors.password}</span>
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="password_confirmation"
                            className="block text-xs font-semibold text-slate-300 mb-1.5"
                        >
                            Confirm New Password <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                id="password_confirmation"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                type={showConfirm ? 'text' : 'password'}
                                className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                                autoComplete="new-password"
                                placeholder="••••••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                            >
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.password_confirmation && (
                            <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{errors.password_confirmation}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Password Strength Meter */}
                {data.password && (
                    <div className="p-3.5 rounded-xl bg-[#090C15] border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Password Strength:</span>
                            <span className="font-semibold text-slate-200">{strengthLabel}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${strengthColor}`}
                                style={{ width: `${Math.max(10, strength)}%` }}
                            />
                        </div>
                        <div className="text-[10px] text-slate-500">
                            Recommended: 8+ characters, combining letters, numbers & symbols.
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                        {recentlySuccessful && (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg animate-fade-in">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Password updated successfully
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                        {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Update Password</span>
                    </button>
                </div>
            </form>
        </section>
    );
}
