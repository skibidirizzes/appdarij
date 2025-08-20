import React, { useState, useContext, useMemo, useEffect } from 'react';
import { UserContext } from '../../context/UserContext.tsx';
import Card from '../common/Card.tsx';
import Button from '../common/Button.tsx';
import { LearningTopic, View, WordInfo, Quiz, WordHistoryEntry, LeaderboardEntry, ScriptMode, Story } from '../../types.ts';
import { LEARNING_TOPICS, SPACED_REPETITION_THRESHOLD, LEVELS, STORY_LEVELS } from '../../constants.ts';
import { LockIcon, VocabularyIcon, GrammarIcon, PhrasesIcon, LightbulbIcon, NumberIcon, SwordIcon, TrophyIcon, WordOfTheDayIcon, CheckCircleIcon, BookOpenIcon, SparklesIcon } from '../icons/index.ts';
import { useTranslations } from '../../hooks/useTranslations.ts';
import { getWordOfTheDay, generateQuiz } from '../../services/geminiService.ts';
import { getLeaderboard } from '../../services/firebaseService.ts';
import SpeakButton from '../common/SpeakButton.tsx';
import Skeleton from '../common/Skeleton.tsx';
import HeaderStats from './HeaderStats.tsx';
import HomeSidebarTabs from './HomeSidebarTabs.tsx';
import Tooltip from '../common/Tooltip.tsx';
import { TranslationKey } from '../../localization/translations.ts';

const VOCAB_SUB_CATEGORIES = [
  { key: 'family', nameKey: 'vocab_family', englishName: 'Family & People', icon: '👨‍👩‍👧‍👦' },
  { key: 'food', nameKey: 'vocab_food', englishName: 'Food & Dining', icon: '🍲' },
  { key: 'travel', nameKey: 'vocab_travel', englishName: 'Travel & Directions', icon: '✈️' },
  { key: 'emergency', nameKey: 'vocab_emergency', englishName: 'Emergency & Health', icon: '🚑' },
  { key: 'greetings', nameKey: 'vocab_greetings', englishName: 'Greetings & Politeness', icon: '👋' },
  { key: 'shopping', nameKey: 'vocab_shopping', englishName: 'Shopping & Money', icon: '🛍️' },
] as const;


const DarijaText: React.FC<{ text: { latin: string; arabic?: string; }; scriptMode: ScriptMode; as?: React.ElementType; className?: string; }> = ({ text, scriptMode, as: Component = 'span', className}) => {
  if (!text.arabic) {
    return <Component className={className}>{text.latin}</Component>;
  }
  if (scriptMode === 'arabic') {
    return <Component className={`font-arabic text-xl ${className}`}>{text.arabic}</Component>;
  }
  if (scriptMode === 'latin') {
    return <Component className={className}>{text.latin}</Component>;
  }
  // both
  return (
    <Component className={className}>
      {text.latin}{' '}
      <span className="font-arabic text-slate-400">({text.arabic})</span>
    </Component>
  );
};

interface HomeViewProps {
  onStartQuiz: (topic: LearningTopic, level: number, wordToReview?: WordInfo, subCategory?: string) => void;
  onStartCustomQuiz: (quiz: Quiz, topic: LearningTopic) => void;
  onNavigate: (view: View | { name: View; params?: any }) => void;
}

const TopicIcons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    'Vocabulary': VocabularyIcon,
    'Grammar': GrammarIcon,
    'Common Phrases': PhrasesIcon,
    'Numbers': NumberIcon,
};

const LEVEL_COORDS = [
  { x: 10, y: 85 }, { x: 25, y: 75 }, { x: 15, y: 60 }, { x: 30, y: 50 }, { x: 20, y: 35 },
  { x: 40, y: 25 }, { x: 55, y: 35 }, { x: 50, y: 55 }, { x: 65, y: 65 }, { x: 80, y: 50 },
];

