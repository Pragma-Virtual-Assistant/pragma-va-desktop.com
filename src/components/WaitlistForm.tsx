import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { submitData } from '../utils/api';

export function WaitlistForm() {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [support, setSupport] = useState(false);
    const [step, setStep] = useState<'email' | 'verification' | 'success'>('email');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMessage('');

        try {
            await submitData({ action: 'request_code', type: 'waitlist', email, support });
            setStep('verification');
            setStatus('idle');
        } catch (error: any) {
            console.error('Error requesting code', error);
            setStatus('error');
            const msg = error.message || "";
            if (msg.includes('Unexpected token') || msg.includes('is not valid JSON')) {
                setErrorMessage('Service temporarily unavailable (API Error). Please try again in 3 minutes.');
            } else {
                setErrorMessage(msg || 'Failed to send verification code');
            }
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
            localStorage.setItem('pragma_user_email', email);
        } catch (error: any) {
            console.error('Error verifying code', error);
            setStatus('error');
            setErrorMessage(error.message || 'Invalid or expired code');
        }
    };

    if (step === 'success') {
        return (
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-800 text-center animate-fade-in">
                <h3 className="text-xl font-bold text-green-800 dark:text-green-300 mb-2">You're on the list!</h3>
                <p className="text-green-700 dark:text-green-400">Verification successful. Thanks for joining!</p>
                <button
                    onClick={() => { setStep('email'); setStatus('idle'); setEmail(''); setCode(''); }}
                    className="mt-4 text-sm text-green-600 dark:text-green-400 hover:underline"
                >
                    Submit another email
                </button>
            </div>
        );
    }

    if (step === 'verification') {
        return (
            <form onSubmit={handleVerifyCode} className="w-full max-w-md mx-auto space-y-4 animate-fade-in">
                <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Verify Your Email</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">We sent a 6-digit code to <span className="font-semibold">{email}</span></p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="Enter 6-digit code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 px-5 py-3 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-center tracking-widest text-xl font-bold"
                    />
                    <button
                        type="submit"
                        disabled={status === 'submitting' || code.length < 6}
                        className="px-6 py-3 rounded-full bg-primary text-white font-bold hover:bg-primary-dark disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {status === 'submitting' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>Verify & Join <Send className="w-4 h-4" /></>
                        )}
                    </button>
                </div>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => setStep('email')}
                        className="text-sm text-gray-500 hover:text-primary transition-colors"
                    >
                        Change Email Address
                    </button>
                </div>

                {status === 'error' && (
                    <div className="text-red-500 text-sm text-center">
                        <p>{errorMessage}</p>
                    </div>
                )}
            </form>
        );
    }

    return (
        <form onSubmit={handleRequestCode} className="w-full max-w-md mx-auto space-y-4">
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
                    <p>{errorMessage}</p>
                </div>
            )}
        </form>
    );
}
