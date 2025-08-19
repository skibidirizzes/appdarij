import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../../context/UserContext.tsx';
import Card from '../common/Card.tsx';
import { useTranslations } from '../../hooks/useTranslations.ts';
import RadialProgress from './RadialProgress.tsx';
import { TrophyIcon } from '../icons/index.ts';

const useCountUp = (end: number, duration: number = 1500) => {
    const [count, setCount] = useState(0);
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);

    useEffect(() => {
        let frame = 0;
        const counter = setInterval(() => {
            frame++;
            const progress = (frame / totalFrames);
            const currentCount = Math.round(end * progress);
            setCount(currentCount);

            if (frame === totalFrames) {
                clearInterval(counter);
                setCount(end); // Ensure it ends on the exact number
            }
        }, frameRate);

        return () => clearInterval(counter);
    }, [end, duration, totalFrames]);

    return count;
};

const StatCard: React.FC<{ label: string, value: string | number, children?: React.ReactNode, className?: string }> = ({ label, value, children, className = '' }) => (
    <Card className={`p-4 text-center card-lift-hover ${className}`}>
        <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
        <p className="text-3xl font-bold text-primary-400 my-2">{value}</p>
        {children}
    </Card>
);

const HeaderStats: React.FC = () => {
    const { user } = useContext(UserContext);
    const { t } = useTranslations();
    
    if (!user) return null;
    
    const animatedScore = useCountUp(user.score);
    const animatedStreak = useCountUp(user.streak);

    const accuracy = user.questionsAnswered > 0 ? (user.correctAnswers / user.questionsAnswered) * 100 : 0;
    const animatedAccuracy = useCountUp(accuracy);
    const dailyProgress = user.settings.dailyGoal > 0 ? (user.dailyXp / user.settings.dailyGoal) * 100 : 0;
    
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="col-span-2 p-4 flex items-center gap-4 card-lift-hover">
                <RadialProgress progress={dailyProgress} />
                <div className="flex-1">
                    <p className="text-lg font-bold text-[var(--color-text-base)]">{t('home_stats_daily_xp')}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{user.dailyXp} / {user.settings.dailyGoal} {t('leaderboard_score_header')}</p>
                </div>
            </Card>
            <StatCard label={t('home_stats_total_score')} value={animatedScore.toLocaleString()}>
                <TrophyIcon className="w-5 h-5 mx-auto text-amber-400" />
            </StatCard>
            <StatCard label={t('home_stats_streak')} value={animatedStreak}>
                <span className="text-xl">🔥</span>
            </StatCard>
            <StatCard label={t('home_stats_accuracy')} value={`${animatedAccuracy.toFixed(0)}%`} className="col-span-2 md:col-span-1">
                 <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                    <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${accuracy}%` }}></div>
                </div>
            </StatCard>
            <StatCard label={"Quizzes"} value={user.quizzesCompleted} className="col-span-2 md:col-span-1">
                <p className="text-xs text-slate-500">Completed</p>
            </StatCard>
        </div>
    );
};

export default HeaderStats;