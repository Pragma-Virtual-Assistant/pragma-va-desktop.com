import React from 'react';
import { Mail, Calendar, FileText, ArrowRight } from 'lucide-react';

const EXAMPLES = [
    {
        icon: Mail,
        title: 'Inbox Zero',
        description: 'File invoices from Gmail into specific Drive folders automatically based on sender and keywords.'
    },
    {
        icon: Calendar,
        title: 'Calendar Sync',
        description: 'Keep your personal and work calendars aligned without sharing private details between organizations.'
    },
    {
        icon: FileText,
        title: 'Weekly Reports',
        description: 'Generate comprehensive summaries of your project activity across Jira, Slack, GitHub and much more.'
    }
];

export function Examples() {
    return (
        <section className="py-24 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                            Real world problems,<br />
                            <span className="text-blue-600">solved automatically.</span>
                        </h2>
                        <div className="space-y-6">
                            {EXAMPLES.map((example, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mt-1">
                                        <example.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{example.title}</h4>
                                        <p className="text-gray-600 dark:text-gray-400">{example.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-3xl -z-10 rounded-full"></div>
                        <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-2xl border border-gray-800">
                            {/* Mock UI for Automation */}
                            <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="ml-4 text-xs text-gray-500 font-mono">PragmaVA Automation Engine</span>
                            </div>

                            <div className="space-y-4 font-mono text-sm">
                                <div className="flex gap-4">
                                    <span className="text-blue-400">10:02 AM</span>
                                    <span>New invoice detected: "AWS_Sept.pdf"</span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-blue-400">10:02 AM</span>
                                    <span className="text-yellow-400">Processing...</span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-blue-400">10:02 AM</span>
                                    <span>Extracted amount: $42.50</span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-blue-400">10:03 AM</span>
                                    <span className="text-green-400">✓ Uploaded to "Finance/2025/Receipts"</span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-blue-400">10:03 AM</span>
                                    <span className="text-green-400">✓ Logged in "Expenses.xlsx"</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
