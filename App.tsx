import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { UserProvider, UserContext } from './context/UserContext.tsx';
import { THEME_COLORS, LearningTopic, Quiz, QuizCache, View, WordInfo } from './types.ts';
import { generateQuiz, aiInitializationError } from './services/geminiService.ts';
import { useTranslations } from './hooks/useTranslations.ts';
import { useMediaQuery } from './hooks/useMediaQuery.ts';
import { SpinnerIcon, SparklesIcon } from './components/icons/index.ts';
import Sidebar from './components/Sidebar.tsx';
import BottomNav from './components/BottomNav.tsx';
import AchievementToast from './components/AchievementToast.tsx';
import InfoToast from './components/InfoToast.tsx';
import GuestConversionPrompt from './components/GuestConversionPrompt.tsx';
import NotificationToast from './components/NotificationToast.tsx';
import AuthView from './components/AuthView.tsx';
import QuizInProgressToast from './components/QuizInProgressToast.tsx';
import { ThemePromptPopup, DailyGoalPopup, FriendsPromptPopup, NotificationPromptPopup, ProfileSetupPopup } from './components/popups/index.ts';

// Statically import views to fix module resolution issue
import HomeView from './components/home/HomeView.tsx';
import QuizView from './components/QuizView.tsx';
import SettingsView from './components/SettingsView.tsx';
import AchievementsView from './components/AchievementsView.tsx';
import DictionaryView from './components/DictionaryView.tsx';
import ConversationView from './components/ConversationView.tsx';
import LeaderboardView from './components/LeaderboardView.tsx';
import FriendsView from './components/FriendsView.tsx';
import RegionalDialectView from './components/RegionalDialectView.tsx';
import PhonemePracticeView from './components/PhonemePracticeView.tsx';
import CommunityView from './components/CommunityView.tsx';
import TriliteralRootView from './components/TriliteralRootView.tsx';
import ParentalControlsView from './components/ParentalControlsView.tsx';
import ProfileView from './components/ProfileView.tsx';
import MistakesBankView from './components/MistakesBankView.tsx';
import StoryModeView from './components/StoryModeView.tsx';
import DuelSetupView from './components/DuelSetupView.tsx';
import DuelQuizView from './components/DuelQuizView.tsx';
import MasteryView from './components/MasteryView.tsx';
import LabsView from './components/LabsView.tsx';
import ResetPasswordView from './components/ResetPasswordView.tsx';


interface CurrentView {
    name: View;
    params?: any;
}

const MainAppLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<CurrentView>({ name: 'dashboard' });
  const [quizConfig, setQuizConfig] = useState<{ topic: LearningTopic; level: number, wordToReview?: WordInfo, subCategory?: string } | null>(null);
  const [customQuiz, setCustomQuiz] = useState<Quiz | null>(null);
  const { user, isLoading: isUserLoading, syncOfflineResults, activePopup, setActivePopup, markThemePromptAsSeen, markFriendsPromptAsSeen, addInfoToast } = useContext(UserContext);
  const [prefetchedQuiz, setPrefetchedQuiz] = useState<QuizCache | null>(null);
  const { t } = useTranslations();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [foregroundMessage, setForegroundMessage] = useState<any | null>(null);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const popupTimerRef = useRef<number | null>(null);
  
  const isQuizActive = quizConfig !== null;
  const showQuizToast = isQuizActive && currentView.name !== 'quiz';

  useEffect(() => {
    if (!user) return;
    const { themeMode, accentColor } = user.settings;
    const theme = THEME_COLORS[accentColor];
    const body = document.body;
    const root = document.documentElement;

    // Set light/dark mode class on the body
    if (themeMode === 'light') {
        body.classList.add('theme-light');
    } else {
        body.classList.remove('theme-light');
    }

    // Set accent color CSS variables
    root.style.setProperty('--color-primary-300', theme.colors[300]);
    root.style.setProperty('--color-primary-400', theme.colors[400]);
    root.style.setProperty('--color-primary-500', theme.colors[500]);
    root.style.setProperty('--color-primary-600', theme.colors[600]);
    root.style.setProperty('--color-primary-900-t-50', theme.colors['900-t-50']);
    root.style.setProperty('--color-primary-900-t-80', theme.colors['900-t-80']);
    root.style.setProperty('--ring-color', theme.colors.ring);
    root.style.setProperty('--color-primary-rgb', theme.colors.rgb);
  }, [user?.settings.themeMode, user?.settings.accentColor]);

  // Pre-fetching, Offline Sync, and Popup Triggers
  useEffect(() => {
    if (!user || isUserLoading) return;

    // Pre-fetch a default quiz
    if (!prefetchedQuiz) {
        const prefetch = async () => {
            try {
                const wordOfTheDayRaw = sessionStorage.getItem('wordOfTheDay');
                const wordToReview = wordOfTheDayRaw ? JSON.parse(wordOfTheDayRaw) : undefined;
                const quiz = await generateQuiz('Vocabulary', 1, wordToReview);
                setPrefetchedQuiz({ topic: 'Vocabulary', level: 1, quiz, wordToReview });
            } catch (error) {
                console.error("Failed to pre-fetch quiz:", error);
                if (error instanceof Error) {
                    addInfoToast({ type: 'error', message: t('quiz_error_load_failed') + ': ' + error.message });
                }
            }
        };
        prefetch();
    }
    
    // Attempt to sync any offline data
    syncOfflineResults();

    // Check for guest conversion prompt
    if (user.uid === 'guest-user' && user.score > 500) {
        const dismissed = sessionStorage.getItem('guestConversionDismissed');
        if (!dismissed) {
            setShowGuestPrompt(true);
        }
    }

  }, [user, isUserLoading, prefetchedQuiz, syncOfflineResults, setActivePopup, addInfoToast, t]);

   // Onboarding popup logic
  useEffect(() => {
    if (!user || isUserLoading || user.uid === 'guest-user') return;
    
    // Always clear previous timer to avoid race conditions
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);

    if (!user.hasCompletedOnboarding) {
        setActivePopup('profileSetup');
    } else if (!user.hasSeenThemePrompt) {
        setActivePopup('theme');
    } else if (!user.hasSeenNotificationPrompt) {
         popupTimerRef.current = window.setTimeout(() => {
            setActivePopup('notification');
        }, 2000); // Shorter delay for important prompt
    } else if (!user.hasSeenFriendsPrompt) {
        popupTimerRef.current = window.setTimeout(() => {
            setActivePopup('friends');
        }, 10000);
    }

    return () => {
        if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    }
  }, [user, isUserLoading, setActivePopup]);

  useEffect(() => {
    const handleMessage = (event: Event) => {
        const customEvent = event as CustomEvent;
        setForegroundMessage(customEvent.detail);
    };
    document.addEventListener('new-foreground-message', handleMessage);
    return () => document.removeEventListener('new-foreground-message', handleMessage);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const offlineQueue = localStorage.getItem('darijaMasterOfflineQueue');
      const isQuizActive = quizConfig !== null;
      if (isQuizActive || (offlineQueue && JSON.parse(offlineQueue).length > 0)) {
          event.preventDefault();
          event.returnValue = ''; // Required for some browsers
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [quizConfig]);
  
  const handleNavigate = useCallback((view: View | { name: View; params?: any }) => {
    const viewObject = typeof view === 'string' ? { name: view } : view;
    setCurrentView(viewObject);
    if (viewObject.name !== 'quiz') {
      // Don't clear quizConfig if just navigating away, to allow resuming
    }
  }, []);
  
  const handleStartStandardQuiz = useCallback((topic: LearningTopic, level: number, wordToReview?: WordInfo, subCategory?: string) => {
    setQuizConfig({ topic, level, wordToReview, subCategory });
    setCustomQuiz(null);
    handleNavigate('quiz');
  }, [handleNavigate]);
  
  const handleStartCustomQuiz = useCallback((reviewQuiz: Quiz, topic: LearningTopic = 'Personalized Review') => {
    setCustomQuiz(reviewQuiz);
    setQuizConfig({topic, level: 0});
    handleNavigate('quiz');
  }, [handleNavigate]);
  
  const handleQuizFinish = useCallback(() => {
      setQuizConfig(null);
      setCustomQuiz(null);
      handleNavigate('dashboard');
  }, [handleNavigate]);

  const handleConsumePrefetched = useCallback(() => {
    setPrefetchedQuiz(null);
  }, []);

  const renderView = () => {
    if (isUserLoading || !user) {
        return (
            <div className="flex justify-center items-center h-full">
                <SpinnerIcon className="w-10 h-10 animate-spin text-primary-400" />
            </div>
        )
    }
    switch (currentView.name) {
      case 'quiz':
        return (
          <QuizView 
            key={customQuiz ? `custom-${customQuiz[0].id}` : `${quizConfig?.topic}-${quizConfig?.level}-${quizConfig?.subCategory}-${quizConfig?.wordToReview?.latin}`}
            onQuizFinish={handleQuizFinish} 
            topic={quizConfig?.topic}
            level={quizConfig?.level}
            subCategory={quizConfig?.subCategory}
            prefetchedQuiz={prefetchedQuiz}
            onConsumePrefetched={handleConsumePrefetched}
            customQuiz={customQuiz}
            wordToReview={quizConfig?.wordToReview}
          />
        );
      case 'settings':
        return <SettingsView onNavigate={handleNavigate} />;
      case 'achievements':
        return <AchievementsView onStartQuiz={handleStartStandardQuiz} />;
      case 'mistakes-bank':
        return <MistakesBankView onStartCustomQuiz={handleStartCustomQuiz} />;
      case 'dictionary':
        return <DictionaryView onStartCustomQuiz={handleStartCustomQuiz} />;
      case 'conversation':
        return <ConversationView />;
      case 'leaderboard':
        return <LeaderboardView onNavigate={handleNavigate} />;
      case 'friends':
        return <FriendsView onNavigate={handleNavigate} />;
      case 'regional-dialects':
        return <RegionalDialectView />;
      case 'phoneme-practice':
        return <PhonemePracticeView />;
      case 'community':
        return <CommunityView onNavigate={handleNavigate} />;
      case 'triliteral-root':
        return <TriliteralRootView />;
      case 'parental-controls':
        return <ParentalControlsView />;
      case 'profile':
        return <ProfileView userId={currentView.params?.userId} onNavigate={handleNavigate} />;
      case 'story-mode':
        return <StoryModeView story={currentView.params?.story} />;
      case 'duel-setup':
        return <DuelSetupView onNavigate={handleNavigate} />;
      case 'duel-quiz':
        return <DuelQuizView topic={currentView.params?.topic} opponent={currentView.params?.opponent} onQuizFinish={handleQuizFinish} />;
      case 'mastery':
        return <MasteryView onStartCustomQuiz={handleStartCustomQuiz} />;
      case 'labs':
        return <LabsView />;
      case 'dashboard':
      default:
        return <HomeView onStartQuiz={handleStartStandardQuiz} onStartCustomQuiz={handleStartCustomQuiz} onNavigate={handleNavigate} />;
    }
  }

  return (
    <>
      {aiInitializationError && (
          <div className="bg-red-800 text-white p-3 text-center font-semibold text-sm shadow-lg z-50 fixed top-0 left-0 right-0">
              <p className="font-bold">AI Diagnostic Notice:</p>
              <p>{aiInitializationError}</p>
          </div>
      )}
      <div className={`min-h-screen font-sans flex transition-colors duration-500 ${!user || isUserLoading ? 'bg-slate-900' : 'bg-transparent text-[var(--color-text-base)]'} ${aiInitializationError ? 'pt-24 md:pt-16' : ''}`}>
          {isMobile ? (
              <BottomNav currentView={currentView.name} onNavigate={handleNavigate} />
          ) : (
              <Sidebar 
                  currentView={currentView.name} 
                  onNavigate={handleNavigate}
                  isCollapsed={isSidebarCollapsed}
                  onToggle={() => setIsSidebarCollapsed(prev => !prev)}
              />
          )}
          
          <main className={`flex-1 transition-all duration-300 ease-in-out w-full ${isMobile ? 'pb-20 pt-6 px-4' : `pt-8 pr-6 pl-8 ${isSidebarCollapsed ? 'md:pl-28' : 'md:pl-72'}`}`}>
              <div className="animate-page-transition">
                  {renderView()}
              </div>
          </main>
          
          {showQuizToast && <QuizInProgressToast onResume={() => handleNavigate('quiz')} />}
          <AchievementToast />
          <InfoToast />
          {showGuestPrompt && <GuestConversionPrompt onDismiss={() => {setShowGuestPrompt(false); sessionStorage.setItem('guestConversionDismissed', 'true'); }} />}
          {foregroundMessage && <NotificationToast payload={foregroundMessage} onDismiss={() => setForegroundMessage(null)} />}

          {activePopup === 'profileSetup' && <ProfileSetupPopup onDismiss={() => setActivePopup(null)} />}
          {activePopup === 'theme' && <ThemePromptPopup onDismiss={() => { setActivePopup(null); markThemePromptAsSeen(); }} />}
          {activePopup === 'dailyGoal' && <DailyGoalPopup onDismiss={() => setActivePopup(null)} />}
          {activePopup === 'friends' && <FriendsPromptPopup onDismiss={() => { setActivePopup(null); markFriendsPromptAsSeen(); }} onNavigate={handleNavigate}/> }
          {activePopup === 'notification' && <NotificationPromptPopup />}
      </div>
    </>
  )
}

const AppContent: React.FC = () => {
    const { user, isLoading } = useContext(UserContext);
    const [resetCode, setResetCode] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'loading' | 'app' | 'auth' | 'resetPassword'>('loading');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');
        const oobCode = params.get('oobCode');

        if (mode === 'resetPassword' && oobCode) {
            setResetCode(oobCode);
            setViewMode('resetPassword');
            // Clean the URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (!isLoading) {
             setViewMode(user ? 'app' : 'auth');
        }
    }, [isLoading, user]);
    
    if (viewMode === 'loading') {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-900">
                <SpinnerIcon className="w-10 h-10 animate-spin text-primary-400" />
            </div>
        );
    }
    
    if (viewMode === 'resetPassword' && resetCode) {
        return <ResetPasswordView oobCode={resetCode} onFinish={() => setViewMode('auth')} />;
    }

    if (viewMode === 'app') {
        return <MainAppLayout />;
    }

    return <AuthView />;
}

const App: React.FC = () => {
    return (
        <UserProvider>
            <AppContent />
        </UserProvider>
    );
};

export default App;
