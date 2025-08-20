import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import firebase from 'firebase/compat/app';
import { UserProfile, UserSettings, LearningTopic, AchievementID, Achievement, UpdateUserPayload, UserContextType, QuizQuestion, UserAnswer, Mistake, OfflineQuizResult, WordHistoryEntry, InfoToastData, ActivePopup, QuestProgress, Quest, SentenceFormationQuestion, Friend, createNewDefaultUser } from '../types.ts';
import { LOCAL_STORAGE_KEY, ACHIEVEMENTS, LEARNING_TOPICS, LEVELS, QUIZ_LENGTH, POINTS_PER_CORRECT_ANSWER, WRITING_SIMILARITY_THRESHOLD, XP_PER_DAILY_LOGIN, XP_PER_REVIEW_QUIZ, OFFLINE_QUEUE_KEY, XP_PER_FIRST_CONVO, AVAILABLE_QUESTS, STICKERS } from '../constants.ts';
import { calculateSimilarity } from '../utils/stringSimilarity.ts';
import { auth, firestore, requestAndSaveToken, getUserProfile, createUserProfile, updateUserProfile, signOut, getUsersByIds } from '../services/firebaseService.ts';
import { getWeek } from 'date-fns';
import { triggerConfetti } from '../utils/confetti.ts';
import { analyzeMistakes } from '../services/geminiService.ts';


export const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  updateUser: () => {},
  submitQuizResults: () => {},
  updateSettings: async () => {},
  updateProfileDetails: async () => {},
  resetAllData: async () => {},
  clearProgress: () => {},
  clearMistakes: async () => {},
  logout: async () => {},
  newlyUnlockedAchievements: [],
  clearNewlyUnlockedAchievements: () => {},
  isLevelUnlocked: () => false,
  enableNotifications: async () => false,
  addInfoToast: () => {},
  infoToasts: [],
  syncOfflineResults: async () => {},
  activePopup: null,
  setActivePopup: () => {},
  markThemePromptAsSeen: () => {},
  markFriendsPromptAsSeen: () => {},
  markNotificationPromptAsSeen: () => {},
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  sendFriendRequest: async () => false,
  respondToFriendRequest: async () => false,
  removeFriend: async () => false,
  mistakeAnalysis: null,
  useStreakFreeze: async () => false,
});


