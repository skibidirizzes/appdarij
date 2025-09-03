import React, { useState, useContext, useEffect, useCallback } from 'react';
import { UserContext } from '../context/UserContext.tsx';
import { useTranslations } from '../hooks/useTranslations.ts';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import Modal from './common/Modal.tsx';
import { ShieldCheckIcon, SpinnerIcon, CheckCircleIcon, TrophyIcon, XCircleIcon, RefreshCwIcon, EyeIcon, EyeOffIcon } from './icons/index.ts';
import { UserProfile, Mistake } from '../types.ts';
import { getUserProfile } from '../services/firebaseService.ts';


// Mock function to simulate fetching child data
const getChildData = async (code: string): Promise<Partial<UserProfile> | null> => {
    // In a real app, this would query a user with this linking code.
    await new Promise(res => setTimeout(res, 500));
    
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
            mistakes: [
                { question: { question: "Translate: 'I want to eat'", type: 'writing' }, userAnswer: 'bghit nakul' },
                { question: { question: "What is 'car'?", type: 'multiple-choice' }, userAnswer: 'tomobil' },
                { question: { question: "How do you say 'thank you'?", type: 'speaking' }, userAnswer: 'choukran' },
            ] as Mistake[],
            parentAccountId: 'mock_parent_id',
         };
    }
    return null;
}

const ChildDashboard: React.FC<{ childData: Partial<UserProfile>; onDisconnect: () => void }> = ({ childData, onDisconnect }) => {
    const { t } = useTranslations();
    
    const childGoal = childData.settings?.dailyGoal || 50;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center">
                 <img src={childData.photoURL} alt={childData.displayName} className="w-24 h-24 rounded-full mx-auto border-4 border-primary-400 mb-2"/>
                <h3 className="text-2xl font-bold text-white">{t('parental_controls_child_stats', { name: childData.displayName })}</h3>
            </div>
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
                     <h3 className="font-semibold text-lg mb-3 text-slate-300">Recent Mistakes</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {childData.mistakes?.length > 0 ? (
                            childData.mistakes.slice(-5).reverse().map((mistake, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm p-2 bg-slate-800/50 rounded-md">
                                    <XCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0"/>
                                    <p className="text-slate-300">Q: "{mistake.question.question}"</p>
                                </div>
                            ))
                        ) : <p className="text-slate-400 text-sm">No recent mistakes. Great job!</p>}
                    </div>
                </Card>
            </div>
             <div className="mt-6 text-center">
                <Button onClick={onDisconnect} className="bg-red-800/80 hover:bg-red-700/80">Disconnect Account</Button>
            </div>
        </div>
    );
}

const ChildsLinkedView: React.FC<{ parentProfile: UserProfile }> = ({ parentProfile }) => {
    return (
        <Card className="p-8 text-center animate-fade-in">
            <img src={parentProfile.photoURL} alt={parentProfile.displayName} className="w-20 h-20 rounded-full mx-auto border-4 border-emerald-400 mb-4"/>
            <h3 className="text-xl font-bold text-white">Account Linked!</h3>
            <p className="text-slate-300 mt-2">Your progress is being shared with <span className="font-semibold text-white">{parentProfile.displayName}</span>.</p>
        </Card>
    );
};

