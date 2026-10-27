import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    Server,
    Cpu,
    HardDrive,
    Database,
    Radio,
    Terminal,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Power,
    Clock,
    Wifi,
    Shield,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    Layers,
    Sliders,
    Gauge
} from 'lucide-react';

export default function ServerMetrics({ servers = [], initialServerId = null, initialMetrics = null }) {
    const [selectedServerId, setSelectedServerId] = useState(() => {
        if (initialServerId) return initialServerId;
        if (servers.length > 0) return servers[0].id;
        return null;
    });

    const [metricsData, setMetricsData] = useState(initialMetrics);
    const [isLoading, setIsLoading] = useState(!initialMetrics);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [autoRefreshInterval, setAutoRefreshInterval] = useState(10); // seconds: 5, 10, 30, 0
    const [powerToggling, setPowerToggling] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(() => initialMetrics ? new Date() : null);

    const currentServer = servers.find(s => s.id === selectedServerId) || servers[0];

    const fetchMetrics = async (showLoading = false, forceFresh = false) => {
        if (!selectedServerId) return;
        if (showLoading && !metricsData) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const url = forceFresh
                ? `/vps/servers/${selectedServerId}/metrics-data?refresh=1`
                : `/vps/servers/${selectedServerId}/metrics-data`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setMetricsData(data);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error('Failed to load metrics', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // If server selection changes
    useEffect(() => {
        if (selectedServerId && (!metricsData || metricsData.server?.id !== selectedServerId)) {
            fetchMetrics(true, false);
        }
    }, [selectedServerId]);

    // Auto-refresh interval timer
    useEffect(() => {
        if (autoRefreshInterval <= 0) return;
        const interval = setInterval(() => {
            fetchMetrics(false, false);
        }, autoRefreshInterval * 1000);
        return () => clearInterval(interval);
    }, [selectedServerId, autoRefreshInterval]);

    const handleToggleServerPower = async () => {
        if (!currentServer) return;
        setPowerToggling(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(`/vps/servers/${currentServer.id}/toggle-power`, {
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
                currentServer.is_active = data.is_active;
                currentServer.status = data.status;
                await fetchMetrics(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setPowerToggling(false);
        }
    };

    const isOffline = !currentServer || !currentServer.is_active || (metricsData && metricsData.is_offline);
    const metrics = metricsData?.metrics;

    // Helper to calculate load bar percentage (e.g. 1.0 load on 2 cores = 50%)
    const cores = metrics?.cpu?.cores || 2;
    const loadPercent = metrics?.load ? Math.min(100, Math.round((metrics.load.load_1m / cores) * 100)) : 0;

    return (
        <AuthenticatedLayout>
            <Head title="Live Server Metrics & Telemetry" />

            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
                {/* Header & Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <Activity className="w-5 h-5" />
                            </div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                                Server Metrics & Telemetry
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                            Real-time resource utilization, load averages, memory allocations, and network throughput.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Auto-refresh Segmented Control (Fully Styled) */}
                        <div className="flex items-center bg-[#080B12] border border-slate-800 rounded-xl p-1 gap-1 text-xs shadow-inner">
                            <div className="flex items-center gap-1.5 px-2 text-slate-400 font-medium text-[11px]">
                                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="hidden sm:inline">Refresh:</span>
                            </div>
                            {[
                                { label: '5s', value: 5 },
                                { label: '10s', value: 10 },
                                { label: '30s', value: 30 },
                                { label: 'Off', value: 0 },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setAutoRefreshInterval(opt.value)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                                        autoRefreshInterval === opt.value
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Manual Refresh Button */}
                        <button
                            type="button"
                            onClick={() => fetchMetrics(false, true)}
                            disabled={isRefreshing || isLoading}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh Now</span>
                        </button>

                        {/* Link to Servers list */}
                        <Link
                            href={route('servers.index')}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/25"
                        >
                            <Server className="w-3.5 h-3.5" />
                            <span>Manage Servers</span>
                        </Link>
                    </div>
                </div>

                {/* Server Selector Bar */}
                {servers.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 flex-shrink-0 mr-1">
                            <Server className="w-3.5 h-3.5 text-indigo-400" />
                            Target Server:
                        </span>
                        {servers.map((srv) => {
                            const isSelected = srv.id === selectedServerId;
                            const isOnline = srv.is_active && srv.status === 'online';
                            return (
                                <button
                                    key={srv.id}
                                    type="button"
                                    onClick={() => setSelectedServerId(srv.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 flex-shrink-0 border ${
                                        isSelected
                                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                                            : 'bg-[#0E131F] border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                                    <span className="font-mono">{srv.name || srv.ip}</span>
                                    <span className="text-[10px] opacity-75">({srv.ip})</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Offline Warning Banner */}
                {isOffline && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/50 via-slate-900 to-[#0E131F] border border-rose-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0 mt-0.5">
                                <Power className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    Server is Powered Offline
                                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono uppercase font-semibold">
                                        Offline
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    <strong>{currentServer?.name}</strong> ({currentServer?.ip}) was deliberately turned off. Real-time CPU, RAM, and disk metrics are currently suspended.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={powerToggling}
                            onClick={handleToggleServerPower}
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all flex-shrink-0 disabled:opacity-50"
                        >
                            {powerToggling ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Power className="w-4 h-4" />
                            )}
                            <span>Turn Server On</span>
                        </button>
                    </div>
                )}

                {/* Refreshing Telemetry Shimmer Indicator */}
                {isRefreshing && (
                    <div className="w-full h-1 bg-slate-800/80 overflow-hidden rounded-full -mb-3 shadow-sm">
                        <div className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 animate-page-loader" />
                    </div>
                )}

                {/* Main Metrics Content */}
                {isLoading && !metrics ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                            {[1, 2, 3, 4].map(idx => (
                                <div key={idx} className="bg-[#0E131F]/80 border border-slate-800/90 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                                        <div className="h-4 w-28 bg-slate-800 rounded-lg" />
                                        <div className="h-4 w-12 bg-slate-800/70 rounded-md" />
                                    </div>
                                    <div className="h-8 w-24 bg-slate-800 rounded-lg" />
                                    <div className="h-4 w-full bg-slate-800/60 rounded-full" />
                                    <div className="flex justify-between">
                                        <div className="h-3 w-16 bg-slate-800/50 rounded" />
                                        <div className="h-3 w-16 bg-slate-800/50 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="py-12 text-center flex flex-col items-center justify-center bg-[#0E131F]/40 border border-slate-800/60 rounded-2xl">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
                                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                            </div>
                            <h4 className="text-sm font-bold text-white">Loading Server Telemetry</h4>
                            <p className="text-xs text-slate-400 mt-1">Collecting live CPU, Memory, Disk, and Load averages...</p>
                        </div>
                    </div>
                ) : metrics ? (
                    <div className="space-y-6">
                        {/* 4 Primary Resource Metric Cards with High-Contrast Bold Progress Bars */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            
                            {/* CPU Utilization Card */}
                            <div className="bg-[#0E131F] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                            <Cpu className="w-4 h-4 text-emerald-400" />
                                            CPU Utilization
                                        </span>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                                            {metrics.cpu.cores} Cores
                                        </span>
                                    </div>
                                    <div className="mt-4 flex items-baseline justify-between">
                                        <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                                            {metrics.cpu.usage_percent}%
                                        </div>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                            metrics.cpu.usage_percent < 60
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : metrics.cpu.usage_percent < 85
                                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                        }`}>
                                            {metrics.cpu.usage_percent < 60 ? 'Optimal' : metrics.cpu.usage_percent < 85 ? 'Moderate' : 'High Load'}
                                        </span>
                                    </div>

                                    {/* Prominent High-Visibility Progress Bar with Tick Marks */}
                                    <div className="mt-4">
                                        <div className="w-full bg-[#080B12] rounded-full h-4 sm:h-4.5 overflow-hidden border border-slate-700/80 p-0.5 shadow-inner relative flex items-center">
                                            {/* Tick Marks at 25%, 50%, 75% */}
                                            <div className="absolute inset-0 flex justify-between px-3 pointer-events-none z-10">
                                                <div className="w-[1px] h-full bg-slate-700/60" />
                                                <div className="w-[1px] h-full bg-slate-700/60" />
                                                <div className="w-[1px] h-full bg-slate-700/60" />
                                            </div>

                                            {/* Colored Bar Fill */}
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 relative flex items-center justify-end pr-1 shadow-sm ${
                                                    metrics.cpu.usage_percent < 60
                                                        ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-emerald-500/50'
                                                        : metrics.cpu.usage_percent < 85
                                                        ? 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-amber-500/50'
                                                        : 'bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/50'
                                                }`}
                                                style={{
                                                    width: `${Math.max(6, metrics.cpu.usage_percent)}%`,
                                                    minWidth: '16px'
                                                }}
                                            >
                                                {/* Glowing leading indicator */}
                                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            </div>
                                        </div>

                                        {/* Scale labels */}
                                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-1">
                                            <span>0%</span>
                                            <span>25%</span>
                                            <span>50%</span>
                                            <span>75%</span>
                                            <span>100%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                                    <span>User: <strong className="text-slate-200">{metrics.cpu.breakdown.user}%</strong></span>
                                    <span>System: <strong className="text-slate-200">{metrics.cpu.breakdown.system}%</strong></span>
                                    <span>Idle: <strong className="text-emerald-400">{metrics.cpu.breakdown.idle}%</strong></span>
                                </div>
                            </div>

                            {/* RAM / Memory Utilization Card */}
                            <div className="bg-[#0E131F] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                            <Database className="w-4 h-4 text-cyan-400" />
                                            RAM / Memory
                                        </span>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                                            {metrics.memory.total_gb} GB Total
                                        </span>
                                    </div>
                                    <div className="mt-4 flex items-baseline justify-between">
                                        <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                                            {metrics.memory.usage_percent}%
                                        </div>
                                        <span className="text-xs text-slate-400 font-mono">
                                            <strong className="text-cyan-300">{metrics.memory.used_gb} GB</strong> / {metrics.memory.total_gb} GB
                                        </span>
                                    </div>

                                    {/* Prominent High-Visibility Progress Bar with Tick Marks */}
                                    <div className="mt-4">
                                        <div className="w-full bg-[#080B12] rounded-full h-4 sm:h-4.5 overflow-hidden border border-slate-700/80 p-0.5 shadow-inner relative flex items-center">
                                            <div className="absolute inset-0 flex justify-between px-3 pointer-events-none z-10">
                                                <div className="w-[1px] h-full bg-slate-700/60" />
                                                <div className="w-[1px] h-full bg-slate-700/60" />
                                                <div className="w-[1px] h-full bg-slate-700/60" />
                                            </div>

                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 shadow-sm shadow-cyan-500/50 transition-all duration-700 relative flex items-center justify-end pr-1"
                                                style={{
                                                    width: `${Math.max(6, metrics.memory.usage_percent)}%`,
                                                    minWidth: '16px'
                                                }}
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-1">
                                            <span>0 GB</span>
                                            <span>{Math.round(metrics.memory.total_gb * 0.25)} GB</span>
                                            <span>{Math.round(metrics.memory.total_gb * 0.5)} GB</span>
                                            <span>{Math.round(metrics.memory.total_gb * 0.75)} GB</span>
                                            <span>{metrics.memory.total_gb} GB</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                                    <span>Used: <strong className="text-slate-200">{metrics.memory.used_mb} MB</strong></span>
                                    <span>Free: <strong className="text-cyan-400">{metrics.memory.free_mb} MB</strong></span>
                                </div>
                            </div>

                            {/* Disk Storage (Root /) Card */}
                            <div className="bg-[#0E131F] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                            <HardDrive className="w-4 h-4 text-purple-400" />
                                            Disk Storage (/)
                                        </span>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
                                            {metrics.disk.filesystem}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex items-baseline justify-between">
                                        <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                                            {metrics.disk.usage_percent}%
                                        </div>
                                        <span className="text-xs text-slate-400 font-mono">
                                            <strong className="text-purple-300">{metrics.disk.used_gb} GB</strong> / {metrics.disk.total_gb} GB
                                        </span>
                                    </div>

                                    {/* Prominent High-Visibility Progress Bar with Tick Marks */}
                                    <div className="mt-4">
                                        <div className="w-full bg-[#080B12] rounded-full h-4 sm:h-4.5 overflow-hidden border border-slate-700/80 p-0.5 shadow-inner relative flex items-center">
                                            <div className="absolute inset-0 flex justify-between px-3 pointer-events-none z-10">
                                                <div className="w-[1px] h-full bg-slate-700/60" />
                                                <div className="w-[1px] h-full bg-slate-700/60" />
                                                <div className="w-[1px] h-full bg-slate-700/60" />
                                            </div>

                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 shadow-sm shadow-purple-500/50 transition-all duration-700 relative flex items-center justify-end pr-1"
                                                style={{
                                                    width: `${Math.max(6, metrics.disk.usage_percent)}%`,
                                                    minWidth: '16px'
                                                }}
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-1">
                                            <span>0 GB</span>
                                            <span>{Math.round(metrics.disk.total_gb * 0.25)} GB</span>
                                            <span>{Math.round(metrics.disk.total_gb * 0.5)} GB</span>
                                            <span>{Math.round(metrics.disk.total_gb * 0.75)} GB</span>
                                            <span>{metrics.disk.total_gb} GB</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                                    <span>Used: <strong className="text-slate-200">{metrics.disk.used_gb} GB</strong></span>
                                    <span>Available: <strong className="text-purple-400">{metrics.disk.free_gb} GB</strong></span>
                                </div>
                            </div>

                            {/* Load Average Card with Dedicated Meter Bar */}
                            <div className="bg-[#0E131F] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                            <Zap className="w-4 h-4 text-amber-400" />
                                            System Load
                                        </span>
                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md uppercase font-bold ${
                                            metrics.load.status === 'healthy'
                                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                        }`}>
                                            {metrics.load.status}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex items-baseline justify-between">
                                        <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                                            {metrics.load.load_1m}
                                        </div>
                                        <span className="text-xs text-slate-400 font-mono">
                                            1-min avg ({loadPercent}%)
                                        </span>
                                    </div>

                                    {/* Prominent High-Visibility Load Level Bar */}
                                    <div className="mt-4">
                                        <div className="w-full bg-[#080B12] rounded-full h-4 sm:h-4.5 overflow-hidden border border-slate-700/80 p-0.5 shadow-inner relative flex items-center">
                                            <div className="absolute inset-0 flex justify-between px-3 pointer-events-none z-10">
                                                <div className="w-[1px] h-full bg-slate-700/60" />
                                                <div className="w-[1px] h-full bg-slate-700/60" />
                                                <div className="w-[1px] h-full bg-slate-700/60" />
                                            </div>

                                            <div
                                                className={`h-full rounded-full transition-all duration-700 relative flex items-center justify-end pr-1 shadow-sm ${
                                                    loadPercent < 50
                                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-emerald-500/50'
                                                        : loadPercent < 80
                                                        ? 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-amber-500/50'
                                                        : 'bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/50'
                                                }`}
                                                style={{
                                                    width: `${Math.max(6, loadPercent)}%`,
                                                    minWidth: '16px'
                                                }}
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 px-1">
                                            <span>0.0</span>
                                            <span>{Number(cores * 0.25).toFixed(1)}</span>
                                            <span>{Number(cores * 0.5).toFixed(1)}</span>
                                            <span>{Number(cores * 0.75).toFixed(1)}</span>
                                            <span>{cores}.0</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
                                    <div className="bg-[#080B12] p-1.5 rounded-lg border border-slate-800">
                                        <div className="text-slate-400 text-[9px]">1 min</div>
                                        <div className="text-white font-bold">{metrics.load.load_1m}</div>
                                    </div>
                                    <div className="bg-[#080B12] p-1.5 rounded-lg border border-slate-800">
                                        <div className="text-slate-400 text-[9px]">5 min</div>
                                        <div className="text-white font-bold">{metrics.load.load_5m}</div>
                                    </div>
                                    <div className="bg-[#080B12] p-1.5 rounded-lg border border-slate-800">
                                        <div className="text-slate-400 text-[9px]">15 min</div>
                                        <div className="text-white font-bold">{metrics.load.load_15m}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mid-Row: Network Traffic & System Specs */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Network & Latency Card */}
                            <div className="bg-[#0E131F] border border-slate-800 rounded-2xl p-5 shadow-xl">
                                <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
                                    <div className="flex items-center gap-2">
                                        <Wifi className="w-4 h-4 text-emerald-400" />
                                        <h3 className="text-sm font-bold text-white">Network & Latency</h3>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                        <span>Ping: {metrics.latency_ms}ms</span>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                                            <span>Incoming (RX) Rate</span>
                                        </div>
                                        <div className="text-xl font-bold text-white font-mono">{metrics.network.rx_sec}</div>
                                        <div className="text-[10px] text-slate-400">Total In: {metrics.network.total_in}</div>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <ArrowUpRight className="w-4 h-4 text-cyan-400" />
                                            <span>Outgoing (TX) Rate</span>
                                        </div>
                                        <div className="text-xl font-bold text-white font-mono">{metrics.network.tx_sec}</div>
                                        <div className="text-[10px] text-slate-400">Total Out: {metrics.network.total_out}</div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 font-mono flex items-center justify-between">
                                    <span>Host Node: <strong className="text-slate-200">{metrics.system.ip}:{metrics.system.port}</strong></span>
                                    <span>Last Poll: <strong className="text-slate-300">{lastUpdated ? lastUpdated.toLocaleTimeString() : 'Just now'}</strong></span>
                                </div>
                            </div>

                            {/* System Overview Card */}
                            <div className="bg-[#0E131F] border border-slate-800 rounded-2xl p-5 shadow-xl">
                                <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="w-4 h-4 text-indigo-400" />
                                        <h3 className="text-sm font-bold text-white">System Specification</h3>
                                    </div>
                                    <span className="text-xs font-mono text-slate-400">
                                        Uptime: <strong className="text-emerald-400">{metrics.system.uptime}</strong>
                                    </span>
                                </div>

                                <div className="mt-4 space-y-2.5 text-xs font-mono">
                                    <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                                        <span className="text-slate-400">Hostname:</span>
                                        <span className="text-white font-bold">{metrics.system.hostname}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                                        <span className="text-slate-400">Distribution:</span>
                                        <span className="text-slate-200">{metrics.system.os}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                                        <span className="text-slate-400">Linux Kernel:</span>
                                        <span className="text-slate-300">{metrics.system.kernel}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-slate-400">Processor:</span>
                                        <span className="text-slate-300 truncate max-w-[260px]" title={metrics.cpu.model}>
                                            {metrics.cpu.model}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Core Server Services Status */}
                        <div className="bg-[#0E131F] border border-slate-800 rounded-2xl p-5 shadow-xl">
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-indigo-400" />
                                    <h3 className="text-sm font-bold text-white">Active System Daemons & Services</h3>
                                </div>
                                <span className="text-xs text-slate-400">
                                    Auto-verified via SSH
                                </span>
                            </div>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {metrics.services.map((svc, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                                    >
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-white truncate">{svc.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Port: {svc.port}</div>
                                        </div>
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono font-semibold flex-shrink-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            ACTIVE
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </AuthenticatedLayout>
    );
}
