import React, { useState, useContext, useMemo, useEffect } from 'react';
import { UserContext } from '../context/UserContext.tsx';
import { analyzeMistakes } from '../services/geminiService.ts';
import Button from './common/Button.tsx';
import Card from './common/Card.tsx';
import { ClipboardListIcon, CheckCircleIcon, XCircleIcon, SpinnerIcon } from './icons/index.ts';
import { QuizQuestion, Quiz, ScriptMode, SentenceFormationQuestion, WritingQuestion, SpeakingQuestion } from '../types.ts';
import { QUIZ_LENGTH } from '../constants.ts';
import { useTranslations } from '../hooks/useTranslations.ts';

interface MistakesBankViewProps {
    onStartCustomQuiz: (quiz: Quiz) => void;
}

const DarijaText: React.FC<{ text: { latin: string; arabic: string; }; scriptMode: ScriptMode; className?: string; isCorrect?: boolean; }> = ({ text, scriptMode, className }) => {
  if (scriptMode === 'arabic') {
    return <span className={`font-arabic text-xl ${className}`}>{text.arabic}</span>;
  }
  if (scriptMode === 'latin') {
    return <span className={className}>{text.latin}</span>;
  }
  // both
  return (
    <span className={className}>
      {text.latin}{' '}
      <span className="font-arabic text-slate-400">({text.arabic})</span>
    </span>
  );
};


const MistakesBankView: React.FC<MistakesBankViewProps> = ({ onStartCustomQuiz }) => {
    const { user, clearMistakes, addInfoToast } = useContext(UserContext);
    const { scriptMode } = user.settings;
    const { t } = useTranslations();
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user.mistakes.length > 0) {
            setIsLoading(true);
            analyzeMistakes(user.mistakes)
                .then(setAnalysis)
                .catch(error => {
                    const errorMessage = error instanceof Error ? error.message : t('mistakes_analysis_error');
                    setAnalysis(errorMessage);
                    addInfoToast({ type: 'error', message: errorMessage });
                    console.error(error);
                })
                .finally(() => setIsLoading(false));
        } else {
            setAnalysis(t('mistakes_no_mistakes_yet'));
            setIsLoading(false);
        }
    }, [user.mistakes, t, addInfoToast]);

    const handleStartPersonalizedQuiz = () => {
        if (user.mistakes.length === 0) return;

        const shuffledMistakes = [...user.mistakes].sort(() => Math.random() - 0.5);
        const reviewQuiz = shuffledMistakes.slice(0, QUIZ_LENGTH).map(mistake => mistake.question);
        
        onStartCustomQuiz(reviewQuiz);
    };

    const renderMistake = (q: QuizQuestion, userAnswer: any) => {
        let displayAnswer = '';
        if (q.type === 'multiple-choice') {
            const answerOption = typeof userAnswer === 'number' ? q.options[userAnswer] : { latin: t('quiz_not_answered'), arabic: t('quiz_not_answered') };
            displayAnswer = scriptMode === 'arabic' ? answerOption.arabic : answerOption.latin;
        } else if (Array.isArray(userAnswer)) {
            displayAnswer = userAnswer.join(' ');
        } else {
            displayAnswer = typeof userAnswer === 'string' ? userAnswer : t('quiz_skipped_answer');
        }
        
        const CorrectAnswerDisplay = () => {
            if (q.type === 'sentence-formation') {
                const text = q.correctSentence.join(' ');
                return <span className="font-semibold">{text}</span>;
            }
            const correctAnswer = q.type === 'multiple-choice'
                ? q.options[q.correctAnswerIndex]
                : (q as WritingQuestion | SpeakingQuestion).correctAnswer;
            return <span className="font-semibold"><DarijaText text={correctAnswer} scriptMode={scriptMode} /></span>;
        };

        return (
             <div className="p-3 rounded-lg bg-slate-900/50 my-2">
                <div className="flex items-center gap-3">
                    <XCircleIcon className="w-6 h-6 text-red-400 flex-shrink-0"/>
                    <p className="text-white">{t('quiz_your_answer_label')} <span className={`font-semibold ${scriptMode !== 'latin' && (q.type === 'writing' || q.type === 'speaking') ? 'font-arabic text-xl': ''}`}>{displayAnswer}</span></p>
                </div>
                 <div className="flex items-center gap-3 mt-2">
                    <CheckCircleIcon className="w-6 h-6 text-emerald-400 flex-shrink-0"/>
                    <p className="text-white">{t('quiz_correct_answer_label')} <CorrectAnswerDisplay /></p>
                </div>
            </div>
        );
    };

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

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">{t('mistakes_title')}</h2>
                <p className="text-primary-300 font-semibold mt-2">{t('mistakes_count', { count: uniqueMistakes.length })}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><ClipboardListIcon className="w-6 h-6 text-primary-400" />{t('mistakes_feedback_title')}</h3>
                        <p className="text-slate-400 mb-4 text-sm">{t('mistakes_feedback_description')}</p>
                        {isLoading ? (
                             <div className="mt-4 p-4 bg-slate-700/50 rounded-lg flex items-center gap-3">
                                <SpinnerIcon className="w-5 h-5 animate-spin" />
                                <span className="text-slate-300">{t('mistakes_analyzing_button')}</span>
                            </div>
                        ) : analysis && (
                            <div className="mt-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                                <p className="text-slate-200 whitespace-pre-wrap">{analysis}</p>
                            </div>
                        )}
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-xl font-bold text-white mb-2">{t('mistakes_practice_title')}</h3>
                        <p className="text-slate-400 mb-4 text-sm">{t('mistakes_practice_description')}</p>
                        <Button onClick={handleStartPersonalizedQuiz} disabled={user.mistakes.length === 0}>
                            {t('mistakes_start_review_quiz_button')}
                        </Button>
                    </Card>
                </div>

                <div className="lg:col-span-3">
                     <h3 className="text-2xl font-bold text-white mb-4 text-center lg:text-left">{t('mistakes_history_title')}</h3>
                    {uniqueMistakes.length > 0 ? (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {uniqueMistakes.map((mistake, index) => (
                            <Card key={`${mistake.question.id}-${index}`} className="p-5">
                                <p className="text-slate-300 font-medium mb-2">{mistake.question.question}</p>
                                {renderMistake(mistake.question, mistake.userAnswer)}
                            </Card>
                        ))}
                        </div>
                    ) : (
                        <Card className="p-8 text-center h-full flex items-center justify-center">
                            <p className="text-slate-300">{t('mistakes_no_mistakes_logged')}</p>
                        </Card>
                    )}
                </div>
            </div>
            
            <div className="mt-8 text-center">
                {uniqueMistakes.length > 0 && <Button onClick={clearMistakes} className="bg-red-600/80 hover:bg-red-600">{t('mistakes_clear_all_button')}</Button>}
            </div>
        </div>
    );
};

export default MistakesBankView;