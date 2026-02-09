import React from 'react';

export function Footer() {
    return (
        <footer className="py-12 px-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        P
                    </div>
                    <span className="font-bold text-xl text-gray-900 dark:text-white">PragmaVA</span>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 text-center md:text-right">
                    <p>© {new Date().getFullYear()} PragmaVA. All rights reserved.</p>
                    <div className="flex gap-4 justify-center md:justify-end mt-2">
                        <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
                    </div>
                </div>
            </div>
            <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
                <p className="text-xs text-gray-400">
                    PragmaVA is currently under development. Designs and features are subject to change.
                </p>
            </div>
        </footer>
    );
}
