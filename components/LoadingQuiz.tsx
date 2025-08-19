import React, { useState, useEffect } from 'react';
import { DARIJA_TIPS } from '../constants.ts';
import { SpinnerIcon, LightbulbIcon } from './icons/index.ts';
import { useTranslations } from '../hooks/useTranslations.ts';

const LoadingQuiz: React.FC = () => {
    const { t } = useTranslations();
    const [tip, setTip] = useState('');

    useEffect(() => {
        setTip(DARIJA_TIPS[Math.floor(Math.random() * DARIJA_TIPS.length)]);
    }, []);

    return (
        <div className="w-full max-w-md flex flex-col items-center justify-center p-4 text-center">
            <SpinnerIcon className="w-16 h-16 text-primary-400 animate-spin" />
            <h2 className="text-2xl font-bold text-white mt-6 mb-4">{t('quiz_loading_title')}</h2>
            <p className="text-slate-300 max-w-md">{t('quiz_loading_subtitle')}</p>
            
            {tip && (
                <div className="mt-12 bg-slate-800/50 p-4 rounded-lg max-w-md w-full border border-slate-700 animate-fade-in-up" style={{animationDelay: '300ms'}}>
                    <div className="flex items-center gap-3 justify-center">
                         <LightbulbIcon className="w-6 h-6 text-amber-400" />
                         <h3 className="font-semibold text-amber-300">{t('quiz_loading_tip_title')}</h3>
                    </div>
                    <p className="text-slate-300 mt-2">{tip}</p>
                </div>
            )}
        </div>
    );
};

export default LoadingQuiz;