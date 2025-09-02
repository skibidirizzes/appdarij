import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { UserProfile, CommunityPost, View, Sticker } from '../types.ts';
import { UserContext } from '../context/UserContext.tsx';
import { getUserProfile, getCommunityPostsByUser } from '../services/firebaseService.ts';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import { SpinnerIcon, TrophyIcon, UserIcon, ClockIcon } from './icons/index.ts';
import { useTranslations } from '../hooks/useTranslations.ts';
import { formatDistanceToNow } from 'date-fns';
import RecentActivity from './home/RecentActivity.tsx'; // Reusing this component
import { CommunityIcon, MessageSquareIcon, ArrowUpIcon } from './icons/index.ts';
import Tooltip from './common/Tooltip.tsx';

const PostCard: React.FC<{ post: CommunityPost }> = ({ post }) => {
    const { t } = useTranslations();
    return (
        <Card className="p-4 flex gap-4 card-lift-hover">
            <div className="flex flex-col items-center gap-1 w-10 flex-shrink-0">
                <ArrowUpIcon className="w-5 h-5 text-slate-400"/>
                <span className="font-bold text-sm text-white">{post.upvotes}</span>
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-white mb-1">{post.title}</h3>
                <p className="text-slate-300 text-sm">{post.contentSnippet}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                    <MessageSquareIcon className="w-4 h-4"/>
                    <span>{t('community_replies', { count: post.replies })}</span>
                    <span className="px-2 py-0.5 bg-primary-900/50 text-primary-300 rounded-full font-medium">{post.topic}</span>
                </div>
            </div>
        </Card>
    );
};

const StickerDisplay: React.FC<{ sticker: Sticker }> = ({ sticker }) => {
    return (
        <Tooltip content={
            <div>
                <p className="font-bold">{sticker.name}</p>
                <p className="text-xs">{sticker.description}</p>
            </div>
        }>
            <div className="p-3 bg-slate-700/50 rounded-full text-2xl transition-transform hover:scale-110">
                {sticker.icon}
            </div>
        </Tooltip>
    )
}

const ProfileView: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user: currentUser } = useContext(UserContext);
    const { t } = useTranslations();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'activity' | 'posts'>('activity');
    
    useEffect(() => {
        const fetchProfileData = async () => {
            if (!userId) {
                setError("User not found.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const [profileData, postData] = await Promise.all([
                    getUserProfile(userId),
                    getCommunityPostsByUser(userId)
                ]);
                
                if (!profileData) {
                    throw new Error("Could not find user profile.");
                }
                setProfile(profileData);
                setPosts(postData);
            } catch (err: any) {
                setError(err.message || "Failed to load profile.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [userId]);
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><SpinnerIcon className="w-10 h-10 animate-spin text-primary-400" /></div>;
    }
    
    if (error || !profile) {
        return <Card className="p-8 text-center text-red-400">{error || "Profile not available."}</Card>;
    }

    const isCurrentUser = currentUser?.uid === profile.uid;
    const memberSince = formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true });
    const lastOnline = formatDistanceToNow(new Date(profile.lastOnline), { addSuffix: true });
    
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <img src={profile.photoURL} alt={profile.displayName} className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-primary-500/50" />
                    <div className="flex-1 text-center sm:text-left">
                        <h2 className="text-3xl font-bold text-white">{profile.displayName}</h2>
                        <div className="flex justify-center sm:justify-start gap-6 mt-3 text-slate-300">
                             <div><span className="font-bold text-white">{profile.followers.length}</span> Followers</div>
                             <div><span className="font-bold text-white">{profile.following.length}</span> Following</div>
                        </div>
                         {profile.bio && <p className="text-slate-300 mt-4 text-center sm:text-left">{profile.bio}</p>}
                        {!isCurrentUser && (
                            <div className="mt-4 flex gap-3 justify-center sm:justify-start">
                                <Button>Follow</Button>
                                <Button className="bg-slate-600 hover:bg-slate-500">Add Friend</Button>
                            </div>
                        )}
                    </div>
                     <div className="text-center sm:text-right text-sm text-slate-400">
                        <p>Last online: {lastOnline}</p>
                        <p>Joined: {memberSince}</p>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card className="p-4 flex items-center justify-between card-lift-hover">
                    <span className="text-lg font-semibold text-slate-300">Total Dirhams</span>
                    <span className="text-2xl font-bold text-amber-400">{profile.score.toLocaleString()}</span>
                </Card>
                 <Card className="p-4 flex items-center justify-between card-lift-hover">
                    <span className="text-lg font-semibold text-slate-300">Leaderboard Rank</span>
                    <span className="text-2xl font-bold text-primary-400">#--</span>
                </Card>
            </div>
            
            {profile.stickers.length > 0 && (
                 <Card className="p-4 card-lift-hover">
                    <h3 className="text-lg font-semibold text-slate-300 mb-3 text-center">Sticker Collection</h3>
                    <div className="flex justify-center gap-4">
                        {profile.stickers.map(sticker => <StickerDisplay key={sticker.id} sticker={sticker} />)}
                    </div>
                </Card>
            )}

             <Card>
                <div className="tabs-container flex border-b border-[var(--color-border-card)]">
                    <button onClick={() => setActiveTab('activity')} className={`tab-button w-1/2 font-semibold flex items-center justify-center gap-2 p-3 ${activeTab === 'activity' ? 'active' : 'text-slate-400 hover:text-white'}`}>
                        <TrophyIcon className="w-5 h-5"/> Activity
                    </button>
                    <button onClick={() => setActiveTab('posts')} className={`tab-button w-1/2 font-semibold flex items-center justify-center gap-2 p-3 ${activeTab === 'posts' ? 'active' : 'text-slate-400 hover:text-white'}`}>
                       <CommunityIcon className="w-5 h-5"/> Posts ({posts.length})
                    </button>
                </div>
                <div className="p-4">
                    {activeTab === 'activity' && (
                        isCurrentUser ? <RecentActivity /> : <p className="text-slate-400 text-center">Recent activity is private.</p>
                    )}
                    {activeTab === 'posts' && (
                        posts.length > 0 ? (
                            <div className="space-y-3">
                                {posts.map(post => <PostCard key={post.id} post={post} />)}
                            </div>
                        ) : (
                            <p className="text-slate-400 text-center py-4">This user hasn't made any posts yet.</p>
                        )
                    )}
                </div>
            </Card>

        </div>
    );
};

export default ProfileView;
