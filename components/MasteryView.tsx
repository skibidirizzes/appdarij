import React, { useContext, useMemo } from 'react';
import { UserContext } from '../context/UserContext.tsx';
import { useTranslations } from '../hooks/useTranslations.ts';
import Card from './common/Card.tsx';
import { DumbbellIcon } from './icons/index.ts';
import { Quiz, ScriptMode } from '../types.ts';

interface MasteryViewProps {
    onStartCustomQuiz: (quiz: Quiz, topic: string) => void;
}

const WordMasteryItem: React.FC<{ word: { latin: string; arabic: string; accuracy: number; }; scriptMode: ScriptMode }> = ({ word, scriptMode }) => {
    const isMastered = word.accuracy >= 100;
    
    return (
        <div className={`rounded-xl p-4 text-center border-2 flex flex-col justify-between h-32 card-lift-hover ${isMastered ? 'bg-amber-400/10 border-amber-500' : 'bg-[var(--color-bg-card)] border-[var(--color-border-card)]'}`}>
            <div>
                <p className={`font-arabic text-4xl font-bold truncate ${isMastered ? 'text-amber-300' : 'text-[var(--color-text-base)]'}`}>
                    {word.arabic}
                </p>
                <p className={`text-md -mt-1 truncate ${isMastered ? 'text-amber-600' : 'text-[var(--color-text-muted)]'}`}>
                    {word.latin}
                </p>
            </div>
            
            <div className="mt-2 h-3 w-full bg-[var(--color-bg-input)] border border-[var(--color-border-input)] rounded-full overflow-hidden relative" title={`Mastery: ${word.accuracy.toFixed(0)}%`}>
                <div 
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${word.accuracy}%` }}
                />
            </div>
        </div>
    );
};


const MasteryView: React.FC<MasteryViewProps> = ({ onStartCustomQuiz }) => {
    const { user } = useContext(UserContext);
    const { t } = useTranslations();

    const allWords = useMemo(() => {
        const stats: { [key: string]: { latin: string; arabic: string; seen: number; correct: number } } = {};
        user.wordHistory.forEach(entry => {
            const key = entry.latin.toLowerCase();
            if (!stats[key]) {
                stats[key] = { latin: entry.latin, arabic: entry.arabic, seen: 0, correct: 0 };
            }
            stats[key].seen++;
            if (entry.isCorrect) {
                stats[key].correct++;
            }
        });

        return Object.values(stats)
            .map(s => ({
                ...s,
                accuracy: s.seen > 0 ? (s.correct / s.seen) * 100 : 0,
            }))
            .sort((a, b) => a.accuracy - b.accuracy || a.latin.localeCompare(b.latin)); // Sort by accuracy, then alphabetically
            
    }, [user.wordHistory]);

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <DumbbellIcon className="w-12 h-12 mx-auto text-primary-400 mb-4" />
                <h2 className="text-3xl font-bold text-white">Word Mastery</h2>
                <p className="text-primary-300 font-semibold mt-2">Track your vocabulary knowledge word by word.</p>
            </div>

            {allWords.length > 0 ? (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {allWords.map(word => (
                        <WordMasteryItem key={word.latin} word={word} scriptMode={user.settings.scriptMode} />
                    ))}
                </div>
            ) : (
                <Card className="p-8 text-center text-slate-400 max-w-lg mx-auto card-lift-hover">
                    <h3 className="text-xl font-bold text-white">Your Word Bank is Empty</h3>
                    <p className="mt-2">As you complete Vocabulary quizzes, every new word you encounter will appear here. Keep practicing to build your mastery!</p>
                </Card>
            )}
        </div>
    );
};

export default MasteryView;