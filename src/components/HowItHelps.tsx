import React from 'react';
import { LayoutDashboard, Zap, History, ShieldCheck } from 'lucide-react';

const BENEFITS = [
    {
        icon: LayoutDashboard,
        title: 'Single Dashboard',
        description: 'Access all your workspaces, projects, and active tasks from one unified view. extensive context switching is a thing of the past.'
    },
    {
        icon: Zap,
        title: 'Automate Tasks',
        description: 'Let PragmaVA handle the repetitive clicking and typing. Create workflows that work across your desktop apps and web, automating anything anywhere.'
    },
    {
        icon: History,
        title: 'Smart History',
        description: 'Never lose track of what you did. PragmaVA keeps a searchable log of your actions and automation results.'
    },
    {
        icon: ShieldCheck,
        title: 'Local & Private',
        description: 'Your data stays on your machine. PragmaVA runs locally, giving you complete control over your information.'
    }
];

export function HowItHelps() {
    return (
        <section id="how-it-helps" className="py-24 px-6 bg-gray-50 dark:bg-gray-900/50">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                        Regain your focus.
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        PragmaVA eliminates the friction of modern digital work.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {BENEFITS.map((benefit, idx) => (
                        <div key={idx} className="p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 group">
                            <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <benefit.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{benefit.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                {benefit.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
