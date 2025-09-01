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
    hasNotification?: boolean;
}> = ({ icon: Icon, label, isActive, onClick, isCollapsed, hasNotification }) => (
    <div className="relative">
        <button
            onClick={onClick}
            title={isCollapsed ? label : ''}
            className={`flex items-center w-full py-2 rounded-lg transition-colors duration-200 ${isCollapsed ? 'px-3 justify-center' : 'px-4'} ${
                isActive
                    ? 'bg-primary-500 text-on-primary font-semibold shadow-lg'
                    : 'text-[var(--color-text-muted)] hover:bg-slate-700/50 hover:text-[var(--color-text-base)]'
            }`}
        >
            <Icon className={`w-6 h-6 transition-colors duration-200 flex-shrink-0 ${isActive ? 'text-on-primary' : 'text-primary-400 group-hover:text-primary-300'}`} />
            {!isCollapsed && <span className="flex-1 ml-4 whitespace-nowrap text-left">{label}</span>}
        </button>
        {hasNotification && (
            <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--color-bg-sidebar)]"></span>
        )}
    </div>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isCollapsed, onToggle }) => {
    const { user } = useContext(UserContext);
    const { t } = useTranslations();
    
    const isParentalLinkActive = user?.childAccountIds?.length > 0 || !!user?.parentAccountId;
    
    const allNavItems = [
        // Learn
        { view: 'dashboard', label: t('nav_dashboard'), icon: BookOpenIcon },
        { view: 'mastery', label: "Mastery", icon: DumbbellIcon },
        { view: 'mistakes-bank', label: "Mistakes Bank", icon: ClipboardListIcon },
        { view: 'conversation', label: t('nav_conversation'), icon: ChatBubbleIcon },
        { view: 'phoneme-practice', label: t('nav_phoneme_practice'), icon: SoundWaveIcon },
        { isSeparator: true },
        // Community & Social
        { view: 'friends', label: t('nav_friends'), icon: UserGroupIcon },
        { view: 'leaderboard', label: t('nav_leaderboard'), icon: LeaderboardIcon },
        { view: 'duel-setup', label: "Duels", icon: SwordIcon },
        { view: 'achievements', label: t('nav_achievements'), icon: TrophyIcon },
        { view: 'parental-controls', label: t('nav_parental_controls'), icon: ShieldCheckIcon, notification: isParentalLinkActive },
        { isSeparator: true },
        // Tools
        { view: 'dictionary', label: t('nav_dictionary'), icon: LibraryIcon },
        { view: 'triliteral-root', label: t('nav_triliteral_root'), icon: RootIcon },
    ] as const;


    if (!user) return null;

    return (
        <aside className={`fixed top-0 left-0 h-full bg-[var(--color-sidebar-bg)] backdrop-blur-lg border-r border-[var(--color-border-card)] flex flex-col z-20 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-24 p-3' : 'w-64 p-4'}`}>
            <div className={`flex items-center mb-6 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
                <img src="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🇲🇦</text></svg>" alt="App Logo" className="h-8 w-8 flex-shrink-0" />
                {!isCollapsed && (
                    <h1 className="text-xl font-bold text-white tracking-tight ml-3 whitespace-nowrap overflow-hidden">
                        LearnDarija
                    </h1>
                )}
            </div>

            <nav className="flex-grow space-y-1 overflow-y-auto -mr-2 pr-2">
                {allNavItems.map((item, index) => {
                    if ('isSeparator' in item && item.isSeparator) {
                        return <hr key={`sep-${index}`} className={`my-2 border-slate-700 ${isCollapsed ? 'mx-2' : ''}`} />;
                    }
                    if ('view' in item) {
                        return (
                            <NavItem
                                key={item.view}
                                label={item.label}
                                icon={item.icon}
                                isActive={currentView === item.view}
                                onClick={() => onNavigate(item.view)}
                                isCollapsed={isCollapsed}
                                hasNotification={'notification' in item && item.notification}
                            />
                        );
                    }
                    return null;
                })}
            </nav>

            <div className="flex-shrink-0 mt-auto pt-2 space-y-2">
                 <div className="pt-2 border-t border-[var(--color-border-card)]">
                     <NavItem
                        label={t('nav_settings')}
                        icon={GearIcon}
                        isActive={currentView === 'settings'}
                        onClick={() => onNavigate('settings')}
                        isCollapsed={isCollapsed}
                    />
                </div>
                <div className={`pt-2 border-t border-[var(--color-border-card)]`}>
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
                <div className={`pt-2`}>
                    <button
                        onClick={onToggle}
                        className={`w-full flex items-center justify-center p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-slate-700/50`}
                        title={isCollapsed ? t('sidebar_expand') : t('sidebar_collapse')}
                    >
                        {isCollapsed ? <ChevronRightIcon className="w-6 h-6" /> : <ChevronLeftIcon className="w-6 h-6" />}
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
