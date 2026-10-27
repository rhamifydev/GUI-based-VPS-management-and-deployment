import React, { useState } from 'react';
import { Key, Copy, Check, RefreshCw, Terminal, Shield, ExternalLink } from 'lucide-react';

export default function ApiTokensCard({ className = '' }) {
    const [token, setToken] = useState(() => {
        try {
            const saved = localStorage.getItem('vps_deploy_token');
            if (saved) return saved;
        } catch (e) {}
        const gen = 'vps_live_' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
        try {
            localStorage.setItem('vps_deploy_token', gen);
        } catch (e) {}
        return gen;
    });

    const [copiedToken, setCopiedToken] = useState(false);
    const [copiedCurl, setCopiedCurl] = useState(false);

    const copyToClipboard = (text, setCopiedState) => {
        navigator.clipboard.writeText(text);
        setCopiedState(true);
        setTimeout(() => setCopiedState(false), 2000);
    };

    const regenerateToken = () => {
        if (!confirm('Are you sure you want to regenerate your deployment token? Any CI/CD workflows using the old token will need to be updated.')) {
            return;
        }
        const gen = 'vps_live_' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
        setToken(gen);
        try {
            localStorage.setItem('vps_deploy_token', gen);
        } catch (e) {}
    };

    const curlExample = `curl -X POST "${window.location.origin}/vps/deploy" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"project_id": 1, "trigger": "github-actions"}'`;

    return (
        <section className={`bg-[#0E131F] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl ${className}`}>
            <header className="border-b border-slate-800/80 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Key className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            Personal Deployment Webhook & API Key
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Trigger automated deployments to your connected VPS nodes from GitHub Actions, GitLab CI, or terminal scripts.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={regenerateToken}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate Token</span>
                </button>
            </header>

            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Active Secret Deploy Token
                    </label>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <input
                                type="password"
                                readOnly
                                value={token}
                                className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono select-all focus:outline-none"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => copyToClipboard(token, setCopiedToken)}
                            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
                        >
                            {copiedToken ? (
                                <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-emerald-400">Copied</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Token</span>
                                </>
                            )}
                        </button>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Keep this token secret. It authenticates direct webhook triggers to your VPS pipeline.</span>
                    </p>
                </div>

                {/* Example Webhook curl snippet */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                            <span>CI/CD Automation Webhook Snippet</span>
                        </label>
                        <button
                            type="button"
                            onClick={() => copyToClipboard(curlExample, setCopiedCurl)}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
                        >
                            {copiedCurl ? (
                                <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied cURL</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy cURL</span>
                                </>
                            )}
                        </button>
                    </div>
                    <div className="bg-[#080B12] border border-slate-800 rounded-xl p-3.5 font-mono text-[11px] text-slate-300 overflow-x-auto">
                        <pre>{curlExample}</pre>
                    </div>
                </div>
            </div>
        </section>
    );
}
