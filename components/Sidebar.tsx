import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext.tsx';
import { View } from '../types.ts';
import { useTranslations } from '../hooks/useTranslations.ts';
import { 
    BookOpenIcon, 
    TrophyIcon, 
    GearIcon, 
    ClipboardListIcon, 
    LibraryIcon, 
    ChevronLeftIcon, 
    ChevronRightIcon, 
    ChatBubbleIcon,
    LeaderboardIcon,
    UserGroupIcon,
    MapPinIcon, 
    SoundWaveIcon,
    CommunityIcon,
    FlaskIcon,
    ShieldCheckIcon,
    SwordIcon,
    SparklesIcon,
    RootIcon,
    DumbbellIcon
} from './icons/index.ts';

interface SidebarProps {
    currentView: View;
    onNavigate: (view: View | { name: View, params?: any }) => void;
    isCollapsed: boolean;
    onToggle: () => void;
}

const NavItem: React.FC<{
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    label: string;
    isActive: boolean;
    onClick: () => void;
    isCollapsed: boolean;
}> = ({ icon: Icon, label, isActive, onClick, isCollapsed }) => (
    <button
        onClick={onClick}
        title={isCollapsed ? label : ''}
        className={`flex items-center w-full py-3 rounded-lg transition-colors duration-200 ${isCollapsed ? 'px-3 justify-center' : 'px-4'} ${
            isActive
                ? 'bg-primary-500 text-on-primary font-semibold shadow-lg'
                : 'text-[var(--color-text-muted)] hover:bg-slate-700/50 hover:text-[var(--color-text-base)]'
        }`}
    >
        <Icon className={`w-6 h-6 transition-colors duration-200 flex-shrink-0 ${isActive ? 'text-on-primary' : 'text-primary-400 group-hover:text-primary-300'}`} />
        {!isCollapsed && <span className="flex-1 ml-4 whitespace-nowrap text-left">{label}</span>}
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isCollapsed, onToggle }) => {
    const { user } = useContext(UserContext);
    const { t } = useTranslations();
    
    const topNavItems = [
        { view: 'dashboard', label: t('nav_dashboard'), icon: BookOpenIcon },
        { view: 'dictionary', label: t('nav_dictionary'), icon: LibraryIcon },
        { view: 'conversation', label: t('nav_conversation'), icon: ChatBubbleIcon },
        { view: 'phoneme-practice', label: t('nav_phoneme_practice'), icon: SoundWaveIcon },
        { view: 'mastery', label: "Mastery", icon: DumbbellIcon },
    ] as const;

    const bottomNavItems = [
        { view: 'leaderboard', label: t('nav_leaderboard'), icon: LeaderboardIcon },
        { view: 'friends', label: t('nav_friends'), icon: UserGroupIcon },
        { view: 'mistakes-bank', label: "Mistakes Bank", icon: ClipboardListIcon },
        { view: 'achievements', label: t('nav_achievements'), icon: TrophyIcon },
        { view: 'triliteral-root', label: t('nav_triliteral_root'), icon: RootIcon },
        { view: 'duel-setup', label: "Duels", icon: SwordIcon },
    ] as const;

    if (!user) return null;

    return (
        <aside className={`fixed top-0 left-0 h-full bg-[var(--color-sidebar-bg)] backdrop-blur-lg border-r border-[var(--color-border-card)] flex flex-col z-20 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-24 p-3' : 'w-64 p-4'}`}>
            <div className={`flex items-center mb-8 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
                <img src="/vite.svg" alt="App Logo" className="h-8 w-8 flex-shrink-0" />
                {!isCollapsed && (
                    <h1 className="text-xl font-bold text-white tracking-tight ml-3 whitespace-nowrap overflow-hidden">
                        LearnDarija
                    </h1>
                )}
            </div>

            <nav className="flex-grow space-y-2 overflow-y-auto">
                 {topNavItems.map((item) => (
                    <NavItem
                        key={item.view}
                        label={item.label}
                        icon={item.icon}
                        isActive={currentView === item.view}
                        onClick={() => onNavigate(item.view)}
                        isCollapsed={isCollapsed}
                    />
                ))}
            </nav>

            <nav className="mt-4 pt-4 border-t border-[var(--color-border-card)] space-y-2">
                 {bottomNavItems.map((item) => (
                    <NavItem
                        key={item.view}
                        label={item.label}
                        icon={item.icon}
                        isActive={currentView === item.view}
                        onClick={() => onNavigate(item.view)}
                        isCollapsed={isCollapsed}
                    />
                ))}
                
                <NavItem
                    label={t('nav_settings')}
                    icon={GearIcon}
                    isActive={currentView === 'settings'}
                    onClick={() => onNavigate('settings')}
                    isCollapsed={isCollapsed}
                />
            </nav>

            <div className={`mt-4 pt-4 border-t border-[var(--color-border-card)]`}>
                 <button 
                    onClick={() => onNavigate({ name: 'profile', params: { userId: user.uid }})}
                    className={`flex items-center w-full p-2 rounded-lg text-left transition-colors hover:bg-slate-700/50 ${currentView === 'profile' ? 'bg-slate-700' : ''}`}
                >
                    <img src={user.photoURL} alt="Your profile" className="w-10 h-10 rounded-full flex-shrink-0" />
                    {!isCollapsed && (
                        <div className="ml-3 overflow-hidden">
                            <p className="font-semibold text-white truncate">{user.displayName}</p>
                            <p className="text-xs text-amber-400">{user.score.toLocaleString()} DH</p>
                        </div>
                    )}
                </button>
            </div>

            <div className={`mt-auto pt-4`}>
                <button
                    onClick={onToggle}
                    className={`w-full flex items-center justify-center p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-slate-700/50`}
                    title={isCollapsed ? t('sidebar_expand') : t('sidebar_collapse')}
                >
                    {isCollapsed ? <ChevronRightIcon className="w-6 h-6" /> : <ChevronLeftIcon className="w-6 h-6" />}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;