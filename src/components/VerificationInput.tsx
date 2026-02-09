import React, { useRef, useState, useEffect } from 'react';

interface VerificationInputProps {
    onComplete: (code: string) => void;
    isLoading: boolean;
    onCancel: () => void;
    email: string;
}

export function VerificationInput({ onComplete, isLoading, onCancel, email }: VerificationInputProps) {
    const [code, setCode] = useState(['', '', '', '']);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-focus next
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }

        // Trigger complete
        if (newCode.every(digit => digit !== '') && index === 3 && value !== '') {
            onComplete(newCode.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                    We sent a 4-digit code to <span className="font-medium text-primary">{email}</span>
                </p>
            </div>

            <div className="flex justify-center gap-3 mb-8">
                {code.map((digit, idx) => (
                    <input
                        key={idx}
                        ref={el => inputRefs.current[idx] = el}
                        type="text"
                        maxLength={1}
                        aria-label={`Digit ${idx + 1}`}
                        value={digit}
                        onChange={(e) => handleChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        disabled={isLoading}
                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:border-primary focus:ring-0 outline-none transition-all disabled:opacity-50"
                    />
                ))}
            </div>

            <div className="flex flex-col gap-3">
                <button
                    onClick={() => onComplete(code.join(''))}
                    disabled={code.some(c => !c) || isLoading}
                    className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex justify-center items-center"
                >
                    {isLoading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        'Verify & Submit'
                    )}
                </button>
                <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 underline"
                >
                    Cancel / Change Email
                </button>
            </div>
        </div>
    );
}
