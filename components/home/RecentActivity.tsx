import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext.tsx';
import { useTranslations } from '../../hooks/useTranslations.ts';
import { ACHIEVEMENTS } from '../../constants.ts';
import { TranslationKey } from '../../localization/translations.ts';
import { UserProfile } from '../../types.ts';

interface RecentActivityProps {
    userProfile?: UserProfile;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ userProfile }) => {
    const { user: currentUser } = useContext(UserContext);
    const { t } = useTranslations();

    const user = userProfile || currentUser;
    if (!user) return null;

    const recentAchievements = user.unlockedAchievements.slice(-4).reverse();

    if (recentAchievements.length === 0) {
        return <p className="text-center text-sm text-slate-400 py-4">{t('home_no_recent_activity')}</p>;
    }

    return (
        <div className="space-y-3">
            {recentAchievements.map(id => {
                const achievement = ACHIEVEMENTS[id];
                if (!achievement) return null;
                
                const nameKey = `achievement_${id}_name` as TranslationKey;

                return (
                    <div key={id} className="flex items-center gap-4 p-2 bg-slate-800/50 rounded-lg">
                        <span className="text-3xl">{achievement.icon}</span>
                        <div>
                            <p className="font-semibold text-amber-300">{t('toast_achievement_unlocked')}</p>
                            <p className="text-sm text-slate-300">{t(nameKey)}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default RecentActivity;