

import React, { useState, useEffect, useContext } from 'react';
import { getTopicExplanation } from '../services/geminiService.ts';
import { LearningTopic } from '../types.ts';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import { SpinnerIcon, LightbulbIcon } from './icons/index.ts';
import { useTranslations } from '../hooks/useTranslations.ts';
import { UserContext } from '../context/UserContext.tsx';

interface PreQuizExplanationProps {
    topic: LearningTopic;
    level: number;
    onContinue: () => void;
}

const PreQuizExplanation: React.FC<PreQuizExplanationProps> = ({ topic, level, onContinue }) => {
    const [explanation, setExplanation] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const { t } = useTranslations();
    const { addInfoToast } = useContext(UserContext);

    useEffect(() => {
        const fetchExplanation = async () => {
            setIsLoading(true);
            setError('');
            try {
                const result = await getTopicExplanation(topic, level);
                setExplanation(result);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : t('explanation_error');
                setError(errorMessage);
                addInfoToast({ type: 'error', message: errorMessage });
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchExplanation();
    }, [topic, level, t, addInfoToast]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4 text-center animate-fade-in">
                <SpinnerIcon className="w-16 h-16 text-primary-400 animate-spin" />
                <h2 className="text-2xl font-bold text-white mt-6 mb-4">{t('explanation_loading')}</h2>
            </div>
        );
    }
    
    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in">
             <Card className="p-6 md:p-8 text-center">
                 <LightbulbIcon className="w-12 h-12 mx-auto text-amber-400 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">{t('explanation_title')}</h2>
                <p className="text-slate-300 mb-6">{t('explanation_subtitle')}</p>
                
                {error ? (
                    <div className="bg-red-900/50 text-red-300 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                ) : (
                    <div className="bg-slate-700/50 p-6 rounded-lg mb-6 border border-slate-600">
                        <p className="text-lg text-slate-200">{explanation}</p>
                    </div>
                )}
                
                <Button onClick={onContinue} size="lg">
                    {t('explanation_start_quiz')}
                </Button>
            </Card>
        </div>
    );
};

export default PreQuizExplanation;
