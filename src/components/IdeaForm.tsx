import React, { useState, useEffect } from 'react';
import { Lightbulb, Loader2, Mail } from 'lucide-react';
import { submitData } from '../utils/api';

export function IdeaForm() {
    const [idea, setIdea] = useState('');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [step, setStep] = useState<'details' | 'verification' | 'success'>('details');
    const [storedEmail, setStoredEmail] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('pragma_user_email');
        if (saved) {
            setStoredEmail(saved);
            setEmail(saved);
        }
    }, []);

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMessage('');

        try {
            await submitData({ action: 'request_code', type: 'idea', idea, email });
            setStep('verification');
            setStatus('idle');
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Failed to send verification code');
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMessage('');

        try {
            await submitData({ action: 'verify_code', email, code });
            setStep('success');
            setStatus('idle');
            setIdea('');
            if (email) {
                localStorage.setItem('pragma_user_email', email);
            }
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Invalid or expired code');
        }
    };

    if (step === 'success') {
        return (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-3xl text-center animate-fade-in">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-300">
                    <Lightbulb className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Thanks for the idea!</h3>
                <p className="text-gray-600 dark:text-gray-300">Verified and received. We're building PragmaVA for you.</p>
                <button
                    onClick={() => { setStep('details'); setStatus('idle'); setIdea(''); setCode(''); }}
                    className="mt-4 text-primary hover:underline"
                >
                    Send another
                </button>
            </div>
        );
    }

    if (step === 'verification') {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700 animate-fade-in">
                <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-3">Verify Your Idea</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Enter the 6-digit code sent to <span className="font-semibold">{email}</span>
                    </p>
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-4">
                    <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="000000"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-4 rounded-2xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all text-center text-3xl font-bold tracking-[0.5em]"
                    />

                    <button
                        type="submit"
                        disabled={status === 'submitting' || code.length < 6}
                        className="w-full py-4 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                        {status === 'submitting' ? <Loader2 className="animate-spin" /> : 'Confirm & Submit'}
                    </button>

                    <button
                        type="button"
                        onClick={() => setStep('details')}
                        className="w-full text-sm text-gray-500 hover:text-primary transition-colors"
                    >
                        Back to details
                    </button>

                    {status === 'error' && (
                        <p className="text-red-500 text-sm text-center">{errorMessage}</p>
                    )}
                </form>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-3">What would you like to see?</h3>
                <p className="text-gray-600 dark:text-gray-400">
                    Tell us what you’d love PragmaVA to handle for you.
                </p>
            </div>

            <form onSubmit={handleRequestCode} className="space-y-4">
                {/* Smart Email State */}
                {storedEmail ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 justify-center">
                        <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Contributing as <span className="font-medium text-gray-700 dark:text-gray-300">{storedEmail}</span>
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.removeItem('pragma_user_email');
                                setStoredEmail(null);
                                setEmail('');
                            }}
                            className="text-blue-500 hover:text-blue-600 underline text-xs"
                        >
                            Change
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                        <input
                            type="email"
                            required
                            placeholder="Your email (mandatory for updates)"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                    </div>
                )}

                <textarea
                    required
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="e.g. I want it to organize my downloads folder every Friday..."
                    className="w-full h-32 px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none resize-none transition-all"
                />

                <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                    {status === 'submitting' ? <Loader2 className="animate-spin" /> : 'Next: Verify Email'}
                </button>

                {status === 'error' && (
                    <p className="text-red-500 text-sm text-center">{errorMessage}</p>
                )}
            </form>
        </div>
    );
}
