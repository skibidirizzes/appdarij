import React, { useState, useContext, useEffect, useMemo } from 'react';
// FIX: Import useNavigate to handle navigation internally.
import { useNavigate } from 'react-router-dom';
import { useTranslations } from '../hooks/useTranslations.ts';
import { CommunityPost, View } from '../types.ts';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import Modal from './common/Modal.tsx';
import { CommunityIcon, ArrowUpIcon, SpinnerIcon, PencilIcon } from './icons/index.ts';
import { UserContext } from '../context/UserContext.tsx';
import { createCommunityPost, getCommunityPosts } from '../services/firebaseService.ts';

const PostCard: React.FC<{ post: CommunityPost, onNavigate: (path: string) => void; }> = ({ post, onNavigate }) => {
    const { t } = useTranslations();
    
    return (
        <Card className="p-5 flex gap-4 transition-all hover:border-primary-400/50 card-lift-hover">
            <div className="flex flex-col items-center gap-1 w-12 flex-shrink-0">
                <button className="text-slate-400 hover:text-primary-400"><ArrowUpIcon className="w-6 h-6"/></button>
                <span className="font-bold text-white">{post.upvotes}</span>
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <img src={post.author.photoURL} alt={post.author.displayName} className="w-6 h-6 rounded-full" />
                    <button 
                        className="text-sm text-slate-400 hover:underline"
                        onClick={() => onNavigate(`/profile/${post.author.uid}`)}
                    >
                        Posted by {post.author.displayName}
                    </button>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{post.title}</h3>
                <span className="px-2 py-1 text-xs bg-primary-900/50 text-primary-300 rounded-full font-medium mb-2 inline-block">{post.topic}</span>
                <p className="text-slate-300 text-sm mb-4">{post.contentSnippet}</p>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <CommunityIcon className="w-4 h-4"/>
                        <span>{t('community_replies', { count: post.replies })}</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}

const NewPostModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    onPostCreated: () => void
}> = ({ isOpen, onClose, onPostCreated }) => {
    const { t } = useTranslations();
    const { user } = useContext(UserContext);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [topic, setTopic] = useState('');
    const [otherTopic, setOtherTopic] = useState('');
    const [errors, setErrors] = useState<{ title?: string; content?: string; topic?: string; otherTopic?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const topics = ['General', 'Vocabulary', 'Grammar', 'Culture', 'Travel', 'Food', 'Introductions', 'Pronunciation', 'Resources', 'Study Partners', 'Other'];

    const validate = (): boolean => {
        const newErrors: typeof errors = {};
        if (title.trim().length < 7) newErrors.title = "Title must be at least 7 characters.";
        if (content.trim().length < 50) newErrors.content = "Content must be at least 50 characters.";
        if (!topic) newErrors.topic = "Please select a topic.";
        if (topic === 'Other' && otherTopic.trim().length < 20) newErrors.otherTopic = "Custom topic must be at least 20 characters.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    // Validate on change
    useEffect(() => {
        // Run validation but don't show errors until user has interacted
        const newErrors: typeof errors = {};
        if (title && title.trim().length < 7) newErrors.title = "Title must be at least 7 characters.";
        if (content && content.trim().length < 50) newErrors.content = "Content must be at least 50 characters.";
        if (topic === 'Other' && otherTopic && otherTopic.trim().length < 20) newErrors.otherTopic = "Custom topic must be at least 20 characters.";
        setErrors(newErrors);
    }, [title, content, topic, otherTopic]);


    const handleSubmit = async () => {
        if (!validate() || !user) return;
        setIsLoading(true);
        try {
            const finalTopic = topic === 'Other' ? otherTopic.trim() : topic;
            await createCommunityPost({
                author: {
                    uid: user.uid,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                },
                title: title.trim(),
                content: content.trim(),
                topic: finalTopic,
                contentSnippet: content.trim().substring(0, 150) + (content.trim().length > 150 ? '...' : ''),
                tags: [finalTopic.toLowerCase().replace(/\s+/g, '-')], // Simplified tagging
            });
            onPostCreated();
            setTitle('');
            setContent('');
            setTopic('');
            setOtherTopic('');
            setErrors({});
            onClose();
        } catch (e) {
            setErrors({ content: "Failed to create post. Please try again."});
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const isButtonDisabled = isLoading || !title.trim() || !content.trim() || !topic || (topic === 'Other' && !otherTopic.trim()) || Object.keys(errors).length > 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('community_new_post')}>
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Title <span className="text-red-500">*</span></label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className={`w-full p-2 bg-slate-700 border-2 rounded-lg text-white ${errors.title ? 'border-red-500' : 'border-slate-600'}`}
                    />
                    {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                </div>
                <div>
                     <label className="block text-sm font-medium text-slate-300 mb-1">Topic <span className="text-red-500">*</span></label>
                     <select
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        className={`w-full p-2 bg-slate-700 border-2 rounded-lg text-white ${errors.topic ? 'border-red-500' : 'border-slate-600'}`}
                     >
                        <option value="">Select a topic...</option>
                        {topics.map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                     {errors.topic && <p className="text-red-400 text-xs mt-1">{errors.topic}</p>}
                </div>
                {topic === 'Other' && (
                    <div className="animate-fade-in">
                         <label className="block text-sm font-medium text-slate-300 mb-1">Custom Topic <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            value={otherTopic}
                            onChange={e => setOtherTopic(e.target.value)}
                            className={`w-full p-2 bg-slate-700 border-2 rounded-lg text-white ${errors.otherTopic ? 'border-red-500' : 'border-slate-600'}`}
                        />
                        {errors.otherTopic && <p className="text-red-400 text-xs mt-1">{errors.otherTopic}</p>}
                    </div>
                )}
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Content <span className="text-red-500">*</span></label>
                    <textarea 
                        rows={5}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className={`w-full p-2 bg-slate-700 border-2 rounded-lg text-white ${errors.content ? 'border-red-500' : 'border-slate-600'}`}
                    />
                     {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content}</p>}
                </div>
                <Button onClick={handleSubmit} disabled={isButtonDisabled} className="w-full justify-center">
                    {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : "Post"}
                </Button>
            </div>
        </Modal>
    );
}

// FIX: Remove props and use hooks instead.
interface CommunityViewProps {}

const CommunityView: React.FC<CommunityViewProps> = () => {
    const { t } = useTranslations();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [topicFilter, setTopicFilter] = useState('All');

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const fetchedPosts = await getCommunityPosts();
            setPosts(fetchedPosts);
        } catch(e) {
            console.error("Failed to fetch posts:", e);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchPosts();
    }, []);

    const handlePostCreated = () => {
        // Refetch posts after a new one is created
        fetchPosts();
    };

    const uniqueTopics = useMemo(() => {
        const topics = new Set(posts.map(p => p.topic));
        return ['All', ...Array.from(topics)];
    }, [posts]);

    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            const matchesTopic = topicFilter === 'All' || post.topic === topicFilter;
            const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.content.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTopic && matchesSearch;
        });
    }, [posts, topicFilter, searchQuery]);

    return (
        <div className="w-full max-w-4xl mx-auto">
            <NewPostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onPostCreated={handlePostCreated} />
            <Button onClick={() => setIsModalOpen(true)} className="!fixed bottom-24 md:bottom-8 right-8 !rounded-full !p-4 shadow-lg animate-glow-primary z-10">
                <PencilIcon className="w-6 h-6" />
            </Button>

            <div className="text-center mb-8">
                <CommunityIcon className="w-12 h-12 mx-auto text-primary-400 mb-4" />
                <h2 className="text-3xl font-bold text-white">{t('community_title')}</h2>
                <p className="text-primary-300 font-semibold mt-2">{t('community_subtitle')}</p>
            </div>
            
            <Card className="p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder={t('community_search_placeholder')}
                        className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg"
                    />
                    <select
                        value={topicFilter}
                        onChange={e => setTopicFilter(e.target.value)}
                        className="w-full md:w-64 p-2 bg-slate-700 border border-slate-600 rounded-lg"
                    >
                        {uniqueTopics.map(topic => (
                            <option key={topic} value={topic}>{topic === 'All' ? t('community_all_topics') : topic}</option>
                        ))}
                    </select>
                </div>
            </Card>

            {isLoading ? (
                 <div className="text-center p-8"><SpinnerIcon className="w-8 h-8 mx-auto animate-spin" /></div>
            ) : filteredPosts.length > 0 ? (
                <div className="space-y-4">
                    {filteredPosts.map(post => <PostCard key={post.id} post={post} onNavigate={navigate} />)}
                </div>
            ) : (
                <Card className="p-8 text-center card-lift-hover">
                    <h3 className="text-xl font-bold text-white">{t('community_empty_title')}</h3>
                    <p className="text-slate-400 mt-2">{t('community_empty_description')}</p>
                </Card>
            )}
        </div>
    );
};

export default CommunityView;