import React from 'react';
import { Mail } from 'lucide-react';

export function ContactSection() {
    return (
        <section className="py-24 px-6 bg-white dark:bg-gray-900">
            <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Get in touch</h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                    Have questions, interested in partnership, or want to invest? <br />
                    We'd love to hear from you.
                </p>

                <a
                    href="mailto:contact@pragma-va-desktop.com"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:text-blue-500 transition-all text-lg font-medium"
                >
                    <Mail className="w-5 h-5" />
                    contact@pragma-va-desktop.com
                </a>
            </div>
        </section>
    );
}
