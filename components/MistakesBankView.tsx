import React, { useState, useContext, useMemo, useEffect } from 'react';
import { UserContext } from '../context/UserContext.tsx';
import { analyzeMistakes } from '../services/geminiService.ts';
import Button from './common/Button.tsx';
import Card from './common/Card.tsx';
import { ClipboardListIcon, CheckCircleIcon, XCircleIcon, SpinnerIcon } from './icons/index.ts';
import { Quiz, ScriptMode } from '../types.ts';
import { QUIZ_LENGTH } from '../constants.ts';
import { useTranslations } from '../hooks/useTranslations.ts';

interface MistakesBankViewProps {
    onStartCustomQuiz: (quiz: Quiz) => void;
}

const MistakesBankView: React.FC<MistakesBankViewProps> = ({ onStartCustomQuiz }) => {
    const { user, clearMistakes, addInfoToast } = useContext(UserContext);
    const { scriptMode } = user.settings;
    const { t } = useTranslations();
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const uniqueMistakes = useMemo(() => {
        const seen = new Set<string>();
        return user.mistakes.filter(mistake => {
            const id = mistake.question.id;
            if (seen.has(id)) {
                return false;
            } else {
                seen.add(id);
                return true;
            }
        }).reverse();
    }, [user.mistakes]);

    useEffect(() => {
        if (uniqueMistakes.length > 0) {
            setIsLoading(true);
            analyzeMistakes(uniqueMistakes)
                .then(setAnalysis)
                .catch(error => {
                    const errorMessage = error instanceof Error ? error.message : t('mistakes_analysis_error');
                    setAnalysis(errorMessage);
                    addInfoToast({ type: 'error', message: errorMessage });
                    console.error(error);
                })
                .finally(() => setIsLoading(false));
        } else {
            setAnalysis(t('mistakes_feedback_description'));
            setIsLoading(false);
        }
    }, [uniqueMistakes, t, addInfoToast]);

    const handleStartPersonalizedQuiz = () => {
        if (user.mistakes.length === 0) return;

        const shuffledMistakes = [...user.mistakes].sort(() => Math.random() - 0.5);
        const reviewQuiz = shuffledMistakes.slice(0, QUIZ_LENGTH).map(mistake => mistake.question);
        
        onStartCustomQuiz(reviewQuiz);
    };

    return (
        <div className="w-full animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">{t('mistakes_title')}</h2>
                <p className="text-primary-300 font-semibold mt-2">{t('mistakes_no_mistakes_yet')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left Column */}
                <div className="space-y-8">
                    <Card className="p-6 card-lift-hover">
                        <h3 className="text-xl font-bold text-white mb-2">{t('mistakes_feedback_title')}</h3>
                        {isLoading ? (
                            <div className="mt-4 p-4 bg-slate-700/50 rounded-lg flex items-center gap-3">
                                <SpinnerIcon className="w-5 h-5 animate-spin" />
                                <span className="text-slate-300">{t('mistakes_analyzing_button')}</span>
                            </div>
                        ) : (
                            <p className="text-slate-300 whitespace-pre-wrap">{analysis}</p>
                        )}
                    </Card>

                    <Card className="p-6 card-lift-hover">
                        <h3 className="text-xl font-bold text-white mb-2">{t('mistakes_practice_title')}</h3>
                        <p className="text-slate-400 mb-4 text-sm">{t('mistakes_practice_description')}</p>
                        <Button onClick={handleStartPersonalizedQuiz} disabled={user.mistakes.length === 0}>
                            {t('mistakes_start_review_quiz_button')}
                        </Button>
                    </Card>
                </div>

                {/* Right Column */}
                <Card className="p-6 card-lift-hover h-full flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-4 text-center">{t('mistakes_history_title')}</h3>
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <img 
                            src="https://ouch-cdn2.icons8.com/s8a_C2_wtdP35F5Q1b_L2oTS32t34iCj4g244-6v9bU/rs:fit:456:456/czM6Ly9pY29uczgu/b3VjaC1wcm9kLmFz/c2V0cy9wbmcvNDE3/LzM5Y2RjMDBlLTI5/MDYtNGM5Ni1iYjYw/LWRjY2MyMTI1MTQw/OS5wbmc.png"
                            alt="Cute comet mascot"
                            className="w-40 h-40 animate-float-comet"
                        />
                        <p className="font-bold text-white text-lg mt-4">{t('mistakes_no_mistakes_logged')}</p>
                    </div>
                </Card>
            </div>
            
             {uniqueMistakes.length > 0 && (
                 <div className="mt-8 text-center">
                    <Button onClick={clearMistakes} variant="secondary" className="bg-red-900/50 hover:bg-red-800/60 text-red-300">{t('mistakes_clear_all_button')}</Button>
                 </div>
             )}
        </div>
    );
};

export default MistakesBankView;