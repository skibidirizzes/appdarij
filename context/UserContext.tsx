import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, UserSettings, LearningTopic, AchievementID, Achievement, UpdateUserPayload, UserContextType, QuizQuestion, UserAnswer, Mistake, OfflineQuizResult, WordHistoryEntry, InfoToastData, ActivePopup, QuestProgress, Quest, SentenceFormationQuestion, Friend, createNewDefaultUser } from '../types.ts';
import { LOCAL_STORAGE_KEY, ACHIEVEMENTS, LEARNING_TOPICS, LEVELS, QUIZ_LENGTH, POINTS_PER_CORRECT_ANSWER, WRITING_SIMILARITY_THRESHOLD, XP_PER_DAILY_LOGIN, XP_PER_REVIEW_QUIZ, OFFLINE_QUEUE_KEY, XP_PER_FIRST_CONVO, AVAILABLE_QUESTS, STICKERS } from '../constants.ts';
import { calculateSimilarity } from '../utils/stringSimilarity.ts';
import { auth, requestAndSaveToken } from '../services/firebaseService.ts';
import { getWeek } from 'date-fns';
import { triggerConfetti } from '../utils/confetti.ts';
import { analyzeMistakes } from '../services/geminiService.ts';


export const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  updateUser: () => {},
  submitQuizResults: () => {},
  updateSettings: () => {},
  updateProfileDetails: () => {},
  resetAllData: async () => {},
  clearProgress: () => {},
  clearMistakes: () => {},
  logout: async () => {},
  newlyUnlockedAchievements: [],
  clearNewlyUnlockedAchievements: () => {},
  isLevelUnlocked: () => false,
  enableNotifications: async () => false,
  useStreakFreeze: async () => false,
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
});


