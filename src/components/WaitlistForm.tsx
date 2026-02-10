import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

export function WaitlistForm() {
    const [email, setEmail] = useState('');
    const [support, setSupport] = useState(false);
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL; // To be configured

        if (!scriptUrl) {
            console.warn('Google Script URL not returned');
            // Simulate success for demo if no URL
            setTimeout(() => setStatus('success'), 1000);
            return;
        }

        try {
            await fetch(scriptUrl, {
                method: 'POST',
                // mode: 'no-cors' REMOVED to read response
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({ type: 'waitlist', email, support }),
            });
            setStatus('success');
            localStorage.setItem('pragma_user_email', email);
            setEmail('');
            setSupport(false);
        } catch (error) {
            console.error('Error submitting form', error);
            setStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-800 text-center animate-fade-in">
                <h3 className="text-xl font-bold text-green-800 dark:text-green-300 mb-2">You're on the list!</h3>
                <p className="text-green-700 dark:text-green-400">Thanks for joining. We'll be in touch soon.</p>
                <button
                    onClick={() => setStatus('idle')}
                    className="mt-4 text-sm text-green-600 dark:text-green-400 hover:underline"
                >
                    Submit another email
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-5 py-3 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
                <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="px-6 py-3 rounded-full bg-primary text-white font-bold hover:bg-primary-dark disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-w-[140px]"
                >
                    {status === 'submitting' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Join Waitlist <Send className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>

            <label className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none group">
                <div className="relative flex items-center">
                    <input
                        type="checkbox"
                        checked={support}
                        onChange={(e) => setSupport(e.target.checked)}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 dark:border-gray-600 shadow transition-all checked:border-primary checked:bg-primary hover:shadow-md"
                    />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                    </span>
                </div>
                <span className="group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                    I want to support / take part in the project
                </span>
            </label>

            {status === 'error' && (
                <div className="text-red-500 text-sm text-center">
                    <p className="font-bold">Something went wrong.</p>
                    <p className="text-xs mt-1 opacity-75">{errorMessage}</p>
                    <p className="text-xs mt-1">Check Console (F12) for details.</p>
                </div>
            )}
        </form>
    );
}
