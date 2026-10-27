import React, { useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { AlertTriangle, Trash2, X, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function DeleteUserForm({ hasPassword = true, className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const [deleteConfirmationWord, setDeleteConfirmationWord] = useState('');
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        if (!hasPassword && deleteConfirmationWord.toUpperCase() !== 'DELETE') {
            return;
        }

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        setDeleteConfirmationWord('');
        clearErrors();
        reset();
    };

    return (
        <section className={`bg-[#0E131F] border border-rose-900/30 rounded-2xl p-6 sm:p-8 shadow-xl ${className}`}>
            <header className="border-b border-rose-900/30 pb-5 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            Account Danger Zone
                        </h2>
                        <p className="text-xs text-rose-300/70 mt-0.5">
                            Permanently delete your account, server configurations, and stored project metadata.
                        </p>
                    </div>
                </div>
            </header>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-xs text-slate-400 max-w-xl">
                    Once your account is terminated, all registered servers, deployment credentials, and monitoring history will be deleted immediately. This action cannot be reversed.
                </div>

                <button
                    type="button"
                    onClick={confirmUserDeletion}
                    className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-950/50 flex items-center gap-2"
                >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Account</span>
                </button>
            </div>

            {/* Dark Styled Confirmation Modal */}
            {confirmingUserDeletion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md bg-[#0E131F] border border-rose-900/50 rounded-2xl p-6 shadow-2xl shadow-rose-950/40">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">
                                    Confirm Account Deletion
                                </h3>
                                <p className="text-xs text-slate-400">
                                    This action is irreversible.
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                            All your connected servers, saved deployment commands, and project records will be wiped from this platform immediately.
                        </p>

                        <form onSubmit={deleteUser} className="space-y-4">
                            {hasPassword ? (
                                <div>
                                    <label htmlFor="confirm_password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Enter your password to confirm:
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <input
                                            id="confirm_password"
                                            type="password"
                                            ref={passwordInput}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="w-full bg-[#080B12] border border-rose-900/40 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                                            placeholder="Your current password"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span>{errors.password}</span>
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label htmlFor="confirm_word" className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Type <span className="font-mono text-rose-400 font-bold">DELETE</span> to confirm:
                                    </label>
                                    <input
                                        id="confirm_word"
                                        type="text"
                                        value={deleteConfirmationWord}
                                        onChange={(e) => setDeleteConfirmationWord(e.target.value)}
                                        className="w-full bg-[#080B12] border border-rose-900/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors font-mono"
                                        placeholder="DELETE"
                                        required
                                        autoFocus
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || (!hasPassword && deleteConfirmationWord.toUpperCase() !== 'DELETE')}
                                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>Permanently Delete</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