export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<Omit<Achievement, 'name' | 'description'>[]>([]);
  const [infoToasts, setInfoToasts] = useState<InfoToastData[]>([]);
  const [activePopup, setActivePopup] = useState<ActivePopup>(null);
  const [mistakeAnalysis, setMistakeAnalysis] = useState<string | null>(null);

  const getWeekIdentifier = (date: Date) => `${date.getFullYear()}-${getWeek(date)}`;
  
  // Load user from localStorage on app start
  useEffect(() => {
    try {
        const storedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    } catch (error) {
        console.error("Failed to load user from localStorage", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    } finally {
        setIsLoading(false);
    }
  }, []);
  
  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user && !isLoading) {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
        } catch (error) {
            console.error("Failed to save user to localStorage", error);
        }
    }
  }, [user, isLoading]);
  
   // Monthly Streak Freeze Grant
  useEffect(() => {
      if (user && !isLoading) {
          const today = new Date();
          const currentMonthIdentifier = `${today.getFullYear()}-${today.getMonth()}`;
          const lastGrant = user.streakFreeses.lastMonthlyGrant;

          if (lastGrant !== currentMonthIdentifier) {
              setUser(currentUser => {
                  if (!currentUser || currentUser.streakFreeses.lastMonthlyGrant === currentMonthIdentifier) {
                      return currentUser; 
                  }
                  addInfoToast({ type: 'success', message: "You've received your monthly Streak Freeze!" });
                  return {
                      ...currentUser,
                      streakFreeses: {
                          ...currentUser.streakFreeses,
                          available: Math.min(3, currentUser.streakFreeses.available + 1), // Max 3 freezes
                          lastMonthlyGrant: currentMonthIdentifier,
                      }
                  };
              });
          }
      }
  }, [user, isLoading]);


  const addInfoToast = useCallback((toast: Omit<InfoToastData, 'id'>) => {
    const newToast = { ...toast, id: Date.now().toString() };
    setInfoToasts(prev => [...prev, newToast]);
    setTimeout(() => {
        setInfoToasts(current => current.filter(t => t.id !== newToast.id));
    }, 5000);
  }, []);

  const awardStickers = useCallback((currentUser: UserProfile) => {
      const awardedStickers = [...currentUser.stickers];
      let newStickerAwarded = false;

      Object.values(STICKERS).forEach(stickerDef => {
          const alreadyHas = currentUser.stickers.some(s => s.id === stickerDef.id);
          if (!alreadyHas && stickerDef.criteria(currentUser)) {
              awardedStickers.push(stickerDef);
              newStickerAwarded = true;
              addInfoToast({
                  type: 'success',
                  message: `Sticker Unlocked: ${stickerDef.icon} ${stickerDef.name}`,
              });
          }
      });

      if (newStickerAwarded) {
          return awardedStickers;
      }
      return null; // Return null if no new stickers
  }, [addInfoToast]);

  const updateUser = useCallback((payload: UpdateUserPayload) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      let updatedUser = { ...prevUser };
      
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const currentWeek = getWeekIdentifier(today);

      // Reset daily/weekly progress if it's a new day/week
      if (updatedUser.lastActivityDate !== todayStr) {
          updatedUser.dailyXp = 0;
      }
      if (updatedUser.weeklyProgress.date !== currentWeek) {
          updatedUser.weeklyProgress = { date: currentWeek, quizzes: 0, words: 0, dhGained: 0 };
      }
      
      // Update values
      if (payload.score) updatedUser.score += payload.score;
      if (payload.questionsAnswered) updatedUser.questionsAnswered += payload.questionsAnswered;
      if (payload.correctAnswers) updatedUser.correctAnswers += payload.correctAnswers;
      if (payload.quizCompleted) updatedUser.quizzesCompleted += payload.quizCompleted;
      if (payload.xpGained) {
          updatedUser.dailyXp += payload.xpGained;
          updatedUser.weeklyProgress.dhGained += payload.xpGained;
      }
       if (payload.hasUsedConversation) updatedUser.hasUsedConversation = true;
      if (payload.newWordsLearned) updatedUser.weeklyProgress.words += payload.newWordsLearned;
      
      if (typeof payload.isCorrect !== 'undefined') {
          if (payload.isCorrect) {
              updatedUser.correctAnswersInRow += 1;
          } else {
              updatedUser.correctAnswersInRow = 0;
          }
      }
      
      // Handle Streak Logic
      const lastCompleted = new Date(prevUser.lastCompletedDate || '2000-01-01');
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      if(updatedUser.dailyXp >= updatedUser.settings.dailyGoal && updatedUser.dailyGoalLastAchieved !== todayStr) {
          if (prevUser.lastCompletedDate === yesterday.toISOString().split('T')[0]) {
              updatedUser.streak += 1; // It was yesterday, continue streak
          } else if (prevUser.lastCompletedDate !== todayStr) {
              updatedUser.streak = 1; // It's a new streak
          }
          updatedUser.lastCompletedDate = todayStr;
          updatedUser.dailyGoalLastAchieved = todayStr;
          setActivePopup('dailyGoal');
          triggerConfetti();
      }
      
      updatedUser.lastActivityDate = todayStr;

      return updatedUser;
    });
  }, [addInfoToast]);

  const submitQuizResults = useCallback((topic: LearningTopic, level: number | null, answers: UserAnswer[], quizQuestions: QuizQuestion[]) => {
    setUser(prevUser => {
        if (!prevUser) return null;
        let updatedUser = { ...prevUser };

        let correctCount = 0;
        let newMistakes: Mistake[] = [];
        let newWordHistory: WordHistoryEntry[] = [];
        
        quizQuestions.forEach((q, i) => {
            let isCorrect = false;
            if (q.type === 'multiple-choice') {
                isCorrect = answers[i] === q.correctAnswerIndex;
            } else if ((q.type === 'writing' || q.type === 'speaking') && typeof answers[i] === 'string') {
                isCorrect = calculateSimilarity(answers[i] as string, q.correctAnswer.latin) >= WRITING_SIMILARITY_THRESHOLD;
            } else if (q.type === 'sentence-formation' && Array.isArray(answers[i])) {
                isCorrect = (answers[i] as string[]).join(' ') === q.correctSentence.join(' ');
            }
            
            if (!isCorrect && answers[i] !== null && answers[i] !== 'skipped' && answers[i] !== 'idk') {
                newMistakes.push({ question: q, userAnswer: answers[i] });
            }
            
            if (q.targetWord) {
                newWordHistory.push({
                    latin: q.targetWord.latin,
                    arabic: q.targetWord.arabic,
                    isCorrect: isCorrect,
                    timestamp: Date.now()
                });
            }
            if (isCorrect) correctCount++;
        });

        const scoreGained = correctCount * POINTS_PER_CORRECT_ANSWER;
        updatedUser.score += scoreGained;
        updatedUser.questionsAnswered += quizQuestions.length;
        updatedUser.correctAnswers += correctCount;
        updatedUser.quizzesCompleted += 1;
        updatedUser.mistakes = [...updatedUser.mistakes, ...newMistakes];
        updatedUser.wordHistory = [...updatedUser.wordHistory, ...newWordHistory];
        
        // Update progress for the topic and level
        if (topic !== 'Personalized Review' && topic !== 'Spaced Repetition' && level !== null) {
            if (!updatedUser.progress[topic]) updatedUser.progress[topic] = {};
            if (!updatedUser.progress[topic]![level]) updatedUser.progress[topic]![level] = { completedCount: 0 };
            
            const currentProgress = updatedUser.progress[topic]![level];
            currentProgress.completedCount += 1;
            const currentHighScore = currentProgress.highScore || 0;
            currentProgress.highScore = Math.max(currentHighScore, correctCount);
        }
        
        updateUser({
            xpGained: scoreGained,
            quizCompleted: 1,
            newWordsLearned: topic === 'Vocabulary' ? correctCount : 0,
        });

        // Award stickers after state update
        const awardedStickers = awardStickers(updatedUser);
        if (awardedStickers) {
            updatedUser.stickers = awardedStickers;
        }

        return updatedUser;
    });
  }, [updateUser, awardStickers]);
  
   // Other context functions...
   
   const useStreakFreeze = useCallback((): Promise<boolean> => {
       return new Promise((resolve) => {
           let success = false;
           setUser(prevUser => {
               if (!prevUser || prevUser.streakFreeses.available <= 0) {
                   success = false;
                   resolve(false);
                   return prevUser;
               }
                const todayStr = new Date().toISOString().split('T')[0];
                if (prevUser.streakFreeses.lastUsedDate === todayStr) {
                    success = false; // Already used today
                    resolve(false);
                    return prevUser;
                }
               
               success = true;
               resolve(true);
               return {
                   ...prevUser,
                   streakFreeses: {
                       ...prevUser.streakFreeses,
                       available: prevUser.streakFreeses.available - 1,
                       lastUsedDate: todayStr,
                   }
               };
           });
       });
   }, []);

  const clearNewlyUnlockedAchievements = useCallback(() => {
    setNewlyUnlockedAchievements([]);
  }, []);
  
  const updateSettings = useCallback((settings: Partial<UserSettings>) => {
    setUser(prevUser => {
        if (!prevUser) return null;
        return {
            ...prevUser,
            settings: { ...prevUser.settings, ...settings }
        }
    });
  }, []);

  const updateProfileDetails = useCallback((details: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'hasCompletedOnboarding' | 'bio'>>) => {
      setUser(prevUser => {
          if (!prevUser) return null;
          return { ...prevUser, ...details };
      });
  }, []);
  
  const clearMistakes = useCallback(() => {
      setUser(prev => prev ? ({ ...prev, mistakes: [] }) : null);
      addInfoToast({ type: 'info', message: 'Mistake history cleared.' });
  }, [addInfoToast]);
  
  const isLevelUnlocked = useCallback((topic: LearningTopic, level: number): boolean => {
      if (!user) return false;
      if (level === 1) return true;
      
      const topicProgress = user.progress[topic];
      if (!topicProgress) return false;
      
      // A level is unlocked if the previous level has been completed at least once
      const prevLevelProgress = topicProgress[level - 1];
      return (prevLevelProgress?.completedCount || 0) > 0;
  }, [user]);

  // Logout and other auth related functions would be here.
  const logout = useCallback(async () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    // In a real Firebase app: await auth.signOut();
    window.location.reload();
  }, []);

  // Syncing offline results
  const syncOfflineResults = useCallback(async () => {
    const offlineQueueJson = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!offlineQueueJson) return;
    
    const queue: OfflineQuizResult[] = JSON.parse(offlineQueueJson);
    if (queue.length === 0) return;
    
    addInfoToast({ type: 'info', message: `Syncing ${queue.length} saved quiz results...` });

    queue.forEach(result => {
      submitQuizResults(result.topic, result.level, result.answers, result.quizQuestions);
    });
    
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    addInfoToast({ type: 'success', message: `Sync complete!` });

  }, [submitQuizResults, addInfoToast]);
  
  // All other methods from the type definition
  const resetAllData = async () => {};
  const clearProgress = () => {};
  const enableNotifications = async () => { return false; };
  const markThemePromptAsSeen = () => { setUser(p => p ? ({ ...p, hasSeenThemePrompt: true }) : null); };
  const markFriendsPromptAsSeen = () => { setUser(p => p ? ({ ...p, hasSeenFriendsPrompt: true }) : null); };
  const markNotificationPromptAsSeen = () => { setUser(p => p ? ({ ...p, hasSeenNotificationPrompt: true }) : null); };

  const contextValue = useMemo(() => ({
    user,
    isLoading,
    updateUser,
    submitQuizResults,
    updateSettings,
    updateProfileDetails,
    resetAllData,
    clearProgress,
    clearMistakes,
    logout,
    newlyUnlockedAchievements,
    clearNewlyUnlockedAchievements,
    isLevelUnlocked,
    enableNotifications,
    useStreakFreeze,
    addInfoToast,
    infoToasts,
    syncOfflineResults,
    activePopup,
    setActivePopup,
    markThemePromptAsSeen,
    markFriendsPromptAsSeen,
    markNotificationPromptAsSeen,
    friends: [], // Mocked for now
    incomingRequests: [], // Mocked for now
    outgoingRequests: [], // Mocked for now
    sendFriendRequest: async () => false, // Mocked
    respondToFriendRequest: async () => false, // Mocked
    removeFriend: async () => false, // Mocked
    mistakeAnalysis,
  }), [
    user, isLoading, updateUser, submitQuizResults, updateSettings, updateProfileDetails, logout, 
    newlyUnlockedAchievements, clearNewlyUnlockedAchievements, isLevelUnlocked, useStreakFreeze,
    addInfoToast, infoToasts, syncOfflineResults, activePopup, mistakeAnalysis
  ]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};