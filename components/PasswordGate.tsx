'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, ArrowRight } from 'lucide-react';
import { unlockEvent } from '@/lib/actions';

interface PasswordGateProps {
    eventId: string;
}

export const PasswordGate = ({ eventId }: PasswordGateProps) => {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await unlockEvent(eventId, password);
            if (result.success) {
                window.location.reload(); // Refresh to bypass server check
                // Or router.refresh() but full reload ensures new cookie is sent
            } else {
                setError(result.message || 'パスワードが間違っています');
                setIsLoading(false);
            }
        } catch (e) {
            setError('エラーが発生しました');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-8 rounded-xl shadow-xl border border-gray-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">パスワードが必要です</h1>
                    <p className="text-gray-500 mt-2">このイベントを閲覧するにはパスワードを入力してください。</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            required
                            placeholder="パスワードを入力"
                            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-mono"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg flex items-center justify-center font-bold animate-in fade-in slide-in-from-top-1">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-4 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-md
                    ${isLoading
                                ? 'bg-indigo-400 cursor-not-allowed opacity-80'
                                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
                            }
                `}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                認証中...
                            </>
                        ) : (
                            <>
                                見る <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
