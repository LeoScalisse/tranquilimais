import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, MoodEntry, Mood, Screen, WellnessTipData, MoodCheckinData } from '../types';
import { MOOD_OPTIONS, MOOD_EMOJIS, MOOD_HEX_COLORS, WELLNESS_TIPS, ICON_SETS } from '../constants';
import { playSound } from '../services/soundService';
import { RefreshCwIcon, MenuIcon } from '../components/ui/Icons';
import BrandText from '../components/BrandText';
import { BentoCard, BentoGrid } from '../components/ui/bento-grid';
import { MessageCircle, Gamepad2, BarChart3, Heart, Newspaper } from 'lucide-react';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import MoodCheckin from '../components/mood/MoodCheckin';
import { AnimatePresence } from 'framer-motion';
interface HomeScreenProps {
  userProfile: UserProfile;
  moodHistory: MoodEntry[];
  onMoodSelect: (mood: Mood, checkinData?: MoodCheckinData) => void;
  navigateTo: (screen: Screen) => void;
  onOpenSideMenu: () => void;
}
const MAX_REFRESHES_PER_DAY = 5;
const REFRESH_STORAGE_KEY = 'wellness_tip_refresh';
const GRATITUDE_STORAGE_KEY = 'gratitude_events';
const WellnessTipCard: React.FC<{
  tipData: WellnessTipData | null;
  isLoading: boolean;
  onRefresh: () => void;
  refreshCount: number;
  maxRefreshes: number;
}> = ({
  tipData,
  isLoading,
  onRefresh,
  refreshCount,
  maxRefreshes
}) => {
  return <div className="bg-white/80 backdrop-blur-lg p-5 rounded-xl shadow-md mb-6 relative overflow-hidden border border-white/40">
      {isLoading ? <div className="animate-pulse flex items-start">
          <div className="w-8 h-8 rounded-full bg-gray-200 mr-4 flex-shrink-0"></div>
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-3 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-8"></div>
            </div>
            <div className="space-y-2 py-1">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-11/12"></div>
            </div>
          </div>
        </div> : <div className="flex items-start">
          <span className="text-2xl mr-4 mt-1 filter drop-shadow-sm">💡</span>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wide opacity-80 mb-1">
                {tipData?.author ? 'Inspiração do Dia' : 'Dica do Dia'}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-gray-400">{refreshCount}/{maxRefreshes}</span>
                <button onClick={onRefresh} disabled={refreshCount >= maxRefreshes} className={`p-1.5 rounded-full transition-all duration-300 ${refreshCount >= maxRefreshes ? 'text-gray-300 cursor-not-allowed' : 'text-tranquili-blue hover:bg-blue-50 hover:rotate-180'}`} title="Nova dica">
                  <RefreshCwIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className={`text-gray-800 text-base leading-relaxed ${tipData?.author ? 'italic font-serif' : ''}`}>
              "<BrandText text={tipData?.text || ""} />"
            </p>
            <p className="text-right text-xs font-semibold text-gray-500 mt-2 border-t border-gray-200 pt-2 inline-block float-right">
              — <BrandText text={tipData?.author || "Tranquili+"} />
            </p>
          </div>
        </div>}
    </div>;
};
const GratitudeJournal: React.FC<{
  onSaved?: () => void;
}> = ({
  onSaved
}) => {
  const [entry, setEntry] = useState('');
  const [savedToday, setSavedToday] = useState<string | null>(null);
  useEffect(() => {
    const todayStr = new Date().toDateString();
    const stored = localStorage.getItem(GRATITUDE_STORAGE_KEY);
    if (stored) {
      try {
        const allEvents = JSON.parse(stored);
        const todayEntry = allEvents.find((e: any) => e.category === "Gratidão" && new Date(e.startTime).toDateString() === todayStr);
        if (todayEntry) {
          setSavedToday(todayEntry.title);
        }
      } catch {}
    }
  }, []);
  const handleSave = () => {
    if (!entry.trim()) return;
    playSound('confirm');
    const stored = localStorage.getItem(GRATITUDE_STORAGE_KEY);
    const allEvents = stored ? JSON.parse(stored) : [];
    const newEvent = {
      id: crypto.randomUUID(),
      title: entry,
      category: "Gratidão",
      startTime: new Date().toISOString(),
      color: "yellow"
    };
    allEvents.push(newEvent);
    localStorage.setItem(GRATITUDE_STORAGE_KEY, JSON.stringify(allEvents));
    setSavedToday(entry);
    setEntry('');

    // Navigate to Gratitude screen after saving
    if (onSaved) {
      setTimeout(() => onSaved(), 300);
    }
  };
  if (savedToday) {
    return <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl shadow-sm border border-yellow-100 mb-6">
        <h3 className="font-bold text-yellow-800 text-sm mb-2">✨ Gratidão de Hoje</h3>
        <p className="text-yellow-900 text-sm italic">"{savedToday}"</p>
      </div>;
  }
  return <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl shadow-sm border border-yellow-100 mb-6">
      <h3 className="font-bold text-yellow-800 text-sm mb-2">🙏 Pelo que você é grato hoje?</h3>
      <textarea value={entry} onChange={e => setEntry(e.target.value)} placeholder="Escreva aqui algo que te fez feliz..." className="w-full p-3 rounded-lg border border-yellow-200 bg-white/80 text-gray-800 text-sm resize-none focus:ring-2 focus:ring-yellow-300 outline-none" rows={2} />
      <button onClick={handleSave} disabled={!entry.trim()} className={`mt-2 w-full py-2 rounded-lg font-medium text-sm transition-all ${entry.trim() ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
        Salvar
      </button>
    </div>;
};
const HomeScreen: React.FC<HomeScreenProps> = ({
  userProfile,
  moodHistory,
  onMoodSelect,
  navigateTo,
  onOpenSideMenu
}) => {
  const [wellnessTip, setWellnessTip] = useState<WellnessTipData | null>(null);
  const [isTipLoading, setIsTipLoading] = useState(true);
  const [dailyRefreshCount, setDailyRefreshCount] = useState(0);
  const [greeting, setGreeting] = useState('');
  const [showMoodCheckin, setShowMoodCheckin] = useState(false);
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const hasLoggedMoodToday = moodHistory.some(entry => entry.date === today);
  const fetchTip = (isRefresh: boolean) => {
    setIsTipLoading(true);
    setTimeout(() => {
      const randomTip = WELLNESS_TIPS[Math.floor(Math.random() * WELLNESS_TIPS.length)];
      setWellnessTip(randomTip);
      setIsTipLoading(false);
      if (isRefresh) {
        const newCount = dailyRefreshCount + 1;
        setDailyRefreshCount(newCount);
        localStorage.setItem(REFRESH_STORAGE_KEY, JSON.stringify({
          date: today,
          count: newCount
        }));
      }
    }, 500);
  };
  useEffect(() => {
    if (userProfile?.name) {
      const GREETINGS = [`Olá, ${userProfile.name}. Como você está?`, `Oi, ${userProfile.name}. Um novo dia começa.`, `Boa noite, ${userProfile.name}. Descanse aqui.`, `Que bom te ver, ${userProfile.name}.`, `Sua mente sorriu, ${userProfile.name}.`, `Esse momento é seu, ${userProfile.name}.`, `Tranquili+ te acolhe, ${userProfile.name}.`, `Um instante de paz, ${userProfile.name}.`];
      const randomGreeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      setGreeting(randomGreeting);
    }
    const stored = localStorage.getItem(REFRESH_STORAGE_KEY);
    if (stored) {
      const {
        date,
        count
      } = JSON.parse(stored);
      setDailyRefreshCount(date === today ? count : 0);
    }
    fetchTip(false);
  }, [userProfile?.name, today]);
  const handleOpenMoodCheckin = () => {
    playSound('select');
    setShowMoodCheckin(true);
  };
  const handleMoodCheckinComplete = (checkinData: MoodCheckinData, _aiResponse: string) => {
    // Map the first emotion to a legacy mood for backwards compatibility
    const emotionToMood: Record<string, Mood> = {
      'calmo': 'calm',
      'ansioso': 'anxious',
      'triste': 'sad',
      'cansado': 'sad',
      'sobrecarregado': 'anxious',
      'grato': 'happy',
      'motivado': 'happy',
      'confuso': 'neutral',
      'esperancoso': 'happy',
      'vazio': 'sad'
    };
    const primaryEmotion = checkinData.emotions[0] || 'calmo';
    const legacyMood = emotionToMood[primaryEmotion] || 'neutral';
    onMoodSelect(legacyMood, checkinData);
    setShowMoodCheckin(false);
  };
  return <div className="p-4 pb-28 bg-gray-50 h-full overflow-y-auto">
      <header className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight leading-tight">
            <BrandText text={greeting} />
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Reserve um instante para notar a beleza de ser e sentir o seu redor...
          </p>
        </div>
        <button onClick={() => {
        playSound('toggle');
        onOpenSideMenu();
      }} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0" aria-label="Abrir menu">
          <MenuIcon className="w-7 h-7" />
        </button>
      </header>

      <WellnessTipCard tipData={wellnessTip} isLoading={isTipLoading} onRefresh={() => dailyRefreshCount < MAX_REFRESHES_PER_DAY && (playSound('select'), fetchTip(true))} refreshCount={dailyRefreshCount} maxRefreshes={MAX_REFRESHES_PER_DAY} />

      <div className="mb-6">
        {hasLoggedMoodToday ? <div className="bg-white p-4 rounded-xl shadow-md text-center">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Seu humor de hoje:</h2>
            <p className="text-5xl">{MOOD_EMOJIS[moodHistory.find(e => e.date === today)!.mood]}</p>
          </div> : <button onClick={handleOpenMoodCheckin} className="w-full bg-gradient-to-br from-primary/90 to-blue-500 p-6 rounded-xl shadow-lg text-white hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            <div className="flex items-center justify-center gap-3 mb-2">
              
              <h2 className="text-lg font-semibold">
                Como você está se sentindo agora?
              </h2>
            </div>
            <p className="text-sm text-white/80">
              Toque para fazer seu check-in emocional
            </p>
          </button>}
      </div>

      {/* Mood Checkin Modal */}
      <AnimatePresence>
        {showMoodCheckin && <MoodCheckin onComplete={handleMoodCheckinComplete} onClose={() => setShowMoodCheckin(false)} />}
      </AnimatePresence>

      <GratitudeJournal onSaved={() => navigateTo(Screen.Gratitude)} />

      <BentoGrid className="grid-cols-2 lg:grid-cols-3 auto-rows-[140px] lg:auto-rows-[180px]">
        <BentoCard name="Tranquilinha" className="col-span-1 lg:col-span-1 bg-gradient-to-br from-tranquili-blue to-blue-400" background={<div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_white_0%,_transparent_50%)]" />} Icon={MessageCircle} description="" onClick={() => {
        playSound('select');
        navigateTo(Screen.Chat);
      }} cta="Acessar" />
        <BentoCard name="Games" className="col-span-1 lg:col-span-1 bg-gradient-to-br from-purple-400 to-pink-400" background={<div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_white_0%,_transparent_50%)]" />} Icon={Gamepad2} description="" onClick={() => {
        playSound('select');
        navigateTo(Screen.Games);
      }} cta="Jogar" />
        <BentoCard name="Evolução" className="col-span-1 lg:col-span-1 bg-gradient-to-br from-green-400 to-emerald-400" background={<div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_white_0%,_transparent_50%)]" />} Icon={BarChart3} description="" onClick={() => {
        playSound('select');
        navigateTo(Screen.Reports);
      }} cta="Ver relatórios" />
        <BentoCard name="Gratidão" className="col-span-1 lg:col-span-1 bg-gradient-to-br from-yellow-400 to-orange-400" background={<div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_white_0%,_transparent_50%)]" />} Icon={Heart} description="" onClick={() => {
        playSound('select');
        navigateTo(Screen.Gratitude);
      }} cta="Acessar" />
        <BentoCard name="Notícias" className="col-span-2 lg:col-span-1 bg-gradient-to-br from-sky-400 to-cyan-400" background={<div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_white_0%,_transparent_50%)]" />} Icon={Newspaper} description="" onClick={() => {
        playSound('select');
        navigateTo(Screen.News);
      }} cta="Ler mais" />
      </BentoGrid>

      <PWAInstallPrompt />
    </div>;
};
export default HomeScreen;