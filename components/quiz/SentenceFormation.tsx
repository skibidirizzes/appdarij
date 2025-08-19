import React, { useState, useEffect } from 'react';
import { SentenceFormationQuestion, UserAnswer } from '../../types.ts';
import Button from '../common/Button.tsx';
import { CheckCircleIcon, XCircleIcon } from '../icons/index.ts';
import { useTranslations } from '../../hooks/useTranslations.ts';

interface SentenceFormationProps {
    question: SentenceFormationQuestion;
    onAnswer: (answer: UserAnswer) => void;
    isAnswered: boolean;
    userAnswer: UserAnswer;
}

const SentenceFormation: React.FC<SentenceFormationProps> = ({ question, onAnswer, isAnswered, userAnswer }) => {
    const [wordBank, setWordBank] = useState<string[]>([]);
    const [sentence, setSentence] = useState<string[]>([]);
    const { t } = useTranslations();

    useEffect(() => {
        // Only set the word bank once when the question changes
        setWordBank(question.wordBank);
        setSentence([]);
    }, [question]);

    const handleWordBankClick = (word: string, index: number) => {
        if (isAnswered) return;
        setSentence(prev => [...prev, word]);
        setWordBank(prev => prev.filter((_, i) => i !== index));
    };

    const handleSentenceClick = (word: string, index: number) => {
        if (isAnswered) return;
        setWordBank(prev => [...prev, word]);
        setSentence(prev => prev.filter((_, i) => i !== index));
    };
    
    const finalAnswer = (userAnswer as string[]) || [];
    const isCorrect = question.correctSentence.join(' ') === finalAnswer.join(' ');
    
    const WordTile: React.FC<{ word: string, onClick: () => void, disabled: boolean }> = ({ word, onClick, disabled }) => {
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className={`px-4 py-2 rounded-lg font-semibold text-lg transition-all duration-200 transform ${disabled ? '' : 'hover:scale-105 bg-slate-700 hover:bg-slate-600' }`}
            >
                {word}
            </button>
        );
    };

    return (
        <div className="space-y-6">
            {/* Sentence Area */}
            <div className="min-h-[6rem] bg-[var(--color-input-bg)] p-3 rounded-lg border-2 border-dashed border-slate-600 flex flex-wrap items-center gap-3">
                {sentence.map((word, index) => (
                    <WordTile 
                        key={`${word}-${index}`}
                        word={word}
                        onClick={() => handleSentenceClick(word, index)}
                        disabled={isAnswered}
                    />
                ))}
            </div>

            {/* Word Bank */}
             <div className="min-h-[6rem] p-3 rounded-lg flex flex-wrap items-center justify-center gap-3">
                 {wordBank.map((word, index) => (
                    <WordTile 
                        key={`${word}-${index}`}
                        word={word}
                        onClick={() => handleWordBankClick(word, index)}
                        disabled={isAnswered}
                    />
                ))}
            </div>

            <div className="flex justify-between items-center mt-4">
                <Button onClick={() => onAnswer('idk')} disabled={isAnswered} className="bg-slate-600 hover:bg-slate-500">
                    {t('button_idk')}
                </Button>
                <Button onClick={() => onAnswer(sentence)} disabled={isAnswered || sentence.length === 0}>
                    {t('button_next')}
                </Button>
            </div>
        </div>
    );
};

export default SentenceFormation;