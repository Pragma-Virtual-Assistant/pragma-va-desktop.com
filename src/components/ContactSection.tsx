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
            </div>
        </section>
    );
}
