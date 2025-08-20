import React from 'react';
import { useTranslations } from '../hooks/useTranslations.ts';
import { ClockIcon } from './icons/index.ts';

interface QuizInProgressToastProps {
    onResume: () => void;
}

const QuizInProgressToast: React.FC<QuizInProgressToastProps> = ({ onResume }) => {
    const { t } = useTranslations();

    return (
        <div
            className="fixed top-5 right-5 w-80 bg-[var(--color-bg-card)] border-2 border-amber-500 rounded-xl shadow-2xl p-4 flex items-center gap-4 z-[60] animate-fade-in-up"
            role="alert"
            aria-live="assertive"
        >
            <div className="text-2xl text-amber-400 flex-shrink-0"><ClockIcon /></div>
            <div>
                <h3 className="font-bold text-[var(--color-text-base)]">Quiz in Progress</h3>
                <p className="text-[var(--color-text-muted)] text-sm">Your quiz is paused. Don't forget to finish it to save your progress!</p>
                <button onClick={onResume} className="text-sm font-bold text-primary-300 hover:text-primary-400 mt-2">
                    Resume Quiz &rarr;
                </button>
            </div>
        </div>
    );
};

export default QuizInProgressToast;