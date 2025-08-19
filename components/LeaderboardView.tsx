import React, { useState, useEffect, useContext, useMemo } from 'react';
import { getLeaderboard } from '../services/firebaseService.ts';
import { LeaderboardEntry, View } from '../types.ts';
import { UserContext } from '../context/UserContext.tsx';
import Card from './common/Card.tsx';
import { SpinnerIcon, TrophyIcon, LeaderboardIcon, UserIcon } from './icons/index.ts';
import { useTranslations } from '../hooks/useTranslations.ts';
import Skeleton from './common/Skeleton.tsx';

interface LeaderboardViewProps {
    showTitle?: boolean;
    onNavigate: (view: { name: View; params?: any }) => void;
}

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ showTitle = true, onNavigate }) => {
    const { user } = useContext(UserContext);
    const { t } = useTranslations();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getLeaderboard();
                setEntries(data);
            } catch (err) {
                console.error(err);
                setError(t('leaderboard_error'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, [t]);
    
    const filteredEntries = useMemo(() => {
        if (!searchQuery) return entries;
        return entries.filter(entry =>
            entry.displayName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [entries, searchQuery]);

    const userEntry = entries.find(entry => entry.uid === user.uid);

    const renderSkeleton = () => (
        <div className="space-y-3 p-3">
            {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        <Skeleton className="h-6 w-6" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                </div>
            ))}
        </div>
    );

    return (
        <div className="w-full max-w-3xl mx-auto animate-fade-in">
            {showTitle && (
                <div className="text-center mb-8">
                    <LeaderboardIcon className="w-12 h-12 mx-auto text-primary-400 mb-4" />
                    <h2 className="text-3xl font-bold text-[var(--color-text-base)]">{t('leaderboard_title')}</h2>
                    <p className="text-primary-300 font-semibold mt-2">{t('leaderboard_subtitle')}</p>
                </div>
            )}

            {!showTitle && <h3 className="text-xl font-bold text-white mb-4">{t('leaderboard_title')}</h3>}
            
            <Card className="mb-6 p-4 bg-primary-900/50 border border-primary-500/50">
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">{t('leaderboard_your_rank')}</span>
                    <div className="text-right">
                        <p className="font-bold text-xl text-primary-300">{user.score.toLocaleString()} {t('leaderboard_score_header')}</p>
                        <p className="text-sm text-slate-300">
                            {userEntry ? `#${userEntry.rank}` : "Not in top 100"}
                        </p>
                    </div>
                </div>
            </Card>
            
            <div className="mb-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('friends_add_search_placeholder')}
                    className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                />
            </div>

            <Card>
                <div className="p-2 md:p-4">
                    {/* Header */}
                    <div className="grid grid-cols-6 gap-4 px-4 pb-2 text-sm font-semibold text-[var(--color-text-muted)] border-b border-[var(--color-border-card)]">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-3">{t('leaderboard_user_header')}</div>
                        <div className="col-span-2 text-right">{t('leaderboard_score_header')}</div>
                    </div>

                    {/* Body */}
                    {isLoading ? renderSkeleton() : error ? (
                        <p className="text-center text-red-400 p-6">{error}</p>
                    ) : (
                        <div className="space-y-1 mt-2">
                            {filteredEntries.slice(0, 50).map((entry, index) => {
                                const isCurrentUser = entry.uid === user.uid;
                                return (
                                    <button
                                        key={entry.uid}
                                        onClick={() => onNavigate({ name: 'profile', params: { userId: entry.uid } })}
                                        className={`grid grid-cols-6 gap-4 items-center p-3 rounded-lg transition-colors w-full text-left animate-stagger-fade-in ${
                                            isCurrentUser ? 'bg-primary-900/50' : 'hover:bg-slate-700/50'
                                        }`}
                                        style={{ animationDelay: `${index * 50}ms` }}
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
                                            <img src={entry.photoURL || `https://api.dicebear.com/8.x/adventurer/svg?seed=${entry.displayName}`} alt={entry.displayName} className="w-8 h-8 rounded-full"/>
                                            {entry.displayName}
                                        </div>
                                        <div className="col-span-2 text-right font-bold text-primary-400">
                                            {entry.score.toLocaleString()}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default LeaderboardView;