import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext.tsx';
import { useTranslations } from '../../hooks/useTranslations.ts';
import { TranslationKey } from '../../localization/translations.ts';
import { QuestType } from '../../types.ts';
import { DumbbellIcon, TrophyIcon, VocabularyIcon, CheckCircleIcon } from '../icons/index.ts';

const QuestIcons: Record<QuestType, React.FC<React.SVGProps<SVGSVGElement>>> = {
    'complete_quiz': DumbbellIcon,
    'perfect_score': TrophyIcon,
    'learn_words': VocabularyIcon,
};

const WeeklyQuests: React.FC = () => {
    const { user } = useContext(UserContext);
    const { t } = useTranslations();

    if (!user || !user.activeQuests || user.activeQuests.length === 0) {
        return <p className="text-center text-sm text-slate-400 py-4">{t('home_weekly_quests_description')}</p>;
    }

    return (
        <div className="space-y-3">
            {user.activeQuests.map(quest => {
                const progress = quest.isCompleted ? 100 : Math.min(100, (quest.currentValue / quest.targetValue) * 100);
                const descriptionKey = quest.descriptionKey as TranslationKey;
                const Icon = QuestIcons[quest.type];
                
                return (
                     <div key={quest.id} className={`p-3 rounded-lg flex items-center gap-4 transition-colors ${quest.isCompleted ? 'bg-emerald-900/50' : 'bg-slate-800/50'}`}>
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${quest.isCompleted ? 'bg-emerald-500' : 'bg-primary-900/50'}`}>
                           <Icon className={`w-6 h-6 ${quest.isCompleted ? 'text-white' : 'text-primary-300'}`} />
                        </div>
                        <div className="flex-grow">
                            <p className={`text-sm font-medium ${quest.isCompleted ? 'text-emerald-300' : 'text-[var(--color-text-base)]'}`}>
                                {t(descriptionKey)}
                            </p>
                             <div className="w-full bg-[var(--color-bg-input)] rounded-full h-2.5 mt-1">
                                <div 
                                    className={`h-2.5 rounded-full transition-all duration-500 ${quest.isCompleted ? 'bg-emerald-500' : 'bg-primary-500'}`}
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="text-center w-16 flex-shrink-0">
                           {quest.isCompleted ? (
                               <CheckCircleIcon className="w-7 h-7 text-emerald-400 mx-auto" />
                           ) : (
                            <>
                                <p className="font-bold text-primary-300">+{quest.xpReward}</p>
                                <p className="text-xs text-[var(--color-text-muted)]">DH</p>
                            </>
                           )}
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

export default WeeklyQuests;