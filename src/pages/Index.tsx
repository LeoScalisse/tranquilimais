import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, Screen, Mood, MoodEntry, AppSettings, ChatMessage } from '../types';
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
import { setMasterVolume } from '../services/soundService';

const STORAGE_KEYS = {
  profile: 'tranquili_profile',
  moodHistory: 'tranquili_mood_history',
  chatHistory: 'tranquili_chat_history',
  settings: 'tranquili_settings',
};

const getDefaultSettings = (): AppSettings => ({
  notificationsEnabled: true,
  soundVolume: 0.5,
  iconSet: 'default',
});

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeScreen, setActiveScreen] = useState<Screen>(Screen.Home);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getDefaultSettings());
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage
  useEffect(() => {
    const storedProfile = localStorage.getItem(STORAGE_KEYS.profile);
    const storedMood = localStorage.getItem(STORAGE_KEYS.moodHistory);
    const storedChat = localStorage.getItem(STORAGE_KEYS.chatHistory);
    const storedSettings = localStorage.getItem(STORAGE_KEYS.settings);

    if (storedProfile) setUserProfile(JSON.parse(storedProfile));
    if (storedMood) setMoodHistory(JSON.parse(storedMood));
    if (storedChat) setChatHistory(JSON.parse(storedChat));
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      setSettings(parsed);
      setMasterVolume(parsed.soundVolume);
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoading) {
      if (userProfile) localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(userProfile));
      localStorage.setItem(STORAGE_KEYS.moodHistory, JSON.stringify(moodHistory));
      localStorage.setItem(STORAGE_KEYS.chatHistory, JSON.stringify(chatHistory));
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    }
  }, [userProfile, moodHistory, chatHistory, settings, isLoading]);

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    setActiveScreen(Screen.Home);
  };

  const handleMoodSelect = (mood: Mood) => {
    const today = new Date().toISOString().split('T')[0];
    if (moodHistory.some(entry => entry.date === today)) return;
    setMoodHistory([...moodHistory, { date: today, mood }]);
  };

  const handleSendMessage = useCallback((message: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: message,
      timestamp: Date.now(),
    };
    setChatHistory(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Entendo como você se sente. Lembre-se: cada passo conta, mesmo os pequenos.",
        "Obrigada por compartilhar isso comigo. Você está fazendo um ótimo trabalho cuidando de si.",
        "É normal ter dias difíceis. O importante é que você está aqui, buscando se sentir melhor.",
        "Que bom que você veio conversar! Como posso ajudar você a se sentir mais tranquilo hoje?",
        "Respire fundo comigo. Inspire... e expire. Você está seguro aqui.",
      ];
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: Date.now(),
      };
      setChatHistory(prev => [...prev, aiMessage]);
      setIsChatLoading(false);
    }, 1500);
  }, []);

  const handleLogout = () => {
    setUserProfile(null);
    setMoodHistory([]);
    setChatHistory([]);
    setSettings(getDefaultSettings());
    localStorage.clear();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-tranquili-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case Screen.Home:
        return (
          <HomeScreen
            userProfile={userProfile}
            moodHistory={moodHistory}
            onMoodSelect={handleMoodSelect}
            navigateTo={setActiveScreen}
            onOpenSideMenu={() => setIsSideMenuOpen(true)}
          />
        );
      case Screen.Chat:
        return <ChatScreen chatHistory={chatHistory} onSendMessage={handleSendMessage} isLoading={isChatLoading} />;
      case Screen.Games:
        return <GamesScreen />;
      case Screen.Reports:
        return <ReportsScreen moodHistory={moodHistory} chatCount={chatHistory.filter(m => m.role === 'user').length} />;
      case Screen.Settings:
        return <SettingsScreen settings={settings} onSettingsChange={setSettings} />;
      case Screen.News:
        return <NewsScreen />;
      case Screen.Gratitude:
        return <GratitudeScreen />;
      default:
        return <HomeScreen userProfile={userProfile} moodHistory={moodHistory} onMoodSelect={handleMoodSelect} navigateTo={setActiveScreen} onOpenSideMenu={() => setIsSideMenuOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <main className="h-screen overflow-hidden">{renderScreen()}</main>
      <BottomNav activeScreen={activeScreen} navigateTo={setActiveScreen} iconSet={settings.iconSet} />
      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        userProfile={userProfile}
        navigateTo={setActiveScreen}
        onLogout={handleLogout}
        iconSet={settings.iconSet}
      />
    </div>
  );
};

export default App;
