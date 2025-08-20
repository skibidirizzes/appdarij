import React, { useContext } from 'react';
import { View } from '../types.ts';
import { useTranslations } from '../hooks/useTranslations.ts';
import { BookOpenIcon, GearIcon, UserGroupIcon, SoundWaveIcon, ShieldCheckIcon, DumbbellIcon } from './icons/index.ts';
import { UserContext } from '../context/UserContext.tsx';

interface BottomNavProps {
    currentView: View;
    onNavigate: (view: View) => void;
}

const NavItem: React.FC<{
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center flex-1 min-w-[72px] pt-2 pb-1 transition-colors duration-200 ${
            isActive ? 'text-primary-400' : 'text-slate-400 hover:text-white'
        }`}
        aria-label={label}
    >
        <Icon className="w-6 h-6" />
        <span className={`text-xs mt-1 ${isActive ? 'font-bold' : ''}`}>{label}</span>
    </button>
);

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
    const { t } = useTranslations();
    const { user } = useContext(UserContext);
    
    const navItems = ([
        { view: 'dashboard', label: t('nav_dashboard'), icon: BookOpenIcon },
        { view: 'phoneme-practice', label: t('nav_phoneme_practice'), icon: SoundWaveIcon },
        { view: 'mastery', label: "Mastery", icon: DumbbellIcon },
        { view: 'friends', label: t('nav_friends'), icon: UserGroupIcon },
        { view: 'settings', label: t('nav_settings'), icon: GearIcon },
    ] as const)

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-800/80 backdrop-blur-lg border-t border-slate-700/50 flex z-20 overflow-x-auto">
            {navItems.map((item) => (
                <NavItem
                    key={item.view}
                    label={item.label}
                    icon={item.icon}
                    isActive={currentView === item.view}
                    onClick={() => onNavigate(item.view)}
                />
            ))}
        </nav>
    );
};

export default BottomNav;
