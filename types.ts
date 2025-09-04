import React from 'react';
// FIX: Removed `startOfMonth` from `date-fns` import as it was causing a module resolution error.
import { getWeek, getMonth, addMonths, format } from 'date-fns';

// Add to window type for Firebase Phone Auth
declare global {
    interface Window {
        recaptchaVerifier: any; // More specific type would be firebase.auth.RecaptchaVerifier
        confirmationResult: any; // More specific type would be firebase.auth.ConfirmationResult
    }
}


export type ThemeColorName = 'sky' | 'amber' | 'emerald' | 'rose' | 'fuchsia';
export type ThemeMode = 'light' | 'dark';

export interface Theme {
    name: string;
    colors: {
        300: string;
        400: string;
        500: string;
        600: string;
        '900-t-50': string;
        '900-t-80': string;
        'ring': string;
        'rgb': string;
    };
}

export const THEME_COLORS: Record<ThemeColorName, Theme> = {
    sky: { name: 'Sky', colors: { 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', '900-t-50': 'rgba(12, 74, 110, 0.5)', '900-t-80': 'rgba(12, 74, 110, 0.8)', ring: 'rgba(56, 189, 248, 0.5)', rgb: '14, 165, 233' } },
    amber: { name: 'Amber', colors: { 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', '900-t-50': 'rgba(120, 53, 15, 0.5)', '900-t-80': 'rgba(120, 53, 15, 0.8)', ring: 'rgba(251, 191, 36, 0.5)', rgb: '245, 158, 11' } },
    emerald: { name: 'Emerald', colors: { 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', '900-t-50': 'rgba(6, 78, 59, 0.5)', '900-t-80': 'rgba(6, 78, 59, 0.8)', ring: 'rgba(52, 211, 153, 0.5)', rgb: '16, 185, 129' } },
    rose: { name: 'Rose', colors: { 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', '900-t-50': 'rgba(127, 29, 29, 0.5)', '900-t-80': 'rgba(127, 29, 29, 0.8)', ring: 'rgba(248, 113, 113, 0.5)', rgb: '239, 68, 68' } },
    fuchsia: { name: 'Fuchsia', colors: { 300: '#f0abfc', 400: '#e879f9', 500: '#d946ef', 600: '#c026d3', '900-t-50': 'rgba(112, 26, 117, 0.5)', '900-t-80': 'rgba(112, 26, 117, 0.8)', ring: 'rgba(232, 121, 249, 0.5)', rgb: '217, 70, 239' } },
};


export type AchievementID = 
    | 'first_steps'
    | 'quiz_taker'
    | 'unstoppable'
    | 'dedicated_learner'
    | 'darija_pro'
    | 'perfect_quiz'
    | 'completionist'
    | 'topic_starter_vocabulary'
    | 'topic_starter_grammar'
    | 'topic_starter_phrases'
    | 'topic_starter_numbers'
    | 'level_5_vocabulary'
    | 'level_5_grammar'
    | 'level_5_phrases'
    | 'level_5_numbers'
    | 'level_10_vocabulary'
    | 'level_10_grammar'
    | 'level_10_phrases'
    | 'level_10_numbers'
    | 'level_20_vocabulary'
    | 'level_20_grammar'
    | 'level_20_phrases'
    | 'level_20_numbers'
    | 'level_30_vocabulary'
    | 'level_30_grammar'
    | 'level_30_phrases'
    | 'level_30_numbers'
    | 'level_40_vocabulary'
    | 'level_40_grammar'
    | 'level_40_phrases'
    | 'level_40_numbers'
    | 'level_50_vocabulary'
    | 'level_50_grammar'
    | 'level_50_phrases'
    | 'level_50_numbers'
    | 'mistake_learner'
    | 'chat_initiate'
    | 'century_club'; // For 100 correct answers surprise

export interface Achievement {
    id: AchievementID;
    icon: string; // emoji
}

export type ScriptMode = 'latin' | 'arabic' | 'both';

export interface UserSettings {
    themeMode: ThemeMode;
    accentColor: ThemeColorName;
    scriptMode: ScriptMode;
    language: 'en' | 'nl';
    dailyGoal: number;
}

export interface WordHistoryEntry {
    latin: string;
    arabic: string;
    isCorrect: boolean;
    timestamp: number;
}

export interface WeeklyProgress {
    quizzes: number;
    words: number;
    dhGained: number;
    date: string; // YYYY-WW (e.g., "2023-45")
}

export type QuestType = 'complete_quiz' | 'perfect_score' | 'learn_words';

export interface Quest {
    id: string;
    type: QuestType;
    descriptionKey: string;
    targetValue: number;
    targetTopic?: LearningTopic;
    xpReward: number;
}

export interface QuestProgress extends Quest {
    currentValue: number;
    isCompleted: boolean;
}

export type StickerID = 'mint_tea_master' | 'souk_navigator' | 'grammar_guardian';

export interface Sticker {
    id: StickerID;
    name: string;
    icon: string;
    description: string;
}

export interface UserProfile {
  uid: string;
  isAnonymous: boolean;
  email: string;
  displayName: string;
  photoURL: string;
  bio?: string;
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
  progress: {
      [topic in LearningTopic]?: {
          [level: number]: {
              completedCount: number;
              highScore?: number;
          }
      }
  };
  settings: UserSettings;
  unlockedAchievements: AchievementID[];
  quizzesCompleted: number;
  correctAnswersInRow: number;
  mistakes: Mistake[];
  wordHistory: WordHistoryEntry[];
  // Gamification
  streak: number;
  lastCompletedDate: string; // YYYY-MM-DD
  streakFreezes: number;
  lastStreakFreezeDate: string; // YYYY-MM-DD
  nextFreezeRefillDate: string; // YYYY-MM-DD
  dailyXp: number;
  lastActivityDate: string; // YYYY-MM-DD
  weeklyProgress: WeeklyProgress;
  activeQuests: QuestProgress[];
  hasUsedConversation: boolean;
  stickers: Sticker[];
  createdAt: number; // Timestamp
  lastLoginDate: string; // YYYY-MM-DD
  lastOnline: number; // Timestamp for "online now" vs "online 5h ago"
  fcmToken?: string; // For Firebase Cloud Messaging
  dailyChallengeCompletedDate: string; // YYYY-MM-DD
  collectedRewards: string[]; // e.g., ['vocabulary-reward-1']
  // Popups & Onboarding
  hasCompletedOnboarding: boolean;
  hasSeenThemePrompt: boolean;
  hasSeenFriendsPrompt: boolean;
  hasSeenNotificationPrompt: boolean;
  dailyGoalLastAchieved: string; // YYYY-MM-DD
  // Social
  friends: string[]; // array of UIDs
  friendRequests: {
    incoming: string[];
    outgoing: string[];
  };
  followers: string[];
  following: string[];
  // Parental Controls
  parentAccountId: string | null;
  childAccountIds: string[];
}

export interface Mistake {
    question: QuizQuestion;
    userAnswer: UserAnswer;
}

export interface QuizOption {
    latin: string;
    arabic: string;
}

interface BaseQuizQuestion {
    type: 'multiple-choice' | 'writing' | 'speaking' | 'sentence-formation';
    explanation: {
        latin: string;
        arabic: string;
    };
    // Unique identifier to help with mistake tracking
    id: string; 
    targetWord?: QuizOption;
}

export interface MultipleChoiceQuestion extends BaseQuizQuestion {
    type: 'multiple-choice';
    question: string;
    options: QuizOption[];
    correctAnswerIndex: number;
}

export interface WritingQuestion extends BaseQuizQuestion {
    type: 'writing';
    question: string;
    correctAnswer: QuizOption;
}

export interface SpeakingQuestion extends BaseQuizQuestion {
    type: 'speaking';
    question: string;
    correctAnswer: QuizOption;
}

export interface SentenceFormationQuestion extends BaseQuizQuestion {
    type: 'sentence-formation';
    question: string; // The English/Dutch prompt
    wordBank: string[]; // Shuffled words
    correctSentence: string[]; // Words in the correct order
}

export type QuizQuestion = MultipleChoiceQuestion | WritingQuestion | SpeakingQuestion | SentenceFormationQuestion;

export type Quiz = QuizQuestion[];

export interface QuizCache {
    topic: LearningTopic;
    level: number;
    quiz: Quiz;
    wordToReview?: WordInfo;
}

export type LearningTopic = 'Vocabulary' | 'Grammar' | 'Common Phrases' | 'Numbers' | 'Personalized Review' | 'Spaced Repetition' | 'Daily Challenge';

export type UserAnswer = number | string | string[] | 'skipped' | 'idk' | null;

export interface UpdateUserPayload {
    score?: number;
    questionsAnswered?: number;
    correctAnswers?: number;
    quizCompleted?: number;
    isCorrect?: boolean;
    correctAnswersInRow?: number;
    quizStats?: {
        topic: LearningTopic;
        level: number | null;
        correct: number;
        total: number;
    } | null;
    xpGained?: number;
    hasUsedConversation?: boolean;
    newWordsLearned?: number;
}

export interface WordInfo {
    latin: string;
    arabic: string;
    definition: string;
    examples: {
        latin: string;
        arabic: string;
        translation: string;
    }[];
}

export interface Message {
    sender: 'user' | 'ai' | 'error';
    content: {
        latin: string;
        arabic?: string;
        english?: string;
    };
    timestamp: number;
    image?: string; // data URL for the image
}

export type View = 'dashboard' | 'quiz' | 'settings' | 'achievements' | 'mistakes' | 'dictionary' | 'conversation' | 'leaderboard' | 'friends' | 'regional-dialects' | 'phoneme-practice' | 'community' | 'triliteral-root' | 'parental-controls' | 'profile' | 'mistakes-bank' | 'story-mode' | 'duel-setup' | 'duel-quiz' | 'mastery' | 'labs';

export interface RootAnalysis {
    root: string;
    meaning: string;
    relatedWords: {
        latin: string;
        arabic: string;
        english: string;
    }[];
}

export interface LeaderboardEntry {
    uid: string;
    displayName: string;
    score: number;
    rank: number;
    photoURL?: string;
    lastOnline: number;
}

export interface Friend extends LeaderboardEntry {}

export interface OfflineQuizResult {
    topic: LearningTopic;
    level: number | null;
    answers: UserAnswer[];
    quizQuestions: QuizQuestion[];
    timestamp: number;
    isDailyChallenge?: boolean;
}

export interface InfoToastData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  icon?: React.ReactNode;
}

export type ActivePopup = 'theme' | 'dailyGoal' | 'friends' | 'notification' | 'profileSetup' | null;

export interface PronunciationFeedback {
    isCorrect: boolean;
    feedback: string;
}

export interface DialectTranslation {
    city: string;
    translation: {
        latin: string;
        arabic: string;
    };
}

export interface Story {
    title: string;
    levelUnlock: number;
    paragraphs: {
        latin: string;
        arabic: string;
        translation: string;
    }[];
}

export interface CommunityPost {
    id: string;
    author: {
        uid: string;
        displayName: string;
        photoURL: string;
    };
    title: string;
    topic: string;
    content: string;
    contentSnippet: string;
    replies: number;
    upvotes: number;
    timestamp: number;
    tags: string[];
}


export interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  updateUser: (payload: UpdateUserPayload) => void;
  submitQuizResults: (topic: LearningTopic, level: number | null, answers: UserAnswer[], quizQuestions: QuizQuestion[], isDailyChallenge?: boolean) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateProfileDetails: (details: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'hasCompletedOnboarding' | 'bio' | 'childAccountIds'>>) => void;
  resetAllData: () => Promise<void>;
  clearProgress: () => void;
  clearMistakes: () => void;
  logout: () => Promise<void>;
  newlyUnlockedAchievements: Achievement[];
  clearNewlyUnlockedAchievements: () => void;
  isLevelUnlocked: (topic: LearningTopic, level: number) => boolean;
  enableNotifications: () => Promise<boolean>;
  addInfoToast: (toast: Omit<InfoToastData, 'id'>) => void;
  infoToasts: InfoToastData[];
  syncOfflineResults: () => Promise<void>;
  activePopup: ActivePopup;
  setActivePopup: (popup: ActivePopup) => void;
  markThemePromptAsSeen: () => void;
  markFriendsPromptAsSeen: () => void;
  markNotificationPromptAsSeen: () => void;
  friends: Friend[];
  incomingRequests: Friend[];
  outgoingRequests: Friend[];
  sendFriendRequest: (toUid: string) => Promise<boolean>;
  respondToFriendRequest: (fromUid: string, accept: boolean) => Promise<boolean>;
  removeFriend: (friendUid: string) => Promise<boolean>;
  followUser: (targetUid: string) => Promise<void>;
  unfollowUser: (targetUid: string) => Promise<void>;
  mistakeAnalysis: string | null;
  collectReward: (rewardId: string, points: number) => void;
  useStreakFreeze: () => Promise<boolean>;
}

// --- User Profile Utilities ---

const getWeekIdentifier = (date: Date) => `${date.getFullYear()}-${getWeek(date)}`;

export const createNewDefaultUser = (): Omit<UserProfile, 'uid' | 'email' | 'displayName' | 'photoURL' | 'isAnonymous'> => {
    const browserLang = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en';
    const initialLang = browserLang === 'nl' ? 'nl' : 'en';
    const now = new Date();
    // FIX: Replaced `startOfMonth` from `date-fns` with a native `Date` object to fix an import error.
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = addMonths(startOfCurrentMonth, 1);
    
    return {
      score: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      progress: {},
      settings: {
          themeMode: 'dark',
          accentColor: 'sky',
          scriptMode: 'latin',
          language: initialLang,
          dailyGoal: 50,
      },
      unlockedAchievements: [],
      quizzesCompleted: 0,
      correctAnswersInRow: 0,
      mistakes: [],
      wordHistory: [],
      streak: 0,
      lastCompletedDate: '',
      streakFreezes: 1,
      lastStreakFreezeDate: '',
      nextFreezeRefillDate: format(nextMonth, 'yyyy-MM-dd'),
      dailyXp: 0,
      lastActivityDate: now.toISOString().split('T')[0],
      weeklyProgress: { quizzes: 0, words: 0, dhGained: 0, date: getWeekIdentifier(now) },
      activeQuests: [],
      hasUsedConversation: false,
      stickers: [],
      createdAt: now.getTime(),
      lastLoginDate: now.toISOString().split('T')[0],
      lastOnline: now.getTime(),
      dailyChallengeCompletedDate: '',
      collectedRewards: [],
      hasCompletedOnboarding: false,
      hasSeenThemePrompt: false,
      hasSeenFriendsPrompt: false,
      hasSeenNotificationPrompt: false,
      dailyGoalLastAchieved: '',
      friends: [],
      friendRequests: { incoming: [], outgoing: [] },
      followers: [],
      following: [],
      parentAccountId: null,
      childAccountIds: [],
      bio: '',
    };
};
