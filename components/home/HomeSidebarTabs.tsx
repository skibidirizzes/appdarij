import React, { useState } from 'react';
import { useTranslations } from '../../hooks/useTranslations.ts';
import Card from '../common/Card.tsx';
import WeeklyQuests from './WeeklyQuests.tsx';
import RecentActivity from './RecentActivity.tsx';
import { DumbbellIcon, TrophyIcon } from '../icons/index.ts';

type Tab = 'quests' | 'activity';

const HomeSidebarTabs: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('quests');
    const { t } = useTranslations();

    const tabs: { id: Tab; label: string; icon: React.FC<any> }[] = [
        { id: 'quests', label: t('home_sidebar_tab_quests'), icon: DumbbellIcon },
        { id: 'activity', label: t('home_sidebar_tab_activity'), icon: TrophyIcon }
    ];

    return (
        <Card>
            <div className="tabs-container flex border-b border-[var(--color-border-card)]">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`tab-button w-1/2 font-semibold flex items-center justify-center gap-2 p-3 ${activeTab === tab.id ? 'active' : 'text-slate-400 hover:text-white'}`}
                    >
                        <tab.icon className="w-5 h-5" />
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="p-4">
                {activeTab === 'quests' && <WeeklyQuests />}
                {activeTab === 'activity' && <RecentActivity />}
            </div>
        </Card>
    );
};

export default HomeSidebarTabs;
