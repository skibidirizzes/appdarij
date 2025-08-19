import React, { useState, useContext } from 'react';
import { UserContext } from '../context/UserContext.tsx';
import { useTranslations } from '../hooks/useTranslations.ts';
import { View, Friend, LearningTopic } from '../types.ts';
import { LEARNING_TOPICS } from '../constants.ts';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import { SwordIcon, UserGroupIcon } from './icons/index.ts';

interface DuelSetupViewProps {
    onNavigate: (view: { name: View; params?: any }) => void;
}

const DuelSetupView: React.FC<DuelSetupViewProps> = ({ onNavigate }) => {
    const { t } = useTranslations();
    const { user, friends } = useContext(UserContext);
    const [selectedTopic, setSelectedTopic] = useState<LearningTopic | null>(null);
    const [selectedOpponent, setSelectedOpponent] = useState<Friend | null>(null);

    const handleStartDuel = () => {
        if (selectedTopic && selectedOpponent) {
            onNavigate({
                name: 'duel-quiz',
                params: {
                    topic: selectedTopic,
                    opponent: selectedOpponent,
                },
            });
        }
    };
    
    return (
        <div className="w-full max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <SwordIcon className="w-12 h-12 mx-auto text-primary-400 mb-4" />
                <h2 className="text-3xl font-bold text-white">Friend Duel</h2>
                <p className="text-primary-300 font-semibold mt-2">Challenge a friend to a real-time quiz!</p>
            </div>
            
            <div className="space-y-6">
                <Card className="p-6 card-lift-hover">
                    <h3 className="text-xl font-bold text-white mb-4">1. Choose a Topic</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {LEARNING_TOPICS.map(topic => (
                             <button 
                                key={topic.name}
                                onClick={() => setSelectedTopic(topic.name)}
                                className={`p-3 rounded-lg text-center font-semibold transition-all duration-200 ${selectedTopic === topic.name ? 'bg-primary-500 text-white ring-2 ring-primary-300' : 'bg-slate-700 hover:bg-slate-600'}`}
                            >
                                {t(topic.nameKey)}
                            </button>
                        ))}
                    </div>
                </Card>

                <Card className="p-6 card-lift-hover">
                    <h3 className="text-xl font-bold text-white mb-4">2. Choose an Opponent</h3>
                     {friends.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {friends.map(friend => (
                                <button
                                    key={friend.uid}
                                    onClick={() => setSelectedOpponent(friend)}
                                    className={`p-3 rounded-lg flex items-center gap-3 text-left transition-all duration-200 ${selectedOpponent?.uid === friend.uid ? 'bg-primary-500 text-white ring-2 ring-primary-300' : 'bg-slate-700 hover:bg-slate-600'}`}
                                >
                                    <img src={friend.photoURL} alt={friend.displayName} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="font-semibold">{friend.displayName}</p>
                                        <p className="text-xs text-amber-400">{friend.score.toLocaleString()} DH</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center text-slate-400 p-4 bg-slate-800/50 rounded-lg">
                            <p>You need to add friends to challenge them!</p>
                            <Button onClick={() => onNavigate({ name: 'friends'})} size="sm" className="mt-3">Add Friends</Button>
                        </div>
                    )}
                </Card>

                <div className="text-center">
                    <Button
                        size="lg"
                        onClick={handleStartDuel}
                        disabled={!selectedTopic || !selectedOpponent}
                        className="flex items-center gap-3 mx-auto"
                    >
                        <SwordIcon className="w-6 h-6"/>
                        Start Duel with {selectedOpponent?.displayName || '...'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DuelSetupView;