import React, { useState } from 'react';
import { Lightbulb, Loader2 } from 'lucide-react';

export function IdeaForm() {
    const [idea, setIdea] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

        if (!scriptUrl) {
            // Simulate success
            setTimeout(() => setStatus('success'), 1000);
            return;
        }

        try {
            await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'idea', idea }),
            });
            setStatus('success');
            setIdea('');
        } catch (error) {
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-3xl text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-300">
                    <Lightbulb className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Thanks for the idea!</h3>
                <p className="text-gray-600 dark:text-gray-300">We're building PragmaVA for you.</p>
                <button onClick={() => setStatus('idle')} className="mt-4 text-primary hover:underline">Send another</button>
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

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    {status === 'submitting' ? <Loader2 className="animate-spin" /> : 'Submit Idea'}
                </button>
            </form>
        </div>
    );
}
