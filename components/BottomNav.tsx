import React, { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslations } from '../hooks/useTranslations.ts';
import { 
    BookOpenIcon, TrophyIcon, GearIcon, ClipboardListIcon, LibraryIcon, 
    ChatBubbleIcon, LeaderboardIcon, UserGroupIcon, MapPinIcon, 
    SoundWaveIcon, CommunityIcon, FlaskIcon, ShieldCheckIcon, 
    SwordIcon, RootIcon, DumbbellIcon 
} from './icons/index.ts';
import { UserContext } from '../context/UserContext.tsx';

interface NavItemProps {
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    label: string;
    isActive: boolean;
    onClick: () => void;
    hasNotification?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, isActive, onClick, hasNotification }) => (
    <button
        onClick={onClick}
        className={`relative flex flex-col items-center justify-center flex-shrink-0 min-w-[80px] h-full px-2 pt-2 pb-1 transition-colors duration-200 ${
            isActive ? 'text-primary-400' : 'text-slate-400 hover:text-white'
        }`}
        aria-label={label}
    >
        <div className={`relative w-8 h-8 flex items-center justify-center mb-1 rounded-full ${isActive ? 'bg-primary-500/20' : ''}`}>
            <Icon className="w-6 h-6" />
            {hasNotification && (
                <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-800" />
            )}
        </div>
        <span className={`text-xs mt-0.5 whitespace-nowrap ${isActive ? 'font-bold' : ''}`}>{label}</span>
    </button>
);

const BottomNav: React.FC = () => {
    const { t } = useTranslations();
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();
    
    const isParentalLinkActive = user?.childAccountIds?.length > 0 || !!user?.parentAccountId;
    
    const navItems = [
        { path: '/dashboard', label: t('nav_dashboard'), icon: BookOpenIcon },
        { path: '/mastery', label: "Mastery", icon: DumbbellIcon },
        { path: '/mistakes-bank', label: "Mistakes", icon: ClipboardListIcon },
        { path: '/conversation', label: t('nav_conversation'), icon: ChatBubbleIcon },
        { path: '/phoneme-practice', label: t('nav_phoneme_practice'), icon: SoundWaveIcon },
        { path: '/friends', label: t('nav_friends'), icon: UserGroupIcon },
        { path: '/leaderboard', label: t('nav_leaderboard'), icon: LeaderboardIcon },
        { path: '/duel-setup', label: "Duels", icon: SwordIcon },
        { path: '/achievements', label: t('nav_achievements'), icon: TrophyIcon },
        ...(isParentalLinkActive ? [{ path: '/parental-controls', label: t('nav_parental_controls'), icon: ShieldCheckIcon, notification: true }] : []),
        { path: '/dictionary', label: t('nav_dictionary'), icon: LibraryIcon },
        { path: '/triliteral-root', label: t('nav_triliteral_root'), icon: RootIcon },
        { path: '/settings', label: t('nav_settings'), icon: GearIcon },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-slate-800/80 backdrop-blur-lg border-t border-slate-700/50 flex justify-center z-20">
            <div className="flex items-center overflow-x-auto whitespace-nowrap px-2 scrollbar-hide">
                {navItems.map((item) => (
                    <NavItem
                        key={item.path}
                        label={item.label}
                        icon={item.icon}
                        isActive={location.pathname === item.path}
                        onClick={() => navigate(item.path)}
                        hasNotification={'notification' in item && item.notification}
                    />
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;