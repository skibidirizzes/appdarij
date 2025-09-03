import React, { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext.tsx';
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
    DumbbellIcon,
    SendIcon
} from './icons/index.ts';
import { ADMIN_UIDS } from '../constants.ts';
import Tooltip from './common/Tooltip.tsx';

interface SidebarProps {
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
    isOnlineIndicator?: boolean;
}> = ({ icon: Icon, label, isActive, onClick, isCollapsed, hasNotification, isOnlineIndicator }) => (
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
             {hasNotification && (
                <span className={`absolute top-1 right-2 w-2.5 h-2.5 rounded-full border-2 border-[var(--color-bg-sidebar)] ${isOnlineIndicator ? 'bg-emerald-500 animate-pulse-dot' : 'bg-red-500'}`}></span>
            )}
        </button>
    </div>
);

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
    const { user, friends } = useContext(UserContext);
    const { t } = useTranslations();
    const navigate = useNavigate();
    const location = useLocation();
    
    if (!user) return null;

    const isParentalLinkActive = user.childAccountIds?.length > 0 || !!user.parentAccountId;
    const onlineFriends = friends.filter(f => (Date.now() - f.lastOnline) < 15 * 60 * 1000);
    const onlineFriendsCount = onlineFriends.length;
    const duelLabel = `Duels ${onlineFriendsCount > 0 && !isCollapsed ? `(${onlineFriendsCount})` : ''}`;
    const isAdmin = ADMIN_UIDS.includes(user.uid);
    
    const navItems = [
        { path: '/dashboard', label: t('nav_dashboard'), icon: BookOpenIcon },
        { path: '/mastery', label: "Mastery", icon: DumbbellIcon },
        { path: '/mistakes-bank', label: "Mistakes Bank", icon: ClipboardListIcon },
        { path: '/conversation', label: t('nav_conversation'), icon: ChatBubbleIcon },
        { path: '/phoneme-practice', label: t('nav_phoneme_practice'), icon: SoundWaveIcon },
    ];
    
    const socialItems = [
        { path: '/friends', label: t('nav_friends'), icon: UserGroupIcon },
        { path: '/leaderboard', label: t('nav_leaderboard'), icon: LeaderboardIcon },
        { path: '/achievements', label: t('nav_achievements'), icon: TrophyIcon },
        ...(isParentalLinkActive ? [{ path: '/parental-controls', label: t('nav_parental_controls'), icon: ShieldCheckIcon, notification: true }] : []),
    ];

    const toolItems = [
        { path: '/dictionary', label: t('nav_dictionary'), icon: LibraryIcon },
        { path: '/triliteral-root', label: t('nav_triliteral_root'), icon: RootIcon },
        ...(isAdmin ? [{ path: '/send-notification', label: "Send Notification", icon: SendIcon }] : []),
    ];


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
                 {navItems.map(item => (
                    <NavItem
                        key={item.path}
                        label={item.label}
                        icon={item.icon}
                        isActive={location.pathname === item.path}
                        onClick={() => navigate(item.path)}
                        isCollapsed={isCollapsed}
                    />
                ))}

                <hr className={`my-2 border-slate-700 ${isCollapsed ? 'mx-2' : ''}`} />

                <Tooltip 
                    content={onlineFriendsCount > 0 ? (
                        <div className="text-left">
                            <p className="font-bold mb-1">Online Friends:</p>
                            <ul className="space-y-1">{onlineFriends.slice(0, 5).map(f => <li key={f.uid}>- {f.displayName}</li>)}</ul>
                        </div>
                        ) : "No friends are online"}
                    position={isCollapsed ? 'right' : 'top'}
                >
                    <NavItem
                        label={duelLabel}
                        icon={SwordIcon}
                        isActive={location.pathname === '/duel-setup'}
                        onClick={() => navigate('/duel-setup')}
                        isCollapsed={isCollapsed}
                        hasNotification={onlineFriendsCount > 0}
                        isOnlineIndicator={onlineFriendsCount > 0}
                    />
                </Tooltip>
                 {socialItems.map(item => (
                    <NavItem
                        key={item.path}
                        label={item.label}
                        icon={item.icon}
                        isActive={location.pathname === item.path}
                        onClick={() => navigate(item.path)}
                        isCollapsed={isCollapsed}
                    />
                ))}
                
                <hr className={`my-2 border-slate-700 ${isCollapsed ? 'mx-2' : ''}`} />

                {toolItems.map(item => (
                    <NavItem
                        key={item.path}
                        label={item.label}
                        icon={item.icon}
                        isActive={location.pathname === item.path}
                        onClick={() => navigate(item.path)}
                        isCollapsed={isCollapsed}
                    />
                ))}
            </nav>

            <div className="flex-shrink-0 mt-auto pt-2 space-y-2">
                 <div className="pt-2 border-t border-[var(--color-border-card)]">
                     <NavItem
                        label={t('nav_settings')}
                        icon={GearIcon}
                        isActive={location.pathname === '/settings'}
                        onClick={() => navigate('/settings')}
                        isCollapsed={isCollapsed}
                    />
                </div>
                <div className={`pt-2 border-t border-[var(--color-border-card)]`}>
                    <button 
                        onClick={() => navigate(`/profile/${user.uid}`)}
                        className={`flex items-center w-full p-2 rounded-lg text-left transition-colors hover:bg-slate-700/50 ${location.pathname.startsWith('/profile') ? 'bg-slate-700' : ''}`}
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