import React, { useState, useContext } from 'react';
import { UserContext } from '../context/UserContext.tsx';
import { useTranslations } from '../hooks/useTranslations.ts';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import { ShieldCheckIcon, SpinnerIcon, CheckCircleIcon, TrophyIcon } from './icons/index.ts';
import { UserProfile } from '../types.ts';

// Mock function to simulate fetching child data
const getChildData = async (code: string): Promise<Partial<UserProfile> | null> => {
    // In a real app, this would be a backend call. Here we mock it.
    await new Promise(res => setTimeout(res, 500));
    // This now succeeds for any 6-character alphanumeric code.
    if (code && code.length === 6 && /^[A-Z0-9]+$/.test(code)) {
         return {
            uid: `mock_child_${code}`,
            displayName: 'Jamal Jr.',
            photoURL: `https://api.dicebear.com/8.x/adventurer/svg?seed=JamalJr`,
            score: 4250,
            streak: 12,
            dailyXp: 30,
            settings: { dailyGoal: 50 } as any,
            questionsAnswered: 200,
            correctAnswers: 170,
            unlockedAchievements: ['first_steps', 'quiz_taker', 'topic_starter_vocabulary', 'level_5_vocabulary'],
         };
    }
    return null;
}

const ChildDashboard: React.FC<{ childData: Partial<UserProfile>; onDisconnect: () => void }> = ({ childData, onDisconnect }) => {
    const { t } = useTranslations();
    
    const childGoal = childData.settings?.dailyGoal || 50;

    const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newGoal = parseInt(e.target.value, 10);
        // In a real app, this would update the child's profile in the backend.
        alert(`In a real app, this would set ${childData.displayName}'s goal to ${newGoal}.`);
    };

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center text-white">{t('parental_controls_child_stats', { name: childData.displayName })}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                     <p className="font-semibold text-lg mb-2 text-center text-slate-300">Overall Stats</p>
                    <div className="flex justify-around items-center text-center">
                        <div>
                            <p className="text-3xl font-bold text-primary-400">{childData.score?.toLocaleString()}</p>
                            <p className="text-sm text-slate-400">Total Dirhams</p>
                        </div>
                         <div>
                            <p className="text-3xl font-bold text-primary-400">🔥{childData.streak}</p>
                            <p className="text-sm text-slate-400">Day Streak</p>
                        </div>
                    </div>
                </Card>
                 <Card className="p-4">
                     <p className="font-semibold text-lg mb-2 text-center text-slate-300">Daily Progress</p>
                     <div className="flex justify-around items-center text-center">
                        <div>
                            <p className="text-3xl font-bold text-primary-400">{childData.dailyXp || 0} / {childGoal}</p>
                            <p className="text-sm text-slate-400">Today's DH</p>
                        </div>
                         <div>
                            <p className="text-3xl font-bold text-primary-400">{((childData.correctAnswers / childData.questionsAnswered) * 100).toFixed(0)}%</p>
                            <p className="text-sm text-slate-400">Accuracy</p>
                        </div>
                    </div>
                </Card>
                 <Card className="p-4 md:col-span-2">
                    <p className="font-semibold text-lg mb-2 text-slate-300">{t('parental_controls_manage_goals')}</p>
                     <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="10"
                            max="200"
                            step="10"
                            defaultValue={childGoal}
                            onChange={handleGoalChange}
                            className="w-full"
                        />
                        <span className="font-bold text-primary-300 w-16 text-center">{childGoal} DH</span>
                    </div>
                </Card>
                 <Card className="p-4 md:col-span-2">
                    <p className="font-semibold text-lg mb-3 text-slate-300">{t('parental_controls_recent_activity')}</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {childData.unlockedAchievements?.length > 0 ? (
                            childData.unlockedAchievements.slice(-5).reverse().map(achId => (
                                <div key={achId} className="flex items-center gap-3 text-sm p-2 bg-slate-800/50 rounded-md">
                                    <TrophyIcon className="w-5 h-5 text-amber-400"/>
                                    <p className="text-slate-300">Unlocked achievement: <span className="font-semibold text-white">{achId.replace(/_/g, ' ')}</span></p>
                                </div>
                            ))
                        ) : <p className="text-slate-400 text-sm">No recent achievements.</p>}
                        <div className="flex items-center gap-3 text-sm p-2 bg-slate-800/50 rounded-md">
                             <CheckCircleIcon className="w-5 h-5 text-emerald-400"/>
                             <p className="text-slate-300">Completed a <span className="font-semibold text-white">Vocabulary</span> quiz.</p>
                        </div>
                    </div>
                </Card>
            </div>
             <div className="mt-6 text-center">
                <Button onClick={onDisconnect} className="bg-red-800/80 hover:bg-red-700/80">Disconnect Account</Button>
            </div>
        </div>
    );
}

