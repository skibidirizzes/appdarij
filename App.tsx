import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Outlet, useNavigate, useLocation, useParams, Navigate, useSearchParams } from 'react-router-dom';
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
import { ADMIN_UIDS } from './constants.ts';

// Dynamic imports for views
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
import SendNotificationView from './components/SendNotificationView.tsx';

const MainAppLayout: React.FC = () => {
  const { user, isLoading: isUserLoading, syncOfflineResults, activePopup, setActivePopup, markThemePromptAsSeen, markFriendsPromptAsSeen, addInfoToast } = useContext(UserContext);
  const { t } = useTranslations();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [foregroundMessage, setForegroundMessage] = useState<any | null>(null);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const popupTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const { themeMode, accentColor } = user.settings;
    const theme = THEME_COLORS[accentColor];
    const body = document.body;
    const root = document.documentElement;

    if (themeMode === 'light') {
        body.classList.add('theme-light');
    } else {
        body.classList.remove('theme-light');
    }

    root.style.setProperty('--color-primary-300', theme.colors[300]);
    root.style.setProperty('--color-primary-400', theme.colors[400]);
    root.style.setProperty('--color-primary-500', theme.colors[500]);
    root.style.setProperty('--color-primary-600', theme.colors[600]);
    root.style.setProperty('--color-primary-900-t-50', theme.colors['900-t-50']);
    root.style.setProperty('--color-primary-900-t-80', theme.colors['900-t-80']);
    root.style.setProperty('--ring-color', theme.colors.ring);
    root.style.setProperty('--color-primary-rgb', theme.colors.rgb);
  }, [user?.settings.themeMode, user?.settings.accentColor]);

  useEffect(() => {
    if (!user || isUserLoading) return;

    syncOfflineResults();

    if (user.uid === 'guest-user' && user.score > 500) {
        const dismissed = sessionStorage.getItem('guestConversionDismissed');
        if (!dismissed) {
            setShowGuestPrompt(true);
        }
    }

  }, [user, isUserLoading, syncOfflineResults, setActivePopup, addInfoToast, t]);

  useEffect(() => {
    if (!user || isUserLoading || user.uid === 'guest-user') return;
    
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);

    if (!user.hasCompletedOnboarding) {
        setActivePopup('profileSetup');
    } else if (!user.hasSeenThemePrompt) {
        setActivePopup('theme');
    } else if (!user.hasSeenNotificationPrompt) {
         popupTimerRef.current = window.setTimeout(() => {
            setActivePopup('notification');
        }, 2000);
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
              <BottomNav />
          ) : (
              <Sidebar 
                  isCollapsed={isSidebarCollapsed}
                  onToggle={() => setIsSidebarCollapsed(prev => !prev)}
              />
          )}
          
          <main className={`flex-1 transition-all duration-300 ease-in-out w-full ${isMobile ? 'pb-20 pt-6 px-4' : `pt-8 pr-6 pl-8 ${isSidebarCollapsed ? 'md:pl-28' : 'md:pl-72'}`}`}>
              <div className="animate-page-transition">
                  <Outlet />
              </div>
          </main>
          
          <AchievementToast />
          <InfoToast />
          {showGuestPrompt && <GuestConversionPrompt onDismiss={() => {setShowGuestPrompt(false); sessionStorage.setItem('guestConversionDismissed', 'true'); }} />}
          {foregroundMessage && <NotificationToast payload={foregroundMessage} onDismiss={() => setForegroundMessage(null)} />}

          {activePopup === 'profileSetup' && <ProfileSetupPopup onDismiss={() => setActivePopup(null)} />}
          {activePopup === 'theme' && <ThemePromptPopup onDismiss={() => { setActivePopup(null); markThemePromptAsSeen(); }} />}
          {activePopup === 'dailyGoal' && <DailyGoalPopup onDismiss={() => setActivePopup(null)} />}
          {activePopup === 'friends' && <FriendsPromptPopup onDismiss={() => { setActivePopup(null); markFriendsPromptAsSeen(); }}/> }
          {activePopup === 'notification' && <NotificationPromptPopup />}
      </div>
    </>
  )
}

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useContext(UserContext);
    const isAdmin = user && ADMIN_UIDS.includes(user.uid);

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
};

const AppContent: React.FC = () => {
    const { user, isLoading } = useContext(UserContext);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-900">
                <SpinnerIcon className="w-10 h-10 animate-spin text-primary-400" />
            </div>
        );
    }
    
    if (searchParams.get('mode') === 'resetPassword' && searchParams.get('oobCode')) {
        return <ResetPasswordView oobCode={searchParams.get('oobCode')!} />;
    }

    if (!user) {
      return <AuthView />;
    }
    
    // Once the user is loaded, render the main app with routes
    return (
        <Routes>
            <Route path="/" element={<MainAppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<HomeView />} />
                <Route path="quiz" element={<QuizView />} />
                <Route path="settings" element={<SettingsView />} />
                <Route path="achievements" element={<AchievementsView />} />
                <Route path="mistakes-bank" element={<MistakesBankView />} />
                <Route path="dictionary" element={<DictionaryView />} />
                <Route path="conversation" element={<ConversationView />} />
                <Route path="leaderboard" element={<LeaderboardView />} />
                <Route path="friends" element={<FriendsView />} />
                <Route path="regional-dialects" element={<RegionalDialectView />} />
                <Route path="phoneme-practice" element={<PhonemePracticeView />} />
                <Route path="community" element={<CommunityView />} />
                <Route path="triliteral-root" element={<TriliteralRootView />} />
                <Route path="parental-controls" element={<ParentalControlsView />} />
                <Route path="profile/:userId" element={<ProfileView />} />
                <Route path="story-mode" element={<StoryModeView />} />
                <Route path="duel-setup" element={<DuelSetupView />} />
                <Route path="duel-quiz" element={<DuelQuizView />} />
                <Route path="mastery" element={<MasteryView />} />
                <Route path="labs" element={<LabsView />} />
                <Route path="send-notification" element={<ProtectedRoute><SendNotificationView /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
        </Routes>
    );
}

const App: React.FC = () => {
    return (
        <UserProvider>
            <AppContent />
        </UserProvider>
    );
};

export default App;