export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<Omit<Achievement, 'name' | 'description'>[]>([]);
  const [infoToasts, setInfoToasts] = useState<InfoToastData[]>([]);
  const [activePopup, setActivePopup] = useState<ActivePopup>(null);
  const [mistakeAnalysis, setMistakeAnalysis] = useState<string | null>(null);
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Friend[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Friend[]>([]);


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile = await getUserProfile(firebaseUser.uid);
        if (userProfile) {
          // Existing user
          setUser(userProfile);
        } else {
          // New user (e.g., first Google sign-in) needs a profile created.
          const { email, displayName, photoURL, uid, isAnonymous } = firebaseUser;
          const defaultUser = createNewDefaultUser();
          const newUser: UserProfile = {
            ...defaultUser,
            uid,
            email: email || '',
            displayName: displayName || 'New User',
            photoURL: photoURL || `https://api.dicebear.com/8.x/miniavs/svg?seed=${uid}`,
            isAnonymous,
          };
          await createUserProfile(uid, newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addInfoToast = useCallback((toast: Omit<InfoToastData, 'id'>) => {
    const newToast = { ...toast, id: Date.now().toString() };
    setInfoToasts(prev => [...prev, newToast]);
    setTimeout(() => {
        setInfoToasts(current => current.filter(t => t.id !== newToast.id));
    }, 5000);
  }, []);

  // Simplified updateUser - direct updates are now preferred.
  const updateUser = useCallback(async (payload: UpdateUserPayload) => {
    if (!user) return;
    // Direct updates are better handled in functions like submitQuizResults
  }, [user]);

  const submitQuizResults = useCallback(async (topic: LearningTopic, level: number | null, answers: UserAnswer[], quizQuestions: QuizQuestion[]) => {
    if(!user) return;
    
    let correctCount = 0;
    let newMistakes: Mistake[] = [];
    let newWordHistory: WordHistoryEntry[] = [];
    
    quizQuestions.forEach((q, i) => {
        let isCorrect = false;
        if (q.type === 'multiple-choice') isCorrect = answers[i] === q.correctAnswerIndex;
        else if ((q.type === 'writing' || q.type === 'speaking') && typeof answers[i] === 'string') isCorrect = calculateSimilarity(answers[i] as string, q.correctAnswer.latin) >= WRITING_SIMILARITY_THRESHOLD;
        else if (q.type === 'sentence-formation' && Array.isArray(answers[i])) isCorrect = (answers[i] as string[]).join(' ') === q.correctSentence.join(' ');
        
        if (!isCorrect && answers[i] !== null && answers[i] !== 'skipped' && answers[i] !== 'idk') newMistakes.push({ question: q, userAnswer: answers[i] });
        if (q.targetWord) newWordHistory.push({ latin: q.targetWord.latin, arabic: q.targetWord.arabic, isCorrect, timestamp: Date.now() });
        if (isCorrect) correctCount++;
    });

    const scoreGained = correctCount * POINTS_PER_CORRECT_ANSWER;
    const updates: { [key: string]: any } = {
        score: firebase.firestore.FieldValue.increment(scoreGained),
        questionsAnswered: firebase.firestore.FieldValue.increment(quizQuestions.length),
        correctAnswers: firebase.firestore.FieldValue.increment(correctCount),
        quizzesCompleted: firebase.firestore.FieldValue.increment(1),
        mistakes: firebase.firestore.FieldValue.arrayUnion(...newMistakes),
        wordHistory: firebase.firestore.FieldValue.arrayUnion(...newWordHistory),
    };
    
    if (topic !== 'Personalized Review' && topic !== 'Spaced Repetition' && level !== null) {
        const currentHighScore = user.progress?.[topic]?.[level]?.highScore || 0;
        updates[`progress.${topic}.${level}.completedCount`] = firebase.firestore.FieldValue.increment(1);
        updates[`progress.${topic}.${level}.highScore`] = Math.max(currentHighScore, correctCount);
    }
    
    await updateUserProfile(user.uid, updates);
    // Refresh user state from DB to reflect increments
    const updatedUser = await getUserProfile(user.uid);
    if (updatedUser) setUser(updatedUser);

  }, [user]);
  
   const updateSettings = async (settings: Partial<UserSettings>) => {
    if(!user) return;
    await updateUserProfile(user.uid, { settings: { ...user.settings, ...settings } });
    setUser(prev => prev ? ({ ...prev, settings: {...prev.settings, ...settings }}) : null);
  };
  
  const updateProfileDetails = async (details: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'hasCompletedOnboarding' | 'bio'>>) => {
    if(!user) return;
    await updateUserProfile(user.uid, details);
    setUser(prev => prev ? ({...prev, ...details}) : null);
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  const clearMistakes = async () => {
    if (!user) return;
    await updateUserProfile(user.uid, { mistakes: [] });
    setUser(prev => prev ? ({ ...prev, mistakes: [] }) : null);
    addInfoToast({ type: 'info', message: 'Mistake history cleared.' });
  };
  
  const clearNewlyUnlockedAchievements = useCallback(() => setNewlyUnlockedAchievements([]), []);
  
  const isLevelUnlocked = useCallback((topic: LearningTopic, level: number): boolean => {
      if (!user) return false;
      if (level === 1) return true;
      const topicProgress = user.progress[topic];
      if (!topicProgress) return false;
      const prevLevelProgress = topicProgress[level - 1];
      return (prevLevelProgress?.completedCount || 0) > 0;
  }, [user]);

  // Syncing offline results
  const syncOfflineResults = useCallback(async () => {
    const offlineQueueJson = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!offlineQueueJson || !user) return;
    
    const queue: OfflineQuizResult[] = JSON.parse(offlineQueueJson);
    if (queue.length === 0) return;
    
    addInfoToast({ type: 'info', message: `Syncing ${queue.length} saved quiz results...` });

    for (const result of queue) {
        await submitQuizResults(result.topic, result.level, result.answers, result.quizQuestions);
    }
    
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    addInfoToast({ type: 'success', message: `Sync complete!` });

  }, [submitQuizResults, addInfoToast, user]);

    const useStreakFreeze = useCallback(async (): Promise<boolean> => {
    if (!user || user.streakFreeses.available <= 0) {
        return false;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (user.streakFreeses.lastUsedDate === todayStr) {
        // Already used today
        return false;
    }

    try {
        const updates = {
            'streakFreeses.available': firebase.firestore.FieldValue.increment(-1),
            'streakFreeses.lastUsedDate': todayStr,
        };
        await updateUserProfile(user.uid, updates);
        setUser(prev => {
            if (!prev) return null;
            return {
                ...prev,
                streakFreeses: {
                    available: prev.streakFreeses.available - 1,
                    lastUsedDate: todayStr,
                }
            };
        });
        return true;
    } catch (error) {
        console.error("Failed to use streak freeze:", error);
        return false;
    }
  }, [user]);
  
  const resetAllData = async () => {};
  const clearProgress = () => {};
  const enableNotifications = async () => false;
  const markThemePromptAsSeen = async () => { if(user) await updateUserProfile(user.uid, { hasSeenThemePrompt: true }) };
  const markFriendsPromptAsSeen = async () => { if(user) await updateUserProfile(user.uid, { hasSeenFriendsPrompt: true }) };
  const markNotificationPromptAsSeen = async () => { if(user) await updateUserProfile(user.uid, { hasSeenNotificationPrompt: true }) };

  const contextValue = useMemo(() => ({
    user, isLoading, updateUser, submitQuizResults, updateSettings, updateProfileDetails,
    resetAllData, clearProgress, clearMistakes, logout, newlyUnlockedAchievements,
    clearNewlyUnlockedAchievements, isLevelUnlocked, enableNotifications,
    addInfoToast, infoToasts, syncOfflineResults, activePopup, setActivePopup,
    markThemePromptAsSeen, markFriendsPromptAsSeen, markNotificationPromptAsSeen,
    friends, incomingRequests, outgoingRequests,
    sendFriendRequest: async () => false,
    respondToFriendRequest: async () => false,
    removeFriend: async () => false,
    mistakeAnalysis,
    useStreakFreeze,
  }), [
    user, isLoading, updateUser, submitQuizResults, updateSettings, updateProfileDetails, logout, 
    newlyUnlockedAchievements, clearNewlyUnlockedAchievements, isLevelUnlocked,
    addInfoToast, infoToasts, syncOfflineResults, activePopup, mistakeAnalysis, friends, incomingRequests, outgoingRequests, useStreakFreeze
  ]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};