const LearningPath: React.FC<{
    topic: LearningTopic;
    isLevelUnlocked: (topic: LearningTopic, level: number) => boolean;
    onStartQuiz: (topic: LearningTopic, level: number) => void;
    userProgress: any;
    t: (key: TranslationKey, replacements?: any) => string;
    subCategoryNameKey?: TranslationKey;
}> = ({ topic, isLevelUnlocked, onStartQuiz, userProgress, t, subCategoryNameKey }) => {
    
    const topicInfo = useMemo(() => LEARNING_TOPICS.find(tInfo => tInfo.name === topic), [topic]);
    const pathData = LEVEL_COORDS.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');

    if (!topicInfo) return null;

    return (
        <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
                {React.createElement(TopicIcons[topic], { className: "w-8 h-8 text-primary-400" })}
                <div>
                    <h3 className="text-xl font-bold text-white">
                        {t(topicInfo.nameKey)}
                        {subCategoryNameKey && <span className="text-primary-400">: {t(subCategoryNameKey)}</span>}
                    </h3>
                    <p className="text-sm text-slate-400">{t(topicInfo.descriptionKey)}</p>
                </div>
            </div>
             <div className="learning-path-container">
                <div 
                    className="learning-path-bg"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558328423-3e3a47936a2d?q=80&w=1974&auto=format&fit=crop')" }}
                ></div>
                <svg className="learning-path-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d={pathData} stroke="var(--color-border-card)" strokeWidth="3" fill="none" strokeDasharray="5,5" />
                </svg>

                {LEVELS.slice(0, 10).map((level, index) => {
                    const unlocked = isLevelUnlocked(topic, level);
                    const progress = userProgress?.[topic]?.[level];
                    const completed = (progress?.completedCount || 0) > 0;
                    const highScore = progress?.highScore * 10 || 0;
                    const coords = LEVEL_COORDS[index];

                    const tooltipContent = (
                        <div>
                            <p className="font-bold">{t('quiz_level_label')} {level}</p>
                            {completed && <p>High Score: {highScore} DH</p>}
                        </div>
                    );

                    return (
                        <div 
                          key={`${topic}-${level}`} 
                          className="learning-path-stop"
                          style={{ left: `${coords.x}%`, top: `${coords.y}%`, transform: 'translate(-50%, -50%)' }}
                        >
                            <Tooltip content={tooltipContent}>
                                <button
                                    onClick={() => onStartQuiz(topic, level)}
                                    disabled={!unlocked}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 disabled:cursor-not-allowed ${
                                        completed ? 'border-primary-500 bg-primary-900/80' : 
                                        unlocked ? 'border-slate-500 bg-slate-700' : 
                                        'border-slate-700 bg-slate-800'
                                    }`}
                                    aria-label={`${t('quiz_level_label')} ${level}`}
                                >
                                    {unlocked ? (
                                        completed ? <CheckCircleIcon className="w-5 h-5 text-primary-400" /> : <span className="font-bold text-white">{level}</span>
                                    ) : (
                                        <LockIcon className="w-5 h-5 text-slate-500" />
                                    )}
                                </button>
                            </Tooltip>
                        </div>
                    )
                })}
            </div>
        </Card>
    );
};


const MiniLeaderboard: React.FC<{ onNavigate: (view: View | { name: View; params?: any }) => void; }> = ({ onNavigate }) => {
    const { user } = useContext(UserContext);
    const { t } = useTranslations();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [catchUpInfo, setCatchUpInfo] = useState<{ name: string; diff: number } | null>(null);

    useEffect(() => {
        if (!user) return;
        getLeaderboard().then(data => {
            setLeaderboard(data);
            setIsLoading(false);
            const rankIndex = data.findIndex(u => u.uid === user.uid);
            if (rankIndex > 0) { // If not first and in the list
                const userAbove = data[rankIndex - 1];
                const scoreDiff = userAbove.score - user.score;
                if (scoreDiff > 0) {
                    setCatchUpInfo({ name: userAbove.displayName, diff: scoreDiff });
                }
            } else {
                setCatchUpInfo(null);
            }
        }).catch(() => setIsLoading(false));
    }, [user]);

    const userRankInfo = useMemo(() => {
        if (!user) return { rank: 'N/A', isTop3: false };
        const rankIndex = leaderboard.findIndex(u => u.uid === user.uid);
        if (rankIndex === -1) return { rank: 'N/A', isTop3: false };
        return { rank: rankIndex + 1, isTop3: rankIndex < 3 };
    }, [leaderboard, user]);

    if (!user) return null;
    
    return (
        <Card className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">{t('leaderboard_title')}</h3>
            {isLoading ? (
                 <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
            ) : (
                <div className="space-y-2">
                    {leaderboard.slice(0, 3).map((entry, index) => (
                        <button 
                            key={entry.uid} 
                            onClick={() => onNavigate({ name: 'profile', params: { userId: entry.uid }})}
                            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors animate-stagger-fade-in ${entry.uid === user.uid ? 'bg-primary-900/50' : 'bg-slate-800/60 hover:bg-slate-700/50'}`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <span className="font-bold text-lg w-6 text-center text-slate-400">{entry.rank <= 3 ? (
                                <TrophyIcon className={`w-5 h-5 mx-auto ${
                                    entry.rank === 1 ? 'text-amber-400' :
                                    entry.rank === 2 ? 'text-slate-400' :
                                    'text-amber-700'
                                }`} />
                            ) : entry.rank}</span>
                            <img src={entry.photoURL} alt={entry.displayName} className="w-8 h-8 rounded-full" />
                            <p className="font-semibold text-white truncate flex-1 text-left">{entry.displayName}</p>
                            <p className="font-bold text-amber-400">{entry.score.toLocaleString()}</p>
                        </button>
                    ))}
                    {!userRankInfo.isTop3 && userRankInfo.rank !== 'N/A' && (
                         <>
                            <div className="text-center text-slate-500 text-2xl leading-none my-1">...</div>
                             <div className="flex items-center gap-3 p-2 rounded-lg bg-primary-900/50">
                                <span className="font-bold text-lg w-6 text-center text-slate-400">{userRankInfo.rank}</span>
                                <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full" />
                                <p className="font-semibold text-white truncate flex-1">{user.displayName}</p>
                                <p className="font-bold text-amber-400">{user.score.toLocaleString()}</p>
                            </div>
                        </>
                    )}
                    {catchUpInfo && (
                        <div className="text-center text-sm text-slate-400 pt-3 border-t border-slate-700 mt-3">
                            {t('leaderboard_catch_up', { diff: catchUpInfo.diff.toLocaleString(), name: catchUpInfo.name })}
                        </div>
                    )}
                </div>
            )}
            <Button onClick={() => onNavigate('leaderboard')} className="mt-4 w-full justify-center">
                {t('leaderboard_title')}
            </Button>
        </Card>
    )
}

