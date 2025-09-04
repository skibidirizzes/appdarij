import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../context/UserContext.tsx';
import { Achievement, AchievementID } from '../types.ts';
import { useTranslations } from '../hooks/useTranslations.ts';
import { TranslationKey } from '../localization/translations.ts';
import { ShareIcon } from './icons/index.ts';

interface ToastProps { 
    achievement: Omit<Achievement, 'name' | 'description'>;
    onDismiss: () => void 
}

const AchievementToast: React.FC<ToastProps> = ({ achievement, onDismiss }) => {
    const { t } = useTranslations();
    const { addInfoToast } = useContext(UserContext);
    
    useEffect(() => {
        const timer = setTimeout(onDismiss, 5000); // 5 seconds
        return () => clearTimeout(timer);
    }, [onDismiss]);
    
    const nameKey: TranslationKey = `achievement_${achievement.id}_name` as TranslationKey;
    const achievementName = t(nameKey);

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!navigator.share) {
            addInfoToast({ type: 'warning', message: 'Sharing is not supported on your browser.' });
            return;
        }
        
        const shareData = {
            title: 'New LearnDarija Achievement!',
            text: `I just unlocked the "${achievementName}" achievement in LearnDarija! Come learn Moroccan Arabic with me! 🇲🇦 #LearnDarija`,
            url: window.location.origin,
        };

        try {
            navigator.share(shareData).catch((err) => {
                if (err.name !== 'AbortError') {
                    console.error("Share failed:", err);
                    addInfoToast({ type: 'error', message: 'Could not share achievement.' });
                }
           });
        } catch (err) {
            console.error("Share failed:", err);
            addInfoToast({ type: 'error', message: 'Could not share achievement.' });
        }
    };


    return (
        <div 
            className="fixed bottom-5 right-5 w-80 bg-slate-800 border-2 border-amber-400 rounded-xl shadow-2xl p-4 flex items-center gap-4 z-50 animate-fade-in-up"
            role="alert"
            aria-live="assertive"
        >
            <div className="text-4xl">{achievement.icon}</div>
            <div className="flex-1">
                <h3 className="font-bold text-amber-300">{t('toast_achievement_unlocked')}</h3>
                <p className="text-slate-200 text-sm">{achievementName}</p>
            </div>
             {navigator.share && (
                <button onClick={handleShare} className="p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label="Share achievement">
                    <ShareIcon className="w-5 h-5 text-slate-300" />
                </button>
            )}
            <button onClick={onDismiss} className="absolute top-2 right-2 text-slate-500 hover:text-white">&times;</button>
        </div>
    );
};

const AchievementToastContainer: React.FC = () => {
    const { newlyUnlockedAchievements, clearNewlyUnlockedAchievements } = useContext(UserContext);
    const [visibleToasts, setVisibleToasts] = useState<Omit<Achievement, 'name' | 'description'>[]>([]);

    useEffect(() => {
        if (newlyUnlockedAchievements.length > 0) {
            setVisibleToasts(newlyUnlockedAchievements);
        }
    }, [newlyUnlockedAchievements]);

    const handleDismiss = (id: string) => {
        setVisibleToasts(prev => prev.filter(a => a.id !== id));
        // Once all are dismissed from view, clear the source
        if (visibleToasts.length === 1) {
            clearNewlyUnlockedAchievements();
        }
    };

    if (visibleToasts.length === 0) {
        return null;
    }

    // Display one toast at a time for simplicity
    const currentToast = visibleToasts[0];

    return (
        <AchievementToast 
            key={currentToast.id} 
            achievement={currentToast} 
            onDismiss={() => handleDismiss(currentToast.id)}
        />
    );
};

export default AchievementToastContainer;