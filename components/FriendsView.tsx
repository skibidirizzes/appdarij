import React, { useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext.tsx';
import { useTranslations } from '../hooks/useTranslations.ts';
import { searchUsers } from '../services/firebaseService.ts';
import { Friend, LeaderboardEntry, View } from '../types.ts';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import { SpinnerIcon, UserGroupIcon, SwordIcon, TrophyIcon } from './icons/index.ts';

type ViewMode = 'my_friends' | 'requests' | 'add_friend' | 'leaderboard';

const FriendCard: React.FC<{
    friend: Friend,
    actions: React.ReactNode
}> = ({ friend, actions }) => {
    return (
        <div className="flex items-center p-3 bg-slate-800/50 rounded-lg card-lift-hover">
            <img src={friend.photoURL} alt={friend.displayName} className="w-12 h-12 rounded-full mr-4" />
            <div className="flex-1">
                <p className="font-bold text-white">{friend.displayName}</p>
                <p className="text-sm text-amber-400">{friend.score.toLocaleString()} DH</p>
            </div>
            <div className="flex items-center gap-2">{actions}</div>
        </div>
    )
}

const FriendLeaderboard: React.FC = () => {
    const { user, friends } = useContext(UserContext);
    const { t } = useTranslations();

    const rankedFriends = useMemo(() => {
        if (!user) return [];
        const currentUserAsFriend: Friend = {
            uid: user.uid,
            displayName: user.displayName,
            score: user.score,
            photoURL: user.photoURL,
            rank: 0,
            lastOnline: user.lastOnline,
        };
        const allPlayers = [currentUserAsFriend, ...friends];
        return allPlayers
            .sort((a, b) => b.score - a.score)
            .map((player, index) => ({ ...player, rank: index + 1 }));

    }, [user, friends]);

    return (
        <Card>
            <div className="p-2 md:p-4">
                {/* Header */}
                <div className="grid grid-cols-6 gap-4 px-4 pb-2 text-sm font-semibold text-[var(--color-text-muted)] border-b border-[var(--color-border-card)]">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-3">{t('leaderboard_user_header')}</div>
                    <div className="col-span-2 text-right">{t('leaderboard_score_header')}</div>
                </div>

                {/* Body */}
                <div className="space-y-1 mt-2">
                    {rankedFriends.map((entry) => {
                        const isCurrentUser = entry.uid === user.uid;
                        return (
                            <div
                                key={entry.uid}
                                className={`grid grid-cols-6 gap-4 items-center p-3 rounded-lg transition-colors ${
                                    isCurrentUser ? 'bg-primary-900/50' : 'hover:bg-slate-700/50'
                                }`}
                            >
                                <div className="col-span-1 text-center font-bold text-lg text-[var(--color-text-muted)]">
                                    {entry.rank <= 3 ? (
                                        <TrophyIcon className={`w-6 h-6 mx-auto ${
                                            entry.rank === 1 ? 'text-amber-400' :
                                            entry.rank === 2 ? 'text-slate-400' :
                                            'text-amber-700'
                                        }`} />
                                    ) : (
                                        entry.rank
                                    )}
                                </div>
                                <div className="col-span-3 font-semibold text-[var(--color-text-base)] truncate flex items-center gap-2">
                                    <img src={entry.photoURL} alt={entry.displayName} className="w-8 h-8 rounded-full" />
                                    {entry.displayName}
                                </div>
                                <div className="col-span-2 text-right font-bold text-primary-400">
                                    {entry.score.toLocaleString()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
}

const FriendsView: React.FC = () => {
    const { t } = useTranslations();
    const navigate = useNavigate();
    const { user, friends, incomingRequests, outgoingRequests, sendFriendRequest, respondToFriendRequest, removeFriend } = useContext(UserContext);
    const [mode, setMode] = useState<ViewMode>('my_friends');
    
    // State for Add Friend tab
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Friend[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!searchQuery.trim() || !user) return;
        setIsSearching(true);
        const uidsToExclude = [user.uid, ...user.friends, ...user.friendRequests.incoming, ...user.friendRequests.outgoing];
        const results = await searchUsers(searchQuery, uidsToExclude);
        setSearchResults(results);
        setIsSearching(false);
    };

    const tabs = [
        { id: 'my_friends', label: t('friends_tab_my_friends'), count: friends.length },
        { id: 'requests', label: t('friends_tab_requests'), count: incomingRequests.length },
        { id: 'leaderboard', label: t('friends_tab_leaderboard') },
        { id: 'add_friend', label: t('friends_tab_add_friend') },
    ];

    const renderContent = () => {
        switch (mode) {
            case 'my_friends':
                return friends.length > 0 ? (
                    <div className="space-y-3">
                        {friends.map(friend => (
                            <FriendCard key={friend.uid} friend={friend} actions={
                                <>
                                    <Button size="sm" onClick={() => navigate('/duel-setup')}><SwordIcon className="w-4 h-4"/></Button>
                                    <Button size="sm" variant="secondary" className="bg-red-900/60 hover:bg-red-800/80 text-red-300" onClick={() => removeFriend(friend.uid)}>{t('friends_button_remove')}</Button>
                                </>
                            }/>
                        ))}
                    </div>
                ) : (
                     <Card className="p-8 text-center text-slate-400 card-lift-hover">
                        <p>{t('friends_my_friends_empty')}</p>
                        <p className="text-sm">{t('friends_my_friends_empty_cta')}</p>
                    </Card>
                );
            case 'requests':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-3">{t('friends_requests_incoming')} ({incomingRequests.length})</h3>
                            {incomingRequests.length > 0 ? (
                                <div className="space-y-3">
                                {incomingRequests.map(req => (
                                    <FriendCard key={req.uid} friend={req} actions={
                                        <>
                                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500" onClick={() => respondToFriendRequest(req.uid, true)}>{t('friends_button_accept')}</Button>
                                            <Button size="sm" variant="secondary" onClick={() => respondToFriendRequest(req.uid, false)}>{t('friends_button_decline')}</Button>
                                        </>
                                    }/>
                                ))}
                                </div>
                            ) : <p className="text-slate-400 text-sm">{t('friends_requests_empty')}</p>}
                        </div>
                         <div>
                            <h3 className="text-xl font-bold text-white mb-3">{t('friends_requests_outgoing')} ({outgoingRequests.length})</h3>
                            {outgoingRequests.length > 0 ? (
                                <div className="space-y-3">
                                {outgoingRequests.map(req => (
                                    <FriendCard key={req.uid} friend={req} actions={
                                         <Button size="sm" disabled>{t('friends_button_pending')}</Button>
                                    }/>
                                ))}
                                </div>
                             ) : <p className="text-slate-400 text-sm">{t('friends_requests_empty')}</p>}
                        </div>
                    </div>
                );
            case 'leaderboard':
                return <FriendLeaderboard />;
            case 'add_friend':
                return (
                    <div>
                        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={t('friends_add_search_placeholder')}
                                className="w-full p-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                            />
                            <Button type="submit" disabled={isSearching || !searchQuery.trim()}>{isSearching ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : t('explorer_search_button')}</Button>
                        </form>
                        <div className="space-y-3">
                            {isSearching && <p className="text-center text-slate-400">{t('friends_add_searching')}</p>}
                            {!isSearching && searchResults.length === 0 && <p className="text-center text-slate-400">{searchQuery ? t('friends_add_no_results') : t('friends_add_initial_prompt')}</p>}
                            {searchResults.map(res => (
                                <FriendCard key={res.uid} friend={res} actions={
                                    <Button size="sm" onClick={() => sendFriendRequest(res.uid)}>{t('friends_button_add')}</Button>
                                }/>
                            ))}
                        </div>
                    </div>
                )
        }
    }

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <UserGroupIcon className="w-12 h-12 mx-auto text-primary-400 mb-4" />
                <h2 className="text-3xl font-bold text-white">{t('friends_title')}</h2>
                <p className="text-primary-300 font-semibold mt-2">{t('friends_subtitle')}</p>
            </div>
            <div className="flex justify-center border-b border-slate-700 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setMode(tab.id as ViewMode)}
                        className={`py-3 px-4 md:px-6 font-semibold text-center transition-colors duration-300 border-b-4 -mb-px relative text-sm md:text-base ${
                        mode === tab.id 
                            ? 'border-primary-500 text-white' 
                            : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className="absolute top-1 right-1 block h-5 w-5 rounded-full bg-primary-500 text-white text-xs font-bold leading-5">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>
            <div>{renderContent()}</div>
        </div>
    );
};

export default FriendsView;