const ParentalControlsView: React.FC = () => {
    const { user, addInfoToast } = useContext(UserContext);
    const { t } = useTranslations();
    const [isLoading, setIsLoading] = useState(false);
    const [linkCode, setLinkCode] = useState('');
    const [error, setError] = useState('');

    // Mock state for child data
    const [childData, setChildData] = useState<Partial<UserProfile> | null>(null);

    const handleLinkAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const data = await getChildData(linkCode);
        if(data) {
            setChildData(data);
            addInfoToast({ type: 'success', message: `Successfully linked with ${data.displayName}!`});
        } else {
            setError("Invalid code. Please check and try again.");
        }
        setIsLoading(false);
    }
    
    const handleCopyCode = () => {
        const code = user.uid.slice(-6).toUpperCase();
        navigator.clipboard.writeText(code).then(() => {
            addInfoToast({type: 'success', message: 'Code copied to clipboard!'});
        }).catch(err => {
             addInfoToast({type: 'error', message: 'Failed to copy code.'});
        });
    }

    const handleDisconnect = () => {
        setChildData(null);
        setLinkCode('');
        setError('');
        addInfoToast({ type: 'info', message: 'Account disconnected.'});
    };
    
    if(childData) {
        return <ChildDashboard childData={childData} onDisconnect={handleDisconnect} />;
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <ShieldCheckIcon className="w-12 h-12 mx-auto text-primary-400 mb-4" />
                <h2 className="text-3xl font-bold text-white">{t('parental_controls_title')}</h2>
                <p className="text-primary-300 font-semibold mt-2">{t('parental_controls_subtitle')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Parent's view */}
                <Card className="p-6">
                    <h3 className="text-xl font-bold text-white">{t('parental_controls_no_child_title')}</h3>
                    <p className="text-slate-400 text-sm mt-1 mb-4">{t('parental_controls_parent_instructions')}</p>
                    <form onSubmit={handleLinkAccount} className="space-y-3">
                        <input 
                            type="text"
                            value={linkCode}
                            onChange={e => setLinkCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            className="w-full p-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-white tracking-widest text-center font-mono focus:ring-2 focus:ring-primary-400"
                        />
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        <Button type="submit" className="w-full justify-center" disabled={isLoading || linkCode.length < 6}>
                            {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : t('parental_controls_link_button')}
                        </Button>
                    </form>
                </Card>
                
                 {/* Child's view */}
                <Card className="p-6 bg-slate-800/30">
                     <h3 className="text-xl font-bold text-white">{t('parental_controls_your_code')}</h3>
                     <p className="text-slate-400 text-sm mt-1 mb-4">{t('parental_controls_child_instructions')}</p>
                     <div className="p-4 bg-slate-900/50 border-2 border-dashed border-slate-600 rounded-lg text-center">
                        <p className="text-3xl font-bold tracking-widest font-mono text-primary-300">
                            {user.uid.slice(-6).toUpperCase()}
                        </p>
                     </div>
                     <Button onClick={handleCopyCode} variant="outline" size="sm" className="w-full mt-3">Copy Code</Button>
                </Card>
            </div>
        </div>
    );
};

export default ParentalControlsView;