const LinkConfirmationModal: React.FC<{
    childToConfirm: Partial<UserProfile>;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ childToConfirm, onConfirm, onCancel }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    const handleConfirm = () => {
        setIsConfirming(true);
        // Mock confirmation delay
        setTimeout(() => {
            onConfirm();
            setIsConfirming(false);
        }, 1000);
    };

    return (
        <Modal isOpen={true} onClose={onCancel} title="Confirm Account Link">
            <div className="p-6 text-center">
                <p className="text-slate-300 mb-4">You are about to link with this account:</p>
                <div className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg mb-4">
                    <img src={childToConfirm.photoURL} alt={childToConfirm.displayName} className="w-12 h-12 rounded-full" />
                    <div className="text-left">
                        <p className="font-bold text-white">{childToConfirm.displayName}</p>
                        <p className="text-sm text-slate-400">{childToConfirm.uid}</p>
                    </div>
                </div>
                <p className="text-slate-400 text-sm mb-3">To protect this account, please enter <span className="font-semibold text-white">{childToConfirm.displayName}'s</span> password to confirm the link.</p>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter account password"
                        className="w-full p-2 bg-slate-700 border-2 border-slate-600 rounded-lg text-white pr-10"
                    />
                    <button onClick={() => setShowPassword(s => !s)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
                        {showPassword ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                    </button>
                </div>
                <div className="flex gap-4 mt-6">
                    <Button onClick={onCancel} className="w-full bg-slate-600 hover:bg-slate-500">Cancel</Button>
                    <Button onClick={handleConfirm} className="w-full" disabled={isConfirming || password.length < 4}>
                        {isConfirming ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : "Confirm & Link"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};


const ParentalControlsView: React.FC = () => {
    const { user, addInfoToast, updateProfileDetails } = useContext(UserContext);
    const { t } = useTranslations();
    const [isLoading, setIsLoading] = useState(false);
    const [linkCode, setLinkCode] = useState('');
    const [error, setError] = useState('');
    
    const [childToConfirm, setChildToConfirm] = useState<Partial<UserProfile> | null>(null);
    const [childData, setChildData] = useState<Partial<UserProfile> | null>(null);
    const [parentProfile, setParentProfile] = useState<UserProfile | null>(null);
    const [linkingCode, setLinkingCode] = useState(() => user.uid.slice(-6).toUpperCase());

    const linkedChildId = user.childAccountIds?.[0];

    useEffect(() => {
        const fetchLinkedData = async () => {
            setIsLoading(true);
            if (linkedChildId) {
                const data = await getChildData(linkedChildId); // In real app, use UID to fetch
                setChildData(data);
            } else if (user.parentAccountId) {
                const data = await getUserProfile(user.parentAccountId);
                setParentProfile(data);
            }
            setIsLoading(false);
        };
        fetchLinkedData();
    }, [linkedChildId, user.parentAccountId]);


    const handleFindAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const data = await getChildData(linkCode);
        if(data) {
            setChildToConfirm(data);
        } else {
            setError("Invalid code. Please check and try again.");
        }
        setIsLoading(false);
    }
    
    const handleConfirmLink = () => {
        if (!childToConfirm) return;
        updateProfileDetails({ childAccountIds: [...(user.childAccountIds || []), childToConfirm.uid!] });
        setChildData(childToConfirm);
        addInfoToast({ type: 'success', message: `Successfully linked with ${childToConfirm.displayName}!`});
        setChildToConfirm(null);
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(linkingCode).then(() => {
            addInfoToast({type: 'success', message: 'Code copied to clipboard!'});
        });
    }

    const handleRegenerateCode = () => {
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        setLinkingCode(newCode);
        addInfoToast({type: 'info', message: 'New linking code generated.'});
    }

    const handleDisconnect = () => {
        // Mock update
        updateProfileDetails({ childAccountIds: [] });
        setChildData(null);
        setLinkCode('');
        setError('');
        addInfoToast({ type: 'info', message: 'Account disconnected.'});
    };
    
    if (isLoading) {
        return <div className="flex justify-center p-8"><SpinnerIcon className="w-10 h-10 animate-spin" /></div>
    }
    
    if(childToConfirm) {
        return <LinkConfirmationModal 
                    childToConfirm={childToConfirm} 
                    onConfirm={handleConfirmLink} 
                    onCancel={() => setChildToConfirm(null)} 
                />
    }

    if(childData) {
        return <ChildDashboard childData={childData} onDisconnect={handleDisconnect} />;
    }

    if(parentProfile) {
        return <ChildsLinkedView parentProfile={parentProfile} />;
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
                    <form onSubmit={handleFindAccount} className="space-y-3">
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
                           {linkingCode}
                        </p>
                     </div>
                     <div className="flex gap-2 mt-3">
                        <Button onClick={handleCopyCode} variant="outline" size="sm" className="w-full">Copy Code</Button>
                        <Button onClick={handleRegenerateCode} variant="secondary" size="sm" className="w-full flex items-center justify-center gap-2">
                           <RefreshCwIcon className="w-4 h-4" /> Regenerate
                        </Button>
                     </div>
                </Card>
            </div>
        </div>
    );
};

export default ParentalControlsView;