import React, { useState, useEffect } from 'react';
import { Sliders, Terminal, Cpu, Clock, FolderGit2, CheckCircle2, RotateCcw } from 'lucide-react';

export default function DeploymentPreferencesForm({ className = '' }) {
    const [preferences, setPreferences] = useState(() => {
        try {
            const saved = localStorage.getItem('vps_user_preferences');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {
            defaultSshPort: 22,
            defaultDeployUser: 'root',
            telemetryInterval: 10,
            defaultDeployDir: '/var/www',
            defaultBranch: 'main',
            terminalTheme: 'cyber',
        };
    });

    const [savedNotice, setSavedNotice] = useState(false);

    const updateField = (key, value) => {
        const next = { ...preferences, [key]: value };
        setPreferences(next);
        try {
            localStorage.setItem('vps_user_preferences', JSON.stringify(next));
            window.dispatchEvent(new Event('vps_preferences_changed'));
        } catch (e) {}
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2500);
    };

    const resetDefaults = () => {
        const defaults = {
            defaultSshPort: 22,
            defaultDeployUser: 'root',
            telemetryInterval: 10,
            defaultDeployDir: '/var/www',
            defaultBranch: 'main',
            terminalTheme: 'cyber',
        };
        setPreferences(defaults);
        try {
            localStorage.setItem('vps_user_preferences', JSON.stringify(defaults));
            window.dispatchEvent(new Event('vps_preferences_changed'));
        } catch (e) {}
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2500);
    };

    return (
        <section className={`bg-[#0E131F] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl ${className}`}>
            <header className="border-b border-slate-800/80 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
                        <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            Deployment & VPS Environment Preferences
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Configure standard defaults for new server connections, SSH profiles, and real-time telemetry.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={resetDefaults}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                </button>
            </header>

            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Default SSH Port */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Default SSH Port</span>
                        </label>
                        <input
                            type="number"
                            value={preferences.defaultSshPort}
                            onChange={(e) => updateField('defaultSshPort', parseInt(e.target.value) || 22)}
                            className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors font-mono"
                            placeholder="22"
                        />
                        <p className="mt-1 text-[11px] text-slate-500">
                            Pre-fills server connection port.
                        </p>
                    </div>

                    {/* Default Remote User */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Default SSH User</span>
                        </label>
                        <select
                            value={preferences.defaultDeployUser}
                            onChange={(e) => updateField('defaultDeployUser', e.target.value)}
                            className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                        >
                            <option value="root">root (Standard)</option>
                            <option value="ubuntu">ubuntu (AWS/GCP)</option>
                            <option value="debian">debian (Debian Cloud)</option>
                            <option value="deploy">deploy (Dedicated user)</option>
                            <option value="admin">admin</option>
                        </select>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Default username for terminal sessions.
                        </p>
                    </div>

                    {/* Telemetry Refresh Rate */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Metrics Telemetry Interval</span>
                        </label>
                        <select
                            value={preferences.telemetryInterval}
                            onChange={(e) => updateField('telemetryInterval', parseInt(e.target.value))}
                            className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                        >
                            <option value="5">Every 5 Seconds (Real-time)</option>
                            <option value="10">Every 10 Seconds (Recommended)</option>
                            <option value="30">Every 30 Seconds (Eco mode)</option>
                            <option value="60">Every 60 Seconds</option>
                            <option value="0">Manual Refresh Only</option>
                        </select>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Auto-sync rate for CPU, RAM and disk.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2 border-t border-slate-800/80">
                    {/* Default Deploy Directory */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <FolderGit2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Default Web Root Path</span>
                        </label>
                        <input
                            type="text"
                            value={preferences.defaultDeployDir}
                            onChange={(e) => updateField('defaultDeployDir', e.target.value)}
                            className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors font-mono"
                            placeholder="/var/www"
                        />
                        <p className="mt-1 text-[11px] text-slate-500">
                            Default target directory on connected servers.
                        </p>
                    </div>

                    {/* Default Git Branch */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Default Target Branch
                        </label>
                        <input
                            type="text"
                            value={preferences.defaultBranch}
                            onChange={(e) => updateField('defaultBranch', e.target.value)}
                            className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors font-mono"
                            placeholder="main"
                        />
                        <p className="mt-1 text-[11px] text-slate-500">
                            Pre-selected branch for new repository clones.
                        </p>
                    </div>

                    {/* Terminal Theme */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Terminal Color Theme
                        </label>
                        <select
                            value={preferences.terminalTheme}
                            onChange={(e) => updateField('terminalTheme', e.target.value)}
                            className="w-full bg-[#080B12] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                        >
                            <option value="cyber">Cyber Obsidian (Default)</option>
                            <option value="matrix">Matrix Emerald</option>
                            <option value="dracula">Dracula Indigo</option>
                            <option value="monokai">Monokai Amber</option>
                        </select>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Log and deploy terminal aesthetic.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                        {savedNotice && (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg animate-fade-in">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Preferences saved locally
                            </span>
                        )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                        Preferences auto-apply across your dashboard session.
                    </span>
                </div>
            </div>
        </section>
    );
}
