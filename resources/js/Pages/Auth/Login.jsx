import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Server, ArrowLeft, AlertCircle, Shield, CheckCircle2, GitBranch, Zap } from 'lucide-react';

export default function Login({ status, error, githubConfigured }) {
    const handleGitHubLogin = () => {
        window.location.href = route('auth.github');
    };

    const handleDevBypass = () => {
        window.location.href = route('auth.dev-bypass');
    };

    return (
        <div className="min-h-screen bg-[#0A0D14] text-slate-100 font-sans flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative selection:bg-indigo-500 selection:text-white">
            <Head title="Sign In with GitHub" />

            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[10%] left-[25%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px]" />
                <div className="absolute bottom-[20%] right-[20%] w-[450px] h-[450px] bg-cyan-600/10 rounded-full blur-[130px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Brand Logo & Title */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex flex-col items-center gap-2 group">
                        <img
                            src="/images/vpsdeploy-logo.png"
                            alt="VPSDeploy - Manage • Deploy • Scale"
                            className="w-48 max-w-[200px] h-auto rounded-2xl object-contain drop-shadow-[0_10px_25px_rgba(99,102,241,0.35)] group-hover:scale-105 transition-transform"
                        />
                    </Link>
                    <p className="mt-2 text-xs font-mono text-slate-400">
                        Secure Authentication via GitHub OAuth
                    </p>
                </div>

                {/* Card Container */}
                <div className="bg-[#0E131F] border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                    {/* Status Message */}
                    {status && (
                        <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span>{status}</span>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Configuration Reminder if not set */}
                    {githubConfigured === false && (
                        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed space-y-1">
                            <div className="font-semibold flex items-center gap-1.5 text-amber-200">
                                <AlertCircle className="w-4 h-4" />
                                <span>GitHub OAuth Configuration Needed</span>
                            </div>
                            <p className="text-[11px] text-amber-300/80">
                                Set <code className="text-amber-100 font-mono">GITHUB_CLIENT_ID</code> and <code className="text-amber-100 font-mono">GITHUB_CLIENT_SECRET</code> in your local <code className="text-amber-100 font-mono">.env</code> file to enable live authorization.
                            </p>
                        </div>
                    )}

                    {/* Primary GitHub Auth Action */}
                    <div className="space-y-4">
                        <button
                            type="button"
                            onClick={handleDevBypass}
                            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm transition-all shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2.5 group"
                        >
                            <Zap className="w-4 h-4 fill-white" />
                            <span>Quick Dev Login (Bypass HTTPS & OAuth)</span>
                        </button>

                        <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-slate-800"></div>
                            <span className="flex-shrink mx-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Or Live GitHub OAuth</span>
                            <div className="flex-grow border-t border-slate-800"></div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGitHubLogin}
                            className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm transition-all shadow-md shadow-white/5 flex items-center justify-center gap-3 group"
                        >
                            {/* GitHub SVG Icon */}
                            <svg className="w-5 h-5 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                            <span>Continue with GitHub</span>
                        </button>

                        <div className="pt-1 text-center text-xs text-slate-400 leading-relaxed">
                            No password needed. In development mode, the bypass logs you in instantly with sample developer credentials.
                        </div>
                    </div>

                    {/* Features list under card */}
                    <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Encrypted session with token isolation</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Instant access to your deployable repositories</span>
                        </div>
                    </div>
                </div>

                {/* Back Link */}
                <div className="mt-6 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Home</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
