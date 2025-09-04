import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import firebase from 'firebase/compat/app';
import { UserProfile, UserSettings, LearningTopic, AchievementID, Achievement, UpdateUserPayload, UserContextType, QuizQuestion, UserAnswer, Mistake, OfflineQuizResult, WordHistoryEntry, InfoToastData, ActivePopup, QuestProgress, Quest, SentenceFormationQuestion, Friend, createNewDefaultUser } from '../types.ts';
import { LOCAL_STORAGE_KEY, ACHIEVEMENTS, LEARNING_TOPICS, LEVELS, QUIZ_LENGTH, POINTS_PER_CORRECT_ANSWER, WRITING_SIMILARITY_THRESHOLD, XP_PER_DAILY_LOGIN, XP_PER_REVIEW_QUIZ, OFFLINE_QUEUE_KEY, XP_PER_FIRST_CONVO, AVAILABLE_QUESTS, STICKERS } from '../constants.ts';
import { calculateSimilarity } from '../utils/stringSimilarity.ts';
import { auth, firestore, requestAndSaveToken, getUserProfile, createUserProfile, updateUserProfile, signOut, getUsersByIds, sendFriendRequest as fbSendFriendRequest, respondToFriendRequest as fbRespondToFriendRequest, removeFriend as fbRemoveFriend } from '../services/firebaseService.ts';
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
  followUser: async () => {},
  unfollowUser: async () => {},
  mistakeAnalysis: null,
  collectReward: () => {},
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
          // New user (from any auth provider) needs a profile created.
          // This centralized logic prevents race conditions.
          const { email, displayName, photoURL, uid, isAnonymous } = firebaseUser;
          const defaultUser = createNewDefaultUser();
          const newUser: UserProfile = {
            ...defaultUser,
            uid,
            email: email || '',
            displayName: displayName || 'New Learner',
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
  
  // Effect for fetching friend/request profiles
  useEffect(() => {
    if (user) {
        const fetchFriendData = async () => {
            const { friends: friendUids, friendRequests: requestUids } = user;
            const friendProfiles = friendUids.length > 0 ? await getUsersByIds(friendUids) : [];
            const incomingProfiles = requestUids.incoming.length > 0 ? await getUsersByIds(requestUids.incoming) : [];
            const outgoingProfiles = requestUids.outgoing.length > 0 ? await getUsersByIds(requestUids.outgoing) : [];
            setFriends(friendProfiles);
            setIncomingRequests(incomingProfiles);
            setOutgoingRequests(outgoingProfiles);
        };
        fetchFriendData();
    } else {
        setFriends([]);
        setIncomingRequests([]);
        setOutgoingRequests([]);
    }
  }, [user]);

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

  const submitQuizResults = useCallback(async (topic: LearningTopic, level: number | null, answers: UserAnswer[], quizQuestions: QuizQuestion[], isDailyChallenge?: boolean) => {
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
        questionsAnswered: firebase.firestore.FieldValue.increment(quizQuestions.length),
        correctAnswers: firebase.firestore.FieldValue.increment(correctCount),
        quizzesCompleted: firebase.firestore.FieldValue.increment(1),
        mistakes: firebase.firestore.FieldValue.arrayUnion(...newMistakes),
        wordHistory: firebase.firestore.FieldValue.arrayUnion(...newWordHistory),
    };

    if (isDailyChallenge && correctCount >= quizQuestions.length * 0.7) { // Pass if >70% correct
        const today = new Date().toISOString().split('T')[0];
        updates.dailyChallengeCompletedDate = today;
        updates.score = firebase.firestore.FieldValue.increment(scoreGained + 50); // +50 bonus
        addInfoToast({ type: 'success', message: 'Daily Challenge Complete! +50 bonus DH!' });
        triggerConfetti();
    } else {
        updates.score = firebase.firestore.FieldValue.increment(scoreGained);
    }
    
    if (topic !== 'Personalized Review' && topic !== 'Spaced Repetition' && topic !== 'Daily Challenge' && level !== null) {
        const currentHighScore = user.progress?.[topic]?.[level]?.highScore || 0;
        updates[`progress.${topic}.${level}.completedCount`] = firebase.firestore.FieldValue.increment(1);
        updates[`progress.${topic}.${level}.highScore`] = Math.max(currentHighScore, correctCount);
    }
    
    await updateUserProfile(user.uid, updates);
    // Refresh user state from DB to reflect increments
    const updatedUser = await getUserProfile(user.uid);
    if (updatedUser) setUser(updatedUser);

  }, [user, addInfoToast]);
  
   const updateSettings = async (settings: Partial<UserSettings>) => {
    if(!user) return;
    await updateUserProfile(user.uid, { settings: { ...user.settings, ...settings } });
    setUser(prev => prev ? ({ ...prev, settings: {...prev.settings, ...settings }}) : null);
  };
  
  const updateProfileDetails = async (details: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'hasCompletedOnboarding' | 'bio' | 'childAccountIds'>>) => {
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
        await submitQuizResults(result.topic, result.level, result.answers, result.quizQuestions, result.isDailyChallenge);
    }
    
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    addInfoToast({ type: 'success', message: `Sync complete!` });

  }, [submitQuizResults, addInfoToast, user]);

    
  const resetAllData = async () => {};
  const clearProgress = () => {};
  const enableNotifications = async () => {
      if(!user) return false;
      return await requestAndSaveToken(user.uid);
  };
  
   const collectReward = useCallback(async (rewardId: string, points: number) => {
        if (!user || user.collectedRewards.includes(rewardId)) return;
        const updates = {
            score: firebase.firestore.FieldValue.increment(points),
            collectedRewards: firebase.firestore.FieldValue.arrayUnion(rewardId),
        };
        await updateUserProfile(user.uid, updates);
        setUser(prev => prev ? ({ ...prev, score: prev.score + points, collectedRewards: [...prev.collectedRewards, rewardId] }) : null);
    }, [user]);

    const useStreakFreeze = useCallback(async (): Promise<boolean> => {
        if (!user || user.streakFreezes <= 0) return false;
        const today = new Date().toISOString().split('T')[0];
        if (user.lastStreakFreezeDate === today) return false;

        const updates = {
            streakFreezes: firebase.firestore.FieldValue.increment(-1),
            lastStreakFreezeDate: today,
        };

        try {
            await updateUserProfile(user.uid, updates);
            setUser(prev => prev ? ({ ...prev, streakFreezes: prev.streakFreezes - 1, lastStreakFreezeDate: today }) : null);
            addInfoToast({ type: 'success', message: 'Streak Freeze activated!' });
            return true;
        } catch (e) {
            console.error("Failed to use streak freeze:", e);
            addInfoToast({ type: 'error', message: 'Could not activate Streak Freeze.' });
            return false;
        }
    }, [user, addInfoToast]);

  const markThemePromptAsSeen = async () => { 
      if(!user) return;
      await updateUserProfile(user.uid, { hasSeenThemePrompt: true });
      setUser(prev => prev ? ({ ...prev, hasSeenThemePrompt: true }) : null);
  };
  const markFriendsPromptAsSeen = async () => { 
      if(!user) return;
      await updateUserProfile(user.uid, { hasSeenFriendsPrompt: true });
      setUser(prev => prev ? ({ ...prev, hasSeenFriendsPrompt: true }) : null);
  };
  const markNotificationPromptAsSeen = async () => { 
      if(!user) return;
      await updateUserProfile(user.uid, { hasSeenNotificationPrompt: true });
      setUser(prev => prev ? ({ ...prev, hasSeenNotificationPrompt: true }) : null);
  };
  
    const sendFriendRequest = async (toUid: string) => {
        if (!user) return false;
        try {
            await fbSendFriendRequest(user.uid, toUid);
            // Optimistic update
            setUser(prev => ({
                ...prev!,
                friendRequests: {
                    ...prev!.friendRequests,
                    outgoing: [...prev!.friendRequests.outgoing, toUid],
                },
            }));
            addInfoToast({type: 'success', message: 'Friend request sent!'});
            return true;
        } catch (e) {
            console.error(e);
            addInfoToast({type: 'error', message: 'Failed to send request.'});
            return false;
        }
    };
    
    const respondToFriendRequest = async (fromUid: string, accept: boolean) => {
        if (!user) return false;
        try {
            await fbRespondToFriendRequest(user.uid, fromUid, accept);
            // Optimistic update
            setUser(prev => {
                const updatedUser = { ...prev! };
                updatedUser.friendRequests.incoming = updatedUser.friendRequests.incoming.filter(uid => uid !== fromUid);
                if (accept) {
                    updatedUser.friends = [...updatedUser.friends, fromUid];
                }
                return updatedUser;
            });
            addInfoToast({type: 'success', message: accept ? 'Friend added!' : 'Request declined.'});
            return true;
        } catch (e) {
            console.error(e);
            addInfoToast({type: 'error', message: 'Failed to respond to request.'});
            return false;
        }
    };

    const removeFriend = async (friendUid: string) => {
        if (!user) return false;
        try {
            await fbRemoveFriend(user.uid, friendUid);
            setUser(prev => ({
                ...prev!,
                friends: prev!.friends.filter(uid => uid !== friendUid),
            }));
            addInfoToast({type: 'info', message: 'Friend removed.'});
            return true;
        } catch (e) {
            console.error(e);
            addInfoToast({type: 'error', message: 'Failed to remove friend.'});
            return false;
        }
    };

    const followUser = async (targetUid: string): Promise<void> => {
      if (!user) return;
      console.log(`Following user ${targetUid}`);
      addInfoToast({ type: 'info', message: `Follow user is not yet implemented.` });
      // In a real application, you would add logic here to update the user's 'following' list
      // and the target user's 'followers' list in Firestore.
    };
  
    const unfollowUser = async (targetUid: string): Promise<void> => {
      if (!user) return;
      console.log(`Unfollowing user ${targetUid}`);
      addInfoToast({ type: 'info', message: `Unfollow user is not yet implemented.` });
      // Similarly, this would contain the logic to reverse the follow action.
    };


  const contextValue = useMemo(() => ({
    user, isLoading, updateUser, submitQuizResults, updateSettings, updateProfileDetails,
    resetAllData, clearProgress, clearMistakes, logout, newlyUnlockedAchievements,
    clearNewlyUnlockedAchievements, isLevelUnlocked, enableNotifications,
    addInfoToast, infoToasts, syncOfflineResults, activePopup, setActivePopup,
    markThemePromptAsSeen, markFriendsPromptAsSeen, markNotificationPromptAsSeen,
    friends, incomingRequests, outgoingRequests,
    sendFriendRequest,
    respondToFriendRequest,
    removeFriend,
    followUser,
    unfollowUser,
    mistakeAnalysis,
    collectReward,
    useStreakFreeze,
  }), [
    user, isLoading, updateUser, submitQuizResults, updateSettings, updateProfileDetails, logout, 
    newlyUnlockedAchievements, clearNewlyUnlockedAchievements, isLevelUnlocked,
    addInfoToast, infoToasts, syncOfflineResults, activePopup, mistakeAnalysis, friends, incomingRequests, outgoingRequests, collectReward, useStreakFreeze
  ]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};