const HomeView: React.FC<HomeViewProps> = ({ onStartQuiz, onNavigate, onStartCustomQuiz }) => {
  const { user, isLevelUnlocked, mistakeAnalysis, addInfoToast } = useContext(UserContext);
  const [selectedTopic, setSelectedTopic] = useState<LearningTopic>('Vocabulary');
  const [selectedVocabSubCategory, setSelectedVocabSubCategory] = useState<typeof VOCAB_SUB_CATEGORIES[number]['key'] | null>(null);
  const [wordOfTheDay, setWordOfTheDay] = useState<WordInfo | null>(null);
  const [isLoadingWord, setIsLoadingWord] = useState(true);
  const { t, language } = useTranslations();

  useEffect(() => {
    const fetchWord = async () => {
        setIsLoadingWord(true);
        try {
            const cachedWord = sessionStorage.getItem('wordOfTheDay');
            const cacheDate = sessionStorage.getItem('wordOfTheDayDate');
            const today = new Date().toISOString().split('T')[0];
            if (cachedWord && cacheDate === today) {
                setWordOfTheDay(JSON.parse(cachedWord));
            } else {
                const word = await getWordOfTheDay(language);
                setWordOfTheDay(word);
                sessionStorage.setItem('wordOfTheDay', JSON.stringify(word));
                sessionStorage.setItem('wordOfTheDayDate', today);
            }
        } catch (e) {
            console.error("Failed to fetch word of the day", e);
        } finally {
            setIsLoadingWord(false);
        }
    };
    fetchWord();
  }, [language]);
  
    const wordsForRepetition = useMemo(() => {
        if (!user) return [];
        const now = Date.now();
        const seenWords = new Set<string>();
        // Iterate backwards to get most recent entries first
        return user.wordHistory
            .slice()
            .reverse()
            .filter(entry => {
                if (!entry.isCorrect || seenWords.has(entry.latin.toLowerCase())) {
                    return false;
                }
                const isReady = (now - entry.timestamp) > SPACED_REPETITION_THRESHOLD;
                if (isReady) {
                    seenWords.add(entry.latin.toLowerCase());
                }
                return isReady;
            });
    }, [user]);

    const unlockedStory = useMemo(() => {
        if (!user) return null;
        const story = STORY_LEVELS[0];
        if (!story) return null;
        
        const isUnlocked = Object.values(user.progress).some(topicProgress => 
            Object.keys(topicProgress).some(level => parseInt(level) >= story.levelUnlock)
        );
        return isUnlocked ? story : null;
    }, [user]);

    const handleStartSpacedRepetitionQuiz = async (words: WordHistoryEntry[]) => {
        const quiz = await generateQuiz('Spaced Repetition', 1, undefined, words);
        onStartCustomQuiz(quiz, 'Spaced Repetition');
    };

    const suggestion = useMemo(() => {
        if (!user) return null;
        // Priority 0: AI Smart Suggestion
        if (mistakeAnalysis) {
            return {
                text: mistakeAnalysis,
                buttonText: t('home_smart_review_button'),
                action: () => onNavigate('mistakes-bank'),
                isSmart: true,
            };
        }
        
        // Priority 1: Spaced Repetition
        if (wordsForRepetition.length >= 5) {
            return {
                text: t('home_suggestion_spaced_repetition'),
                buttonText: t('home_review_mistakes_button'),
                action: () => handleStartSpacedRepetitionQuiz(wordsForRepetition.slice(0, 15)),
            };
        }
        
        // Priority 2: Continue weakest topic
        let minLevel = 999;
        let minTopicInfo: (typeof LEARNING_TOPICS)[0] | null = null;
        
        LEARNING_TOPICS.forEach(topicInfo => {
            const topic = topicInfo.name;
            const progress = user.progress[topic];
            const maxLevelCompleted = progress ? Math.max(0, ...Object.keys(progress).map(Number).filter(level => progress[level].completedCount > 0)) : 0;
            
            if (maxLevelCompleted < minLevel) {
                minLevel = maxLevelCompleted;
                minTopicInfo = topicInfo;
            }
        });

        if (minTopicInfo && minLevel < 50 && isLevelUnlocked(minTopicInfo.name, minLevel + 1)) {
            const nextLevel = minLevel + 1;
            return {
                text: t('home_suggestion_continue_topic', { topic: t(minTopicInfo.nameKey), level: nextLevel }),
                buttonText: t('home_suggestion_button'),
                action: () => onStartQuiz(minTopicInfo!.name, nextLevel),
            };
        }

        // Fallback: Start a new topic
        const topicsNotStarted = LEARNING_TOPICS.filter(topicInfo => !user.progress[topicInfo.name]);
        if (topicsNotStarted.length > 0) {
            const topicToStart = topicsNotStarted[0];
            return {
                text: t('home_suggestion_start_topic', { topic: t(topicToStart.nameKey) }),
                buttonText: t('home_suggestion_button'),
                action: () => onStartQuiz(topicToStart.name, 1),
            };
        }

        // Final fallback
        return {
            text: t('home_suggestion_all_done'),
            buttonText: t('home_suggestion_all_done_button'),
            action: () => onNavigate('triliteral-root'),
        };

    }, [user, t, onStartQuiz, onNavigate, isLevelUnlocked, wordsForRepetition, onStartCustomQuiz, mistakeAnalysis]);
    
    if (!user || !suggestion) {
        return null; // Or a loading spinner
    }
    
    const subCat = selectedTopic === 'Vocabulary' && selectedVocabSubCategory 
        ? VOCAB_SUB_CATEGORIES.find(sc => sc.key === selectedVocabSubCategory) 
        : null;

    return (
        <div className="w-full space-y-8 animate-fade-in">
            <header>
                <h1 className="text-4xl font-bold text-white">{t('home_welcome', { name: user.displayName || user.email })}</h1>
                <p className="text-slate-300 text-lg mt-2">{t('home_subtitle')}</p>
            </header>

            <HeaderStats />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Suggestion Card */}
                    <div className="relative">
                        <Card className="bg-primary-900/50 border-primary-500/50 animate-glow-primary">
                            <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <LightbulbIcon className="w-8 h-8 text-primary-400 flex-shrink-0" />
                                    <div>
                                        <h3 className={`font-bold text-white ${suggestion.isSmart ? 'italic' : ''}`}>{suggestion.text}</h3>
                                    </div>
                                </div>
                                <Button onClick={suggestion.action} className="flex-shrink-0 w-full sm:w-auto z-10">{suggestion.buttonText}</Button>
                            </div>
                        </Card>
                        {suggestion.isSmart && <SparklesIcon className="absolute -top-3 -right-3 w-6 h-6 text-amber-300 animate-pulse" style={{ animationDuration: '2s' }} />}
                        {suggestion.isSmart && <SparklesIcon className="absolute -bottom-2 -left-2 w-5 h-5 text-sky-300 animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}/>}
                    </div>

                    {unlockedStory && (
                         <Card>
                            <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                               <div className="flex items-center gap-4">
                                    <BookOpenIcon className="w-8 h-8 text-primary-400 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-white">Story Time Unlocked!</h3>
                                        <p className="text-sm text-slate-300">Practice your reading and pronunciation with an interactive story.</p>
                                    </div>
                                </div>
                                <Button onClick={() => onNavigate({ name: 'story-mode', params: { story: unlockedStory } })} className="flex-shrink-0 w-full sm:w-auto">
                                    Read "{unlockedStory.title}"
                                </Button>
                            </div>
                         </Card>
                    )}

                    {/* Learning Path */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">{t('home_topics_title')}</h2>
                         <div className="flex flex-wrap gap-2">
                             {LEARNING_TOPICS.map(topicInfo => (
                                 <Button
                                     key={topicInfo.name}
                                     onClick={() => {
                                        setSelectedTopic(topicInfo.name);
                                        setSelectedVocabSubCategory(null);
                                     }}
                                     className={selectedTopic === topicInfo.name ? '' : 'bg-slate-700/80 hover:bg-slate-600/80'}
                                 >
                                     {t(topicInfo.nameKey)}
                                 </Button>
                             ))}
                         </div>

                        {selectedTopic === 'Vocabulary' && !selectedVocabSubCategory && (
                            <Card className="p-6 animate-fade-in">
                                <h3 className="text-xl font-bold text-white mb-4">Choose a Vocabulary Category</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {VOCAB_SUB_CATEGORIES.map(subCat => (
                                        <button
                                            key={subCat.key}
                                            onClick={() => setSelectedVocabSubCategory(subCat.key)}
                                            className="p-4 rounded-lg bg-slate-700/80 hover:bg-slate-600/80 transition-all transform hover:scale-105"
                                        >
                                            <div className="text-4xl mb-2">{subCat.icon}</div>
                                            <p className="font-semibold text-white">{t(subCat.nameKey)}</p>
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        )}
                        
                        {(selectedTopic !== 'Vocabulary' || selectedVocabSubCategory) && (
                            <div className="animate-fade-in">
                                {selectedTopic === 'Vocabulary' && selectedVocabSubCategory && (
                                    <div className="mb-4">
                                        <Button onClick={() => setSelectedVocabSubCategory(null)} size="sm" className="bg-slate-600 hover:bg-slate-500">
                                            &larr; Back to Categories
                                        </Button>
                                    </div>
                                )}
                                {selectedTopic && <LearningPath 
                                    topic={selectedTopic} 
                                    isLevelUnlocked={isLevelUnlocked} 
                                    subCategoryNameKey={subCat?.nameKey}
                                    onStartQuiz={(topic, level) => {
                                        const subCatFound = VOCAB_SUB_CATEGORIES.find(sc => sc.key === selectedVocabSubCategory);
                                        onStartQuiz(topic, level, undefined, subCatFound?.englishName);
                                    }}
                                    userProgress={user.progress} 
                                    t={t} 
                                />}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-1 space-y-6">
                    <img 
                      src="https://cdn.dribbble.com/users/1092276/screenshots/6253995/camel_character_animation_dribbble.gif"
                      alt="Animated Mascot"
                      className="home-mascot animate-float"
                    />
                     <Card className="p-6">
                         <h3 className="text-xl font-bold text-white mb-2">Quick Duel</h3>
                         <p className="text-slate-300 text-sm">Challenge a friend to a quick quiz and test your skills!</p>
                         <Button onClick={() => onNavigate('duel-setup')} className="mt-4 w-full justify-center flex items-center gap-2">
                            <SwordIcon className="w-5 h-5"/>
                             Start a Duel
                         </Button>
                     </Card>
                     <HomeSidebarTabs />
                     <MiniLeaderboard onNavigate={onNavigate} />
                    {/* Word of the Day */}
                    <Card>
                         <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <WordOfTheDayIcon className="w-6 h-6 text-primary-400"/>
                                    {t('home_word_of_the_day')}
                                </h2>
                                {wordOfTheDay && <SpeakButton textToSpeak={wordOfTheDay.arabic} />}
                            </div>
                            {isLoadingWord ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-8 w-1/2" />
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-5 w-full mt-2" />
                                    <Skeleton className="h-5 w-2/3" />
                                </div>
                            ) : wordOfTheDay ? (
                                <div className="space-y-2">
                                    <DarijaText text={wordOfTheDay} scriptMode={user.settings.scriptMode} as="h3" className="text-2xl font-bold text-white" />
                                    <p className="text-slate-300">{wordOfTheDay.definition}</p>
                                    <div className="pt-2 text-sm">
                                        <p className="font-semibold text-slate-400">
                                            "<DarijaText text={wordOfTheDay.examples[0]} scriptMode={user.settings.scriptMode} />"
                                        </p>
                                        <p className="text-slate-400 italic">"{wordOfTheDay.examples[0].translation}"</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-300">{t('home_word_of_the_day_error')}</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default HomeView;