import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, Screen, Mood, MoodEntry, AppSettings, ChatMessage, MoodCheckinData } from '../types';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import GamesScreen from '../screens/GamesScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NewsScreen from '../screens/NewsScreen';
import GratitudeScreen from '../screens/GratitudeScreen';
import BottomNav from '../components/BottomNav';
import SideMenu from '../components/SideMenu';
import SignUpDialog from '../components/SignUpDialog';
import { setMasterVolume } from '../services/soundService';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useMoods } from '@/hooks/useMoods';
import { useAchievements } from '@/hooks/useAchievements';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STORAGE_KEYS = {
  chatHistory: 'tranquili_chat_history',
  settings: 'tranquili_settings',
  onboarding: 'tranquili_onboarding',
  onboardingCompleted: 'tranquili_onboarding_completed',
};

const getDefaultSettings = (): AppSettings => ({
  notificationsEnabled: true,
  soundVolume: 0.5,
  iconSet: 'default',
});

const App: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { moodHistory, addMood, loading: moodsLoading } = useMoods();
  const { achievements, checkAndUnlockAchievements, unlockedCount, totalCount } = useAchievements();
  
  const [activeScreen, setActiveScreen] = useState<Screen>(Screen.Home);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getDefaultSettings());
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const [signUpDialogConfig, setSignUpDialogConfig] = useState({ title: '', description: '' });
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [localOnboarding, setLocalOnboarding] = useState<{ name: string; path: string; reason: string } | null>(null);

  // Load from localStorage
  useEffect(() => {
    const storedChat = localStorage.getItem(STORAGE_KEYS.chatHistory);
    const storedSettings = localStorage.getItem(STORAGE_KEYS.settings);
    const storedOnboardingCompleted = localStorage.getItem(STORAGE_KEYS.onboardingCompleted);
    const storedOnboarding = localStorage.getItem(STORAGE_KEYS.onboarding);

    if (storedChat) setChatHistory(JSON.parse(storedChat));
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      setSettings(parsed);
      setMasterVolume(parsed.soundVolume);
    }
    if (storedOnboardingCompleted === 'true') {
      setOnboardingCompleted(true);
    }
    if (storedOnboarding) {
      setLocalOnboarding(JSON.parse(storedOnboarding));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.chatHistory, JSON.stringify(chatHistory));
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [chatHistory, settings]);

  // Check achievements when mood history changes
  useEffect(() => {
    if (user && moodHistory.length > 0) {
      const userChatCount = chatHistory.filter(m => m.role === 'user').length;
      checkAndUnlockAchievements(moodHistory, userChatCount).then((newlyUnlocked) => {
        if (newlyUnlocked.length > 0) {
          const achievement = achievements.find(a => a.id === newlyUnlocked[0]);
          if (achievement) {
            toast.success(`🏆 Conquista desbloqueada: ${achievement.title}!`);
          }
        }
      });
    }
  }, [moodHistory, user]);

  const handleOnboardingComplete = (profile: { name: string; path: string; reason: string }) => {
    localStorage.setItem(STORAGE_KEYS.onboarding, JSON.stringify(profile));
    localStorage.setItem(STORAGE_KEYS.onboardingCompleted, 'true');
    setLocalOnboarding(profile);
    setOnboardingCompleted(true);
    setActiveScreen(Screen.Home);
  };

  const showSignUp = (title: string, description: string) => {
    setSignUpDialogConfig({ title, description });
    setShowSignUpDialog(true);
  };

  const handleMoodSelect = async (mood: Mood, checkinData?: MoodCheckinData) => {
    if (!user) {
      showSignUp('Crie sua conta para registrar', 'Salve seu humor diário e acompanhe sua evolução');
      return;
    }
    await addMood(mood);
  };

  const handleSendMessage = useCallback(async (message: string) => {
    if (!user) {
      showSignUp('Crie sua conta para conversar', 'Converse com a Tranquilinha e receba apoio personalizado');
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: message,
      timestamp: Date.now(),
    };
    setChatHistory(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    // Check for first chat achievement
    const userChatCount = chatHistory.filter(m => m.role === 'user').length + 1;
    checkAndUnlockAchievements(moodHistory, userChatCount).then((newlyUnlocked) => {
      if (newlyUnlocked.includes('first_chat')) {
        toast.success('🏆 Conquista desbloqueada: Abrindo o Coração!');
      }
    });

    try {
      // Build conversation history for AI
      const conversationHistory = [...chatHistory, userMessage].map(m => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.text
      }));

      // Call the chat edge function
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: conversationHistory,
          userProfile: profile ? {
            name: profile.name,
            path: profile.path,
            reason: profile.reason
          } : null
        }
      });

      if (error) {
        console.error('Chat error:', error);
        throw new Error(error.message || 'Erro ao processar mensagem');
      }

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: data?.response || 'Desculpe, não consegui processar sua mensagem. Pode tentar novamente?',
        timestamp: Date.now(),
      };
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      // Check for rate limit or payment errors
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('Muitas requisições')) {
          toast.error('Muitas requisições. Aguarde alguns segundos.');
        } else if (error.message.includes('402') || error.message.includes('Créditos')) {
          toast.error('Créditos insuficientes. Entre em contato com o suporte.');
        } else {
          toast.error('Erro ao enviar mensagem. Tente novamente.');
        }
      }

      // Fallback response
      const fallbackMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: 'Desculpe, estou com dificuldades no momento. Que tal tentarmos novamente em alguns instantes? 💙',
        timestamp: Date.now(),
      };
      setChatHistory(prev => [...prev, fallbackMessage]);
    } finally {
      setIsChatLoading(false);
    }
  }, [user, chatHistory, moodHistory, profile, checkAndUnlockAchievements]);

  const handleNavigateTo = (screen: Screen) => {
    if (screen === Screen.News && !user) {
      showSignUp('Crie sua conta para acessar', 'Leia notícias e artigos sobre bem-estar');
      return;
    }
    if (screen === Screen.Games && !user) {
      showSignUp('Crie sua conta para jogar', 'Acesse jogos relaxantes para sua pausa mental');
      return;
    }
    setActiveScreen(screen);
  };

  const handleLogout = async () => {
    await signOut();
    setChatHistory([]);
    setSettings(getDefaultSettings());
    localStorage.removeItem(STORAGE_KEYS.chatHistory);
    localStorage.removeItem(STORAGE_KEYS.onboarding);
    localStorage.removeItem(STORAGE_KEYS.onboardingCompleted);
    setOnboardingCompleted(false);
    setLocalOnboarding(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!onboardingCompleted && !user) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  if (user && profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const userProfile: UserProfile = user && profile 
    ? {
        id: profile.id,
        name: profile.name,
        path: profile.path,
        reason: profile.reason
      }
    : {
        id: 'guest',
        name: localOnboarding?.name || 'Visitante',
        path: localOnboarding?.path || 'AUTOCUIDADO',
        reason: localOnboarding?.reason || null
      };

  const renderScreen = () => {
    switch (activeScreen) {
      case Screen.Home:
        return (
          <HomeScreen
            userProfile={userProfile}
            moodHistory={user ? moodHistory : []}
            onMoodSelect={handleMoodSelect}
            navigateTo={handleNavigateTo}
            onOpenSideMenu={() => setIsSideMenuOpen(true)}
          />
        );
      case Screen.Chat:
        return <ChatScreen chatHistory={chatHistory} onSendMessage={handleSendMessage} isLoading={isChatLoading} />;
      case Screen.Games:
        return <GamesScreen />;
      case Screen.Reports:
        return (
          <ReportsScreen 
            moodHistory={user ? moodHistory : []} 
            chatCount={chatHistory.filter(m => m.role === 'user').length}
            userProfile={userProfile}
            achievements={achievements}
          />
        );
      case Screen.Settings:
        return <SettingsScreen settings={settings} onSettingsChange={setSettings} />;
      case Screen.News:
        return <NewsScreen />;
      case Screen.Gratitude:
        return <GratitudeScreen />;
      default:
        return <HomeScreen userProfile={userProfile} moodHistory={user ? moodHistory : []} onMoodSelect={handleMoodSelect} navigateTo={handleNavigateTo} onOpenSideMenu={() => setIsSideMenuOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <main className="h-screen overflow-hidden">{renderScreen()}</main>
      <BottomNav activeScreen={activeScreen} navigateTo={handleNavigateTo} iconSet={settings.iconSet} />
      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        userProfile={userProfile}
        navigateTo={handleNavigateTo}
        onLogout={handleLogout}
        iconSet={settings.iconSet}
        isGuest={!user}
        onShowSignUp={() => showSignUp('Crie sua conta', 'Salve seu progresso e acesse de qualquer lugar')}
      />
      <SignUpDialog
        open={showSignUpDialog}
        onOpenChange={setShowSignUpDialog}
        title={signUpDialogConfig.title}
        description={signUpDialogConfig.description}
      />
    </div>
  );
};

export default App;
