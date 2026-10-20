import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Server,
    Key,
    Terminal,
    GitBranch,
    FolderTree,
    Shield,
    Cpu,
    Globe,
    Zap,
    Play,
    CheckCircle2,
    Copy,
    Check,
    RefreshCw,
    Sliders,
    Lock,
    ExternalLink,
    Code,
    Sparkles,
    ChevronRight,
    AlertCircle,
    Activity,
    Layers,
    ArrowRight,
    HardDrive,
    Database,
    Radio,
    FileText,
    Settings,
    Eye,
    EyeOff
} from 'lucide-react';

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    // Active step in the interactive 10-step studio
    const [activeStep, setActiveStep] = useState(1);
    const [copiedKey, setCopiedKey] = useState(false);
    const [simulatedLogs, setSimulatedLogs] = useState([]);
    const [isSimulating, setIsSimulating] = useState(false);

    // Form states for the interactive studio
    const [serverIp, setServerIp] = useState('147.93.85.120');
    const [sshUser, setSshUser] = useState('rhamifytechnology');
    const [repoUrl, setRepoUrl] = useState('git@github-rhamify-app:rhamifytech/vps-deployment-app.git');
    const [domain, setDomain] = useState('new.rhamify.com');
    const [phpVer, setPhpVer] = useState('8.4');
    const [reverbPort, setReverbPort] = useState('8082');

    const steps = [
        {
            id: 1,
            title: 'SSH Deploy Key',
            badge: 'Identity',
            icon: Key,
            description: 'Generate dedicated ed25519 keypair for automated GitHub repository cloning.'
        },
        {
            id: 2,
            title: 'SSH Host Alias',
            badge: 'Config',
            icon: Sliders,
            description: 'Map github-rhamify-app to IdentityFile with strict 600 permissions.'
        },
        {
            id: 3,
            title: 'Clone Repository',
            badge: 'Git',
            icon: GitBranch,
            description: 'Test remote handshake and checkout production branch without prompt locks.'
        },
        {
            id: 4,
            title: 'Environment & Build',
            badge: 'App Setup',
            icon: Database,
            description: '.env configuration, composer optimize, key generation, migrations, and npm build.'
        },
        {
            id: 5,
            title: 'Permissions & ACL',
            badge: 'Security',
            icon: Shield,
            description: 'Assign setfacl permissions for Nginx user and 775 access to storage/cache.'
        },
        {
            id: 6,
            title: 'PHP-FPM Pool',
            badge: 'Engine',
            icon: Cpu,
            description: 'Dedicated PHP 8.4 socket pool, process limits, and zero-downtime service reload.'
        },
        {
            id: 7,
            title: 'Nginx & SSL',
            badge: 'Web Server',
            icon: Globe,
            description: 'FastCGI buffers, security location rules, and 1-click Certbot Let\'s Encrypt SSL.'
        },
        {
            id: 8,
            title: 'Supervisor & Reverb',
            badge: 'Daemons',
            icon: Radio,
            description: 'Continuous queue worker daemon and Laravel Reverb WebSockets process supervision.'
        },
        {
            id: 9,
            title: 'Auto-Deploy Script',
            badge: 'Automation',
            icon: Terminal,
            description: 'Zero-downtime deploy.sh with maintenance mode trap and worker reload.'
        },
        {
            id: 10,
            title: 'GitHub Actions CI/CD',
            badge: 'Pipeline',
            icon: Zap,
            description: 'Push-to-deploy workflow executing deploy.sh over authenticated SSH.'
        }
    ];

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
    };

    const runSimulation = (stepTitle, commands) => {
        setIsSimulating(true);
        setSimulatedLogs([`[INFO] Starting execution for: ${stepTitle}...`]);

        commands.forEach((cmd, idx) => {
            setTimeout(() => {
                setSimulatedLogs((prev) => [...prev, `[CMD] $ ${cmd}`, `[SUCCESS] Exited with code 0 (${Math.floor(Math.random() * 80 + 20)}ms)`]);
                if (idx === commands.length - 1) {
                    setIsSimulating(false);
                    setSimulatedLogs((prev) => [...prev, `[STATUS] Step ${activeStep} verified successfully!`]);
                }
            }, (idx + 1) * 450);
        });
    };

    return (
        <div className="min-h-screen bg-[#0A0D14] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
            <Head title="GUI-based VPS Management & Automated Deployment" />

            {/* Glowing ambient background grids */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-15%] left-[20%] w-[650px] h-[650px] bg-indigo-600/15 rounded-full blur-[140px]" />
                <div className="absolute top-[25%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[130px]" />
                <div className="absolute bottom-[10%] left-[-5%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            </div>

            {/* Top Navigation */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0A0D14]/85 border-b border-slate-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
                            <div className="w-full h-full bg-[#0E131F] rounded-[11px] flex items-center justify-center">
                                <Server className="w-6 h-6 text-indigo-400" />
                            </div>
                        </div>
                        <div>
                            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                                VPS<span className="text-indigo-400">Deploy</span> GUI
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Self-Hosted Automation Engine</span>
                            </div>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                        <a href="#pipeline" className="hover:text-white transition-colors">10-Step Workflow</a>
                        <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
                        <a href="#comparison" className="hover:text-white transition-colors">Manual vs GUI</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        {auth?.user ? (
                            <Link
                                href={route('dashboard')}
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
                            >
                                <Layers className="w-4 h-4" />
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-sm font-medium transition-colors hover:bg-slate-800/60"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                                >
                                    <span>Get Started</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="relative z-10">
                <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6 shadow-inner">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Automating the 10-Step VPS Deployment Guide into a Visual Interface</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.12]">
                        Deploy & Manage Remote VPS Servers{' '}
                        <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                            Without Repeated Terminal Commands
                        </span>
                    </h1>

                    <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                        Your server stays entirely yours. Connect any Ubuntu or Debian VPS via SSH to visually orchestrate deploy keys, Git repositories, <code className="text-indigo-300">.env</code> configs, builds, Nginx virtual hosts, SSL certificates, Supervisor queue daemons, and push-to-deploy workflows.
                    </p>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                        <a
                            href="#pipeline"
                            className="px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-2.5"
                        >
                            <Play className="w-4 h-4 fill-white" />
                            <span>Try Interactive 10-Step Studio</span>
                        </a>
                        <Link
                            href={auth?.user ? route('dashboard') : route('register')}
                            className="px-7 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-base transition-all flex items-center gap-2"
                        >
                            <Server className="w-4 h-4 text-cyan-400" />
                            <span>Connect Your Server</span>
                        </Link>
                    </div>

                    {/* Live Server Telemetry Bar */}
                    <div className="mt-14 max-w-4xl mx-auto bg-slate-900/70 border border-slate-800 rounded-2xl p-4 backdrop-blur-md shadow-2xl">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
                            <div className="p-2">
                                <span className="text-xs text-slate-400 font-medium block">Server Target</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                    <span className="font-mono text-sm font-semibold text-white">147.93.85.120</span>
                                </div>
                                <span className="text-[11px] text-slate-400">Ubuntu 24.04 LTS (x86_64)</span>
                            </div>
                            <div className="p-2 sm:pl-4">
                                <span className="text-xs text-slate-400 font-medium block">Web Server & PHP</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                                    <span className="text-sm font-semibold text-white">Nginx + PHP 8.4-FPM</span>
                                </div>
                                <span className="text-[11px] text-emerald-400 font-mono">Status: Active (Port 80/443)</span>
                            </div>
                            <div className="p-2 sm:pl-4">
                                <span className="text-xs text-slate-400 font-medium block">Supervisor Daemons</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Radio className="w-3.5 h-3.5 text-indigo-400" />
                                    <span className="text-sm font-semibold text-white">Queue & Reverb</span>
                                </div>
                                <span className="text-[11px] text-emerald-400">2/2 Processes Running</span>
                            </div>
                            <div className="p-2 sm:pl-4">
                                <span className="text-xs text-slate-400 font-medium block">CI/CD Automation</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="text-sm font-semibold text-white">GitHub Actions</span>
                                </div>
                                <span className="text-[11px] text-slate-400">Branch: main &rarr; Auto-Deploy</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Interactive 10-Step Deployment Studio */}
                <section id="pipeline" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-3">
                            <Sliders className="w-3.5 h-3.5" /> Interactive Automation Studio
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                            The 10 Manual Deployment Steps, Visualized
                        </h2>
                        <p className="mt-3 text-slate-400 text-base">
                            Select any step from the deployment guide below to see how our GUI converts tedious terminal commands into interactive controls, automated scripts, and live verification.
                        </p>
                    </div>

                    {/* Step selector horizontal tabs */}
                    <div className="flex overflow-x-auto pb-4 gap-2.5 scrollbar-thin scrollbar-thumb-slate-800 mb-8">
                        {steps.map((s) => {
                            const IconComponent = s.icon;
                            const isActive = activeStep === s.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveStep(s.id)}
                                    className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                                        isActive
                                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                    }`}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                            isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                                        }`}
                                    >
                                        {s.id}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold whitespace-nowrap">{s.title}</div>
                                        <div className="text-[10px] text-slate-400">{s.badge}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Main Interactive Workstation for the Active Step */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left column: Visual Step Form / Control panel */}
                        <div className="lg:col-span-7 bg-[#0E131F] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                                            Step {activeStep} of 10
                                        </span>
                                        <span className="text-xs text-slate-400">{steps[activeStep - 1].badge}</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mt-1">
                                        {steps[activeStep - 1].title}
                                    </h3>
                                    <p className="text-sm text-slate-400 mt-1">
                                        {steps[activeStep - 1].description}
                                    </p>
                                </div>
                            </div>

                            {/* Dynamic Content based on Active Step */}
                            <div className="mt-6 space-y-6">
                                {activeStep === 1 && (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                                            <label className="block text-xs font-semibold text-slate-300 mb-2">
                                                Generated Public Deploy Key (~/.ssh/rhamify_app_deploy.pub)
                                            </label>
                                            <div className="flex items-center gap-2 bg-[#090C15] p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 break-all">
                                                <span>ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHr9v1mH... rhamify-app-deploy</span>
                                                <button
                                                    onClick={() => copyToClipboard('ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHr9v1mH881o2Qn3L91xP rhamify-app-deploy')}
                                                    className="ml-auto p-2 rounded-md hover:bg-slate-800 text-indigo-400 transition-colors flex-shrink-0"
                                                    title="Copy Public Key"
                                                >
                                                    {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                Ready to add to GitHub Repository &rarr; Settings &rarr; Deploy Keys (Read-only).
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                onClick={() => runSimulation('Generate Deploy Key', [
                                                    'ssh-keygen -t ed25519 -C "rhamify-app-deploy" -f ~/.ssh/rhamify_app_deploy -N ""',
                                                    'cat ~/.ssh/rhamify_app_deploy.pub'
                                                ])}
                                                disabled={isSimulating}
                                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                                            >
                                                <Key className="w-4 h-4" />
                                                Regenerate Keypair
                                            </button>
                                            <a
                                                href="https://github.com"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                                            >
                                                <span>Open GitHub Deploy Keys</span>
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {activeStep === 2 && (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <span className="text-slate-400 font-medium">Host Alias</span>
                                                    <input
                                                        type="text"
                                                        value="github-rhamify-app"
                                                        readOnly
                                                        className="w-full mt-1 px-3 py-2 bg-[#090C15] border border-slate-800 rounded-lg text-slate-200 font-mono text-xs"
                                                    />
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 font-medium">HostName</span>
                                                    <input
                                                        type="text"
                                                        value="github.com"
                                                        readOnly
                                                        className="w-full mt-1 px-3 py-2 bg-[#090C15] border border-slate-800 rounded-lg text-slate-200 font-mono text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 text-xs font-medium">Identity File Location</span>
                                                <input
                                                    type="text"
                                                    value="~/.ssh/rhamify_app_deploy"
                                                    readOnly
                                                    className="w-full mt-1 px-3 py-2 bg-[#090C15] border border-slate-800 rounded-lg text-slate-200 font-mono text-xs"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between pt-2">
                                                <span className="text-xs text-slate-300">Auto-Apply chmod 600 ~/.ssh/config</span>
                                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono">Enforced</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => runSimulation('Configure SSH Alias', [
                                                'echo "Host github-rhamify-app\n  HostName github.com\n  User git\n  IdentityFile ~/.ssh/rhamify_app_deploy\n  IdentitiesOnly yes" >> ~/.ssh/config',
                                                'chmod 600 ~/.ssh/config'
                                            ])}
                                            disabled={isSimulating}
                                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                                        >
                                            <Sliders className="w-4 h-4" />
                                            Apply SSH Host Configuration
                                        </button>
                                    </div>
                                )}

                                {activeStep === 3 && (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                                            <div>
                                                <label className="text-xs font-medium text-slate-300">Repository Clone URL</label>
                                                <input
                                                    type="text"
                                                    value={repoUrl}
                                                    onChange={(e) => setRepoUrl(e.target.value)}
                                                    className="w-full mt-1 px-3 py-2 bg-[#090C15] border border-slate-800 rounded-lg text-indigo-300 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <span className="text-slate-400 font-medium">Target Directory</span>
                                                    <input
                                                        type="text"
                                                        value="~/rhamify_app"
                                                        readOnly
                                                        className="w-full mt-1 px-3 py-2 bg-[#090C15] border border-slate-800 rounded-lg text-slate-200 font-mono text-xs"
                                                    />
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 font-medium">Git FileMode</span>
                                                    <input
                                                        type="text"
                                                        value="core.fileMode = false"
                                                        readOnly
                                                        className="w-full mt-1 px-3 py-2 bg-[#090C15] border border-slate-800 rounded-lg text-emerald-400 font-mono text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => runSimulation('Clone Git Repository', [
                                                'ssh -T git@github-rhamify-app',
                                                `git clone ${repoUrl} ~/rhamify_app`,
                                                'cd ~/rhamify_app && git config core.fileMode false'
                                            ])}
                                            disabled={isSimulating}
                                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                                        >
                                            <GitBranch className="w-4 h-4" />
                                            Test SSH Handshake & Clone
                                        </button>
                                    </div>
                                )}

                                {activeStep === 4 && (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-slate-300">Environment & Build Actions</span>
                                                <span className="text-[11px] text-slate-400 font-mono">cp .env.example .env</span>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                <div className="p-2.5 bg-[#090C15] rounded-lg border border-slate-800 text-xs">
                                                    <div className="text-slate-400 font-medium">PHP Composer</div>
                                                    <div className="text-emerald-400 font-mono mt-1 font-semibold">--no-dev --optimize</div>
                                                </div>
                                                <div className="p-2.5 bg-[#090C15] rounded-lg border border-slate-800 text-xs">
                                                    <div className="text-slate-400 font-medium">App Key & Migrations</div>
                                                    <div className="text-cyan-400 font-mono mt-1 font-semibold">artisan migrate --force</div>
                                                </div>
                                                <div className="p-2.5 bg-[#090C15] rounded-lg border border-slate-800 text-xs col-span-2 sm:col-span-1">
                                                    <div className="text-slate-400 font-medium">Node & Frontend</div>
                                                    <div className="text-indigo-400 font-mono mt-1 font-semibold">npm ci && npm run build</div>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => runSimulation('Configure Environment & Dependencies', [
                                                'cp .env.example .env',
                                                'composer install --no-dev --optimize-autoloader',
                                                'php artisan key:generate',
                                                'php artisan migrate --force',
                                                'php artisan storage:link',
                                                'npm ci && npm run build'
                                            ])}
                                            disabled={isSimulating}
                                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                                        >
                                            <Database className="w-4 h-4" />
                                            Execute Full Build Pipeline
                                        </button>
                                    </div>
                                )}

                                {activeStep === 5 && (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                                            <div className="text-xs font-semibold text-slate-300">File & Web Server ACL Permissions</div>
                                            <div className="space-y-2 text-xs font-mono text-slate-400">
                                                <div className="p-2 bg-[#090C15] rounded border border-slate-800 flex items-center justify-between">
                                                    <span>setfacl -m u:ploi:x ~/rhamify_app ~/rhamify_app/storage</span>
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                </div>
                                                <div className="p-2 bg-[#090C15] rounded border border-slate-800 flex items-center justify-between">
                                                    <span>setfacl -R -m u:ploi:rX ~/rhamify_app/public</span>
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                </div>
                                                <div className="p-2 bg-[#090C15] rounded border border-slate-800 flex items-center justify-between">
                                                    <span>chmod -R 775 ~/rhamify_app/storage bootstrap/cache</span>
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => runSimulation('Set File Permissions', [
                                                'setfacl -m u:ploi:x ~/rhamify_app ~/rhamify_app/storage ~/rhamify_app/storage/app',
                                                'setfacl -R -m u:ploi:rX ~/rhamify_app/public ~/rhamify_app/storage/app/public',
                                                'setfacl -R -d -m u:ploi:rX ~/rhamify_app/public ~/rhamify_app/storage/app/public',
                                                'chmod -R 775 ~/rhamify_app/storage ~/rhamify_app/bootstrap/cache'
                                            ])}
                                            disabled={isSimulating}
                                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                                        >
                                            <Shield className="w-4 h-4" />
                                            Enforce Web Server Permissions
                                        </button>
                                    </div>
                                )}

                                {activeStep === 6 && (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <label className="text-slate-400 font-medium">PHP Version</label>
                                                    <select
                                                        value={phpVer}
                                                        onChange={(e) => setPhpVer(e.target.value)}
                                                        className="w-full mt-1 px-3 py-2 bg-[#090C15] border border-slate-800 rounded-lg text-slate-200 text-xs font-mono"
                                                    >
                                                        <option value="8.4">PHP 8.4 (Latest)</option>
                                                        <option value="8.3">PHP 8.3</option>
                                                        <option value="8.2">PHP 8.2</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-slate-400 font-medium">Socket File</label>
                                                    <input
                                                        type="text"
                                                        value="/run/php/rhamify_app-fpm.sock"
                                                        readOnly
                                                        className="w-full mt-1 px-3 py-2 bg-[#090C15] border border-slate-800 rounded-lg text-slate-200 text-xs font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div className="p-2.5 bg-[#090C15] rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
                                                File: /etc/php/{phpVer}/fpm/pool.d/rhamify_app.conf
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => runSimulation('Configure PHP-FPM Pool', [
                                                `sudo nano /etc/php/${phpVer}/fpm/pool.d/rhamify_app.conf`,
                                                `sudo php-fpm${phpVer} -t`,
                                                `sudo systemctl reload php${phpVer}-fpm`
                                            ])}
                                            disabled={isSimulating}
                                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                                        >
                                            <Cpu className="w-4 h-4" />
                                            Validate Syntax & Reload PHP-FPM
                                        </button>
                                    </div>
                                )}

                                {activeStep === 7 && (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <label className="text-slate-400 font-medium">Domain Name</label>
                                                    <input
                                                        type="text"
                                                        value={domain}
                                                        onChange={(e) => setDomain(e.target.value)}
                                                        className="w-full mt-1 px-3 py-2 bg-[#090C15] border border-slate-800 rounded-lg text-cyan-300 text-xs font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-slate-400 font-medium">Web Root</label>
                                                    <input
                                                        type="text"
                                                        value="/home/rhamifytechnology/rhamify_app/public"
                                                        readOnly
                                                        className="w-full mt-1 px-3 py-2 bg-[#090C15] border border-slate-800 rounded-lg text-slate-200 text-xs font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div className="p-2.5 bg-[#090C15] rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                                                <span>Let's Encrypt Certbot SSL Auto-Renewal</span>
                                                <span className="text-emerald-400 font-semibold font-mono">Hook: systemctl reload nginx</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => runSimulation('Configure Nginx & SSL Certificate', [
                                                'sudo nginx -t',
                                                `sudo certbot certonly --webroot -w /home/rhamifytechnology/rhamify_app/public -d ${domain} --deploy-hook "systemctl reload nginx"`
                                            ])}
                                            disabled={isSimulating}
                                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                                        >
                                            <Globe className="w-4 h-4" />
                                            Deploy Nginx Site & Obtain SSL
                                        </button>
                                    </div>
                                )}

                                {activeStep === 8 && (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                <div className="p-3 bg-[#090C15] rounded-lg border border-slate-800">
                                                    <div className="font-semibold text-white flex items-center justify-between">
                                                        <span>Queue Worker</span>
                                                        <span className="text-emerald-400 font-mono text-[10px]">Autostart</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 mt-1 font-mono">
                                                        artisan queue:work --sleep=3 --tries=3 --max-time=3600
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-[#090C15] rounded-lg border border-slate-800">
                                                    <div className="font-semibold text-white flex items-center justify-between">
                                                        <span>Laravel Reverb</span>
                                                        <span className="text-cyan-400 font-mono text-[10px]">Port: {reverbPort}</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 mt-1 font-mono">
                                                        artisan reverb:start --port={reverbPort}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => runSimulation('Configure Supervisor Processes', [
                                                'sudo supervisorctl reread',
                                                'sudo supervisorctl update',
                                                'sudo supervisorctl status'
                                            ])}
                                            disabled={isSimulating}
                                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                                        >
                                            <Radio className="w-4 h-4" />
                                            Supervisor Reread & Update
                                        </button>
                                    </div>
                                )}

                                {activeStep === 9 && (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-slate-300">Deployment Script (~/rhamify_app/deploy.sh)</span>
                                                <span className="text-emerald-400 text-xs font-mono font-medium">Executable (chmod +x)</span>
                                            </div>
                                            <div className="p-3 bg-[#090C15] rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                                                <div className="text-indigo-400"># Pipeline Sequence:</div>
                                                <div>1. php artisan down || true</div>
                                                <div>2. git pull origin main</div>
                                                <div>3. composer install --no-dev --optimize-autoloader</div>
                                                <div>4. npm ci && npm run build</div>
                                                <div>5. php artisan migrate --force && php artisan optimize</div>
                                                <div>6. php artisan queue:restart && reverb:restart</div>
                                                <div>7. php artisan up</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => runSimulation('Execute Auto-Deployment Script', [
                                                'cd /home/rhamifytechnology/rhamify_app',
                                                'bash deploy.sh'
                                            ])}
                                            disabled={isSimulating}
                                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                                        >
                                            <Play className="w-4 h-4 fill-white" />
                                            Simulate Full Production Deploy
                                        </button>
                                    </div>
                                )}

                                {activeStep === 10 && (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                                            <div className="text-xs font-semibold text-slate-300">Required GitHub Actions Secrets</div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                                                <div className="p-2.5 bg-[#090C15] rounded border border-slate-800">
                                                    <span className="text-slate-400 block text-[10px]">Secret Name</span>
                                                    <span className="text-amber-400 font-semibold">SSH_HOST</span>
                                                    <span className="text-slate-400 block text-[10px] mt-0.5">{serverIp}</span>
                                                </div>
                                                <div className="p-2.5 bg-[#090C15] rounded border border-slate-800">
                                                    <span className="text-slate-400 block text-[10px]">Secret Name</span>
                                                    <span className="text-cyan-400 font-semibold">SSH_USER</span>
                                                    <span className="text-slate-400 block text-[10px] mt-0.5">{sshUser}</span>
                                                </div>
                                                <div className="p-2.5 bg-[#090C15] rounded border border-slate-800">
                                                    <span className="text-slate-400 block text-[10px]">Secret Name</span>
                                                    <span className="text-indigo-400 font-semibold">SSH_KEY</span>
                                                    <span className="text-emerald-400 block text-[10px] mt-0.5">Automated Sync</span>
                                                </div>
                                            </div>
                                            <div className="p-2.5 bg-[#090C15] rounded border border-slate-800 text-[11px] text-slate-400">
                                                Workflow triggers on <code className="text-indigo-300">push: branches: [main]</code> and executes remote deploy.sh securely over SSH.
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => runSimulation('GitHub Actions Trigger', [
                                                'git push origin main',
                                                'SSH connection established with 147.93.85.120',
                                                'Executing ~/rhamify_app/deploy.sh',
                                                'All migrations and frontend assets deployed successfully!'
                                            ])}
                                            disabled={isSimulating}
                                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                                        >
                                            <Zap className="w-4 h-4" />
                                            Simulate Push-To-Deploy
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Navigation between steps */}
                            <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-800 text-xs font-semibold">
                                <button
                                    onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                                    disabled={activeStep === 1}
                                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors"
                                >
                                    &larr; Previous Step
                                </button>
                                <span className="text-slate-400">Step {activeStep} of 10</span>
                                <button
                                    onClick={() => setActiveStep((prev) => Math.min(10, prev + 1))}
                                    disabled={activeStep === 10}
                                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white transition-colors"
                                >
                                    Next Step &rarr;
                                </button>
                            </div>
                        </div>

                        {/* Right column: Simulated Remote Execution Terminal */}
                        <div className="lg:col-span-5 bg-[#07090E] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[560px]">
                            <div className="px-4 py-3 bg-[#0B0F17] border-b border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                                    <span className="text-xs font-mono text-slate-400 ml-2">
                                        ssh://{sshUser}@{serverIp}:22
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isSimulating && (
                                        <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                                    )}
                                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                        Live Stream
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 font-mono text-xs flex-1 overflow-y-auto space-y-2 text-slate-300 scrollbar-thin scrollbar-thumb-slate-800">
                                <div className="text-slate-400"># Antigravity VPS Automation Console v2.0</div>
                                <div className="text-slate-400"># Connected to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-40-generic)</div>
                                <div className="text-emerald-400/90">&radic; SSH Host Key Verified [ed25519-sha256]</div>
                                <div className="border-b border-slate-800/80 my-2" />

                                {simulatedLogs.length === 0 ? (
                                    <div className="py-8 text-center text-slate-400">
                                        <Terminal className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                                        <p>Click any action button on the left to simulate remote VPS execution and watch live stream logs.</p>
                                    </div>
                                ) : (
                                    simulatedLogs.map((log, index) => {
                                        const isCmd = log.startsWith('[CMD]');
                                        const isSuccess = log.startsWith('[SUCCESS]');
                                        const isStatus = log.startsWith('[STATUS]');
                                        return (
                                            <div
                                                key={index}
                                                className={`leading-relaxed ${
                                                    isCmd
                                                        ? 'text-cyan-300 font-semibold'
                                                        : isSuccess
                                                        ? 'text-emerald-400'
                                                        : isStatus
                                                        ? 'text-indigo-400 font-bold'
                                                        : 'text-slate-300'
                                                }`}
                                            >
                                                {log}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="p-3 bg-[#0B0F17] border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                                <span>Output Buffer: 4096 bytes</span>
                                <button
                                    onClick={() => setSimulatedLogs([])}
                                    className="hover:text-white transition-colors"
                                >
                                    Clear Terminal
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Manual Pain vs Visual GUI Comparison Matrix */}
                <section id="comparison" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-3">
                            The Paradigm Shift
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                            Manual Terminal Headaches vs Automated Visual GUI
                        </h2>
                        <p className="mt-3 text-slate-400 text-base">
                            Why developers waste hours on syntax typos, permission locks, and configuration drift when managing remote servers manually.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* The Manual Terminal Way */}
                        <div className="bg-rose-950/10 border border-rose-900/30 rounded-2xl p-6 sm:p-8 relative">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                                    &times;
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Manual Terminal Workflow</h3>
                                    <span className="text-xs text-rose-300/80">Error-prone, slow, and repetitive</span>
                                </div>
                            </div>

                            <ul className="space-y-4 text-sm text-slate-300">
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-rose-900/50 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">1</div>
                                    <span>Manually generating SSH deploy keys and editing <code className="text-rose-300">~/.ssh/config</code> with potential permission crashes (chmod 600).</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-rose-900/50 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">2</div>
                                    <span>Typing complex ACL permission syntax like <code className="text-rose-300">setfacl -m u:ploi:x ...</code> to allow web server access without 500 errors.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-rose-900/50 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">3</div>
                                    <span>Editing PHP-FPM pool files in <code className="text-rose-300">nano</code> and risking downtime if syntax check fails during production traffic.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-rose-900/50 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">4</div>
                                    <span>Manually setting up Supervisor ini config files for Queue Workers & Laravel Reverb WebSockets.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-rose-900/50 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">5</div>
                                    <span>Writing custom bash scripts with traps for maintenance mode toggles without any visual execution status.</span>
                                </li>
                            </ul>
                        </div>

                        {/* The GUI Automated Way */}
                        <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 relative shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                                    &check;
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Visual Management Platform</h3>
                                    <span className="text-xs text-indigo-300">100% automated, verified, and safe</span>
                                </div>
                            </div>

                            <ul className="space-y-4 text-sm text-slate-300">
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">1</div>
                                    <span><strong>1-Click Keypair Generator:</strong> Automatic ed25519 generation, host aliasing, and 1-click clipboard copy for GitHub.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">2</div>
                                    <span><strong>Automated ACL & Permission Guard:</strong> One click enforces correct Nginx user permissions and storage/cache chmod.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">3</div>
                                    <span><strong>Visual PHP-FPM & Nginx Configurator:</strong> Select PHP 8.4, click test syntax, reload with zero downtime.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">4</div>
                                    <span><strong>Supervisor Process Monitor:</strong> Toggle queue workers and WebSockets with visual start/stop/restart controls.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">5</div>
                                    <span><strong>Push-to-Deploy CI/CD:</strong> Auto-generates GitHub Actions workflows and runs zero-downtime deploy.sh with live logs.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Architecture & Core Components */}
                <section id="architecture" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
                            System Architecture
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                            How Your Platform Operates
                        </h2>
                        <p className="mt-3 text-slate-400 text-base">
                            Built on Laravel, React, and MySQL, coordinating remote server automation over encrypted SSH.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-[#0E131F] border border-slate-800 rounded-2xl p-6 relative">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5">
                                <Layers className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">1. Control Panel GUI</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                React + Inertia.js interface for managing remote servers, file trees, .env configuration, real-time command streaming, and deployment history.
                            </p>
                        </div>

                        <div className="bg-[#0E131F] border border-slate-800 rounded-2xl p-6 relative">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-5">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">2. Laravel Job Queue & SSH</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Asynchronous Laravel workers dispatch remote SSH jobs, safely encrypt private keys, handle timeouts, and stream live terminal outputs to the UI.
                            </p>
                        </div>

                        <div className="bg-[#0E131F] border border-slate-800 rounded-2xl p-6 relative">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5">
                                <Server className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">3. Customer's Remote VPS</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Remains 100% under customer ownership. Runs Ubuntu/Debian, Nginx, PHP-FPM, Supervisor, and executes atomic deployment jobs seamlessly.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Final Call to Action */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="relative rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 border border-indigo-500/30 p-10 sm:p-16 text-center overflow-hidden shadow-2xl">
                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                                Ready to Turn Manual VPS Deployment Into a Smooth Visual Experience?
                            </h2>
                            <p className="mt-4 text-base sm:text-lg text-indigo-200/90 leading-relaxed">
                                Connect your first VPS, generate your deploy keys, configure your Nginx domain, and launch automated GitHub deployments in minutes.
                            </p>
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                                <Link
                                    href={auth?.user ? route('dashboard') : route('register')}
                                    className="px-8 py-4 rounded-xl bg-white text-indigo-950 hover:bg-slate-100 font-bold text-base transition-all shadow-xl shadow-white/10 flex items-center gap-2"
                                >
                                    <span>Get Started Now</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    href={route('login')}
                                    className="px-8 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-base transition-all"
                                >
                                    Sign In to Control Panel
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800/80 bg-[#080B12] py-12 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 font-semibold text-slate-300">
                        <Server className="w-4 h-4 text-indigo-400" />
                        <span>VPS Deploy GUI &bull; Automated Infrastructure Platform</span>
                    </div>
                    <div>
                        Powered by Laravel v{laravelVersion} (PHP v{phpVersion}) &bull; React &bull; MySQL
                    </div>
                </div>
            </footer>
        </div>
    );
}
