import React from 'react';
import { QuizQuestion, UserAnswer, ScriptMode, SentenceFormationQuestion, WritingQuestion, SpeakingQuestion, MultipleChoiceQuestion } from '../../types.ts';
import Button from '../common/Button.tsx';
import { CheckCircleIcon, XCircleIcon } from '../icons/index.ts';
import { useTranslations } from '../../hooks/useTranslations.ts';
import SpeakButton from '../common/SpeakButton.tsx';

interface QuizFeedbackBannerProps {
    result: 'correct' | 'incorrect';
    question: QuizQuestion;
    userAnswer: UserAnswer;
    onNext: () => void;
    isLastQuestion: boolean;
    scriptMode: ScriptMode;
}

const QuizFeedbackBanner: React.FC<QuizFeedbackBannerProps> = ({ result, question, onNext, isLastQuestion, scriptMode }) => {
    const { t } = useTranslations();
    const isCorrect = result === 'correct';

    const getCorrectAnswerText = (): {text: string, speakable: string} => {
        let correctAnswer: { latin: string; arabic: string; };
        let correctSentenceText: string | null = null;
        let correctSentenceArabic: string | null = null; // Assume we don't have this for now

        if (question.type === 'sentence-formation') {
            correctSentenceText = question.correctSentence.join(' ');
        } else {
            correctAnswer = question.type === 'multiple-choice'
                ? question.options[question.correctAnswerIndex]
                : (question as WritingQuestion | SpeakingQuestion).correctAnswer;
        }
        
        const speakable = correctSentenceArabic || (correctAnswer!?.arabic) || correctSentenceText || (correctAnswer!?.latin);
        
        let text = '';
        if (correctSentenceText) {
            text = correctSentenceText;
        } else {
            if (scriptMode === 'arabic') text = correctAnswer!.arabic;
            else if (scriptMode === 'latin') text = correctAnswer!.latin;
            else text = `${correctAnswer!.latin} (${correctAnswer!.arabic})`;
        }

        return { text, speakable };
    };
    
    const { text: correctAnswerText, speakable: speakableText } = getCorrectAnswerText();
    
    return (
        <div className={`fixed bottom-0 left-0 right-0 z-30 animate-slide-up-fade-in`}>
             <div className={`${isCorrect ? 'bg-emerald-800' : 'bg-red-800'}`}>
                <div className="max-w-4xl mx-auto p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {isCorrect ? <CheckCircleIcon className="w-8 h-8 text-white flex-shrink-0" /> : <XCircleIcon className="w-8 h-8 text-white flex-shrink-0" />}
                        <div>
                             <h3 className="text-xl font-bold text-white">
                                {isCorrect ? 'Correct!' : 'Incorrect'}
                            </h3>
                            {!isCorrect && (
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-slate-200">{t('quiz_correct_answer_label')} <span className="font-semibold">{correctAnswerText}</span></p>
                                    <SpeakButton textToSpeak={speakableText} />
                                </div>
                            )}
                        </div>
                    </div>
                     <Button 
                        onClick={onNext} 
                        size="lg" 
                        className={`w-full sm:w-auto flex-shrink-0 ${isCorrect ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        {isLastQuestion ? t('button_finish_quiz') : t('button_next_question')}
                    </Button>
                </div>
             </div>
        </div>
    );
};

export default QuizFeedbackBanner;