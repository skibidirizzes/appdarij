import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext.tsx';
import { ACHIEVEMENTS, LEARNING_TOPICS } from '../constants.ts';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import { useTranslations } from '../hooks/useTranslations.ts';
import { TranslationKey } from '../localization/translations.ts';
import { LearningTopic } from '../types.ts';

const AchievementsView: React.FC = () => {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const { t } = useTranslations();
    const unlockedCount = user.unlockedAchievements.length;
    const totalCount = Object.keys(ACHIEVEMENTS).length;
    const progressPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;
    
    const handleStartFirstQuiz = () => {
        const firstTopic = LEARNING_TOPICS[0].name;
        navigate('/quiz', { state: { topic: firstTopic, level: 1 } });
    }

    if (unlockedCount === 0) {
        return (
            <div className="w-full text-center">
                 <h2 className="text-3xl font-bold text-white mb-4">{t('achievements_title')}</h2>
                 <Card className="max-w-md mx-auto p-8 card-lift-hover">
                     <div className="text-6xl mb-4">🏆</div>
                     <h3 className="text-xl font-bold text-white">{t('achievements_empty_title')}</h3>
                     <p className="text-slate-300 my-4">{t('achievements_empty_description')}</p>
                     <Button onClick={handleStartFirstQuiz}>{t('achievements_empty_button')}</Button>
                 </Card>
            </div>
        )
    }

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">{t('achievements_title')}</h2>
                <p className="text-primary-300 font-semibold mt-2">{t('achievements_unlocked_count', { unlocked: unlockedCount, total: totalCount })}</p>
                <div className="w-full max-w-md mx-auto bg-slate-700 rounded-full h-2.5 mt-4">
                    <div 
                        className="bg-primary-500 h-2.5 rounded-full" 
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Object.values(ACHIEVEMENTS).map(ach => {
                    const isUnlocked = user.unlockedAchievements.includes(ach.id);
                    const nameKey: TranslationKey = `achievement_${ach.id}_name`;
                    const descKey: TranslationKey = `achievement_${ach.id}_description`;

                    return (
                        <Card 
                            key={ach.id} 
                            className={`transition-all duration-300 flex card-lift-hover ${isUnlocked ? 'bg-gradient-to-br from-amber-900/40 via-slate-800/50 to-slate-800/50 border-amber-600/50' : 'opacity-60 bg-slate-800/30'}`}
                        >
                            <div className="p-5 flex items-center gap-5">
                                <div className={`text-4xl transition-transform duration-500 ${isUnlocked ? 'scale-110 filter grayscale-0' : 'scale-100 filter grayscale'}`}>{ach.icon}</div>
                                <div className="flex-1">
                                    <h3 className={`font-bold ${isUnlocked ? 'text-amber-300' : 'text-slate-300'}`}>{t(nameKey)}</h3>
                                    <p className="text-sm text-slate-400">{t(descKey)}</p>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default AchievementsView;