import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0D14] text-slate-100 p-4 sm:p-6 relative selection:bg-indigo-500 selection:text-white">
            {/* Ambient background glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[10%] left-[25%] w-[450px] h-[450px] bg-indigo-600/15 rounded-full blur-[130px]" />
                <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-md flex flex-col items-center">
                <div className="mb-6">
                    <Link href="/" className="inline-block group">
                        <ApplicationLogo className="w-48 h-auto object-contain drop-shadow-xl group-hover:scale-105 transition-transform" />
                    </Link>
                </div>

                <div className="w-full bg-[#0E131F] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
                    {children}
                </div>
            </div>
        </div>
    );
}
