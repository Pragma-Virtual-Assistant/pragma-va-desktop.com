import React from 'react';
import { ChevronRight } from 'lucide-react';
import { WaitlistForm } from './WaitlistForm';

interface HeroProps {
    onJoinClick: () => void;
}

export function Hero({ onJoinClick }: HeroProps) {
    return (
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 opacity-30 pointer-events-none">
                <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
                <div className="absolute top-20 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
            </div>

            <div className="max-w-4xl mx-auto text-center space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium text-sm border border-blue-100 dark:border-blue-800">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Under Active Development
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight mb-8">
                    One simple control center for all your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">workspaces</span>.
                    <span className="block text-sm text-red-500 font-mono mt-4">(v44 Proxy Auth Pending)</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                    PragmaVA is the local desktop assistant that unifies your digital life.
                    Manage projects, automate repetitive tasks, and keep your history in one place—all under your control.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <button
                        onClick={onJoinClick}
                        className="px-8 py-4 rounded-full bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
                    >
                        Join the waitlist <ChevronRight className="w-5 h-5" />
                    </button>
                    <a
                        href="#how-it-helps"
                        className="px-8 py-4 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                        Learn more
                    </a>
                </div>
            </div>
        </section>
    );
}
