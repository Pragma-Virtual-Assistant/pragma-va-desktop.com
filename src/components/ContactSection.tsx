import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { submitData } from '../utils/api';

export function ContactSection() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        try {
            await submitData({
                type: 'contact',
                email,
                idea: `[Investor] ${message}` // Legacy mapping: 'idea' field used for contact message in backend
            });
            setStatus('success');
            setEmail('');
            setMessage('');
        } catch (error) {
            setStatus('error');
        }
    };

    return (
        <section className="py-24 px-6 bg-white dark:bg-gray-900">
            <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Get in touch</h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
                    Have questions, interested in partnership, or want to invest? <br />
                    We'd love to hear from you.
                </p>

                {status === 'success' ? (
                    <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600 dark:text-green-400">
                        <p className="font-semibold text-lg">Message sent! We'll stay in touch.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4 text-left">
                        <div>
                            <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input
                                id="contact-email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                            <textarea
                                id="contact-message"
                                required
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                placeholder="How can we help?"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={status === 'submitting'}
                            className="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {status === 'submitting' ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    Send Message
                                    <Send className="w-5 h-5" />
                                </>
                            )}
                        </button>
                        {status === 'error' && (
                            <p className="text-red-500 text-sm text-center">Something went wrong. Please try again.</p>
                        )}
                    </form>
                )}
            </div>
        </section>
    );
}
