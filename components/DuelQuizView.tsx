import React, { useState, useEffect, useContext } from 'react';
// FIX: Import router hooks to manage state and navigation internally.
import { useLocation, useNavigate } from 'react-router-dom';
import { Quiz, LearningTopic, Friend } from '../types.ts';
import { generateQuiz } from '../services/geminiService.ts';
import { UserContext } from '../context/UserContext.tsx';
import QuizView from './QuizView.tsx'; // Re-using the core quiz component
import Card from './common/Card.tsx';
import { SwordIcon, SpinnerIcon } from './icons/index.ts';
// FIX: Import the Button component to resolve the 'Cannot find name' error.
import Button from './common/Button.tsx';

// FIX: Remove props and use hooks instead.
interface DuelQuizViewProps {}

const ProgressBar: React.FC<{ progress: number, name: string, photoURL: string, isOpponent?: boolean }> = ({ progress, name, photoURL, isOpponent }) => (
    <div>
        <div className="flex items-center gap-3 mb-1">
            <img src={photoURL} alt={name} className="w-8 h-8 rounded-full" />
            <span className="font-semibold text-white">{name}</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-4">
            <div
                className={`h-4 rounded-full transition-all duration-500 ${isOpponent ? 'bg-red-500' : 'bg-primary-500'}`}
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    </div>
);


const DuelQuizView: React.FC<DuelQuizViewProps> = () => {
    const { user } = useContext(UserContext);
    const location = useLocation();
    const navigate = useNavigate();
    const { topic, opponent } = location.state || {} as { topic: LearningTopic, opponent: Friend };

    const [customQuiz, setCustomQuiz] = useState<Quiz | null>(null);
    const [playerScore, setPlayerScore] = useState(0);
    const [opponentProgress, setOpponentProgress] = useState(0);

    const playerProgress = customQuiz ? (playerScore / customQuiz.length) * 100 : 0;

    const onQuizFinish = () => navigate('/dashboard');

    // This effect runs once to generate the quiz for the duel
    useEffect(() => {
        if (!topic) return;
        const createDuelQuiz = async () => {
            const quiz = await generateQuiz(topic, 10); // Duels have 10 questions
            setCustomQuiz(quiz);
        };
        createDuelQuiz();
    }, [topic]);

    // This effect simulates the opponent's progress
    useEffect(() => {
        if (!customQuiz) return;

        const totalQuestions = customQuiz.length;
        const interval = setInterval(() => {
            setOpponentProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                // Opponent gets a question right every 3-6 seconds
                // They have about an 80% chance of getting it right to seem realistic
                const increment = (1 / totalQuestions) * 100 * (Math.random() > 0.2 ? 1 : 0);
                return Math.min(100, prev + increment);
            });
        }, 4500);

        return () => clearInterval(interval);
    }, [customQuiz]);

    const handleProgressUpdate = (answered: number, correct: number, total: number) => {
        setPlayerScore(correct);
    };

    if (!topic || !opponent) {
        return (
            <Card className="p-8 text-center">
                <h3 className="text-xl font-bold text-white">Duel not found</h3>
                <p className="text-slate-300 mt-2">Please set up a new duel from the duel setup page.</p>
                <Button onClick={() => navigate('/duel-setup')} className="mt-4">Back to Duel Setup</Button>
            </Card>
        );
    }

    return (
        <div className="w-full space-y-6">
            <Card className="p-4">
                <div className="flex items-center justify-center gap-4 text-2xl font-bold mb-4">
                    <SwordIcon className="w-8 h-8 text-primary-400" />
                    <h2 className="text-white">Duel Mode: {topic}</h2>
                </div>
                <div className="space-y-3">
                   <ProgressBar progress={playerProgress} name={user.displayName} photoURL={user.photoURL} />
                   <ProgressBar progress={opponentProgress} name={opponent.displayName} photoURL={opponent.photoURL} isOpponent />
                </div>
            </Card>

            {customQuiz ? (
                 <QuizView
                    customQuiz={customQuiz}
                    topic={topic}
                    onQuizFinish={onQuizFinish}
                    onProgressUpdate={handleProgressUpdate}
                />
            ) : (
                <div className="flex flex-col items-center justify-center p-8">
                    <SpinnerIcon className="w-10 h-10 animate-spin text-primary-400" />
                    <p className="mt-4 text-white">Generating Duel Arena...</p>
                </div>
            )}
        </div>
    );
};

export default DuelQuizView;