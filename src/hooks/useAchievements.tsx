import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Achievement, MoodEntry } from '@/types';

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
}

const ALL_ACHIEVEMENTS: Omit<Achievement, 'unlocked'>[] = [
  { id: 'first_log', title: 'Primeiro Passo', description: 'Você registrou seu primeiro humor!' },
  { id: 'three_day_streak', title: 'Consistência é Chave', description: 'Registrou o humor por 3 dias seguidos.' },
  { id: 'week_streak', title: 'Hábito Saudável', description: 'Registrou o humor por 7 dias seguidos.' },
  { id: 'first_happy', title: 'Momento Feliz', description: 'Registrou "feliz" pela primeira vez.' },
  { id: 'first_calm', title: 'Encontrando a Calma', description: 'Registrou "calmo" pela primeira vez.' },
  { id: 'first_chat', title: 'Abrindo o Coração', description: 'Iniciou sua primeira conversa com a Tranquilinha.' },
  { id: 'ten_logs', title: 'Jornada Iniciada', description: 'Registrou o humor 10 vezes.' },
  { id: 'thirty_logs', title: 'Dedicação Total', description: 'Registrou o humor 30 vezes.' },
];

export const useAchievements = () => {
  const { user } = useAuth();
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Fetch unlocked achievements from database
  useEffect(() => {
    if (!user) {
      setUnlockedIds(new Set());
      setLoading(false);
      return;
    }

    const fetchAchievements = async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id);

      if (!error && data) {
        setUnlockedIds(new Set(data.map((a: UserAchievement) => a.achievement_id)));
      }
      setLoading(false);
    };

    fetchAchievements();
  }, [user]);

  // Unlock a new achievement
  const unlockAchievement = useCallback(async (achievementId: string) => {
    if (!user || unlockedIds.has(achievementId)) return false;

    const { error } = await supabase
      .from('achievements')
      .insert({ user_id: user.id, achievement_id: achievementId });

    if (!error) {
      setUnlockedIds(prev => new Set([...prev, achievementId]));
      return true;
    }
    return false;
  }, [user, unlockedIds]);

  // Check and unlock achievements based on current state
  const checkAndUnlockAchievements = useCallback(async (moodHistory: MoodEntry[], chatMessagesCount: number) => {
    if (!user) return [];

    const newlyUnlocked: string[] = [];

    // First Log
    if (moodHistory.length >= 1 && !unlockedIds.has('first_log')) {
      if (await unlockAchievement('first_log')) {
        newlyUnlocked.push('first_log');
      }
    }

    // 10 logs
    if (moodHistory.length >= 10 && !unlockedIds.has('ten_logs')) {
      if (await unlockAchievement('ten_logs')) {
        newlyUnlocked.push('ten_logs');
      }
    }

    // 30 logs
    if (moodHistory.length >= 30 && !unlockedIds.has('thirty_logs')) {
      if (await unlockAchievement('thirty_logs')) {
        newlyUnlocked.push('thirty_logs');
      }
    }

    // Streaks calculation
    if (moodHistory.length >= 3) {
      const sortedDates = [...new Set(moodHistory.map(h => h.date))].sort();
      let currentStreak = 1;
      let maxStreak = 1;
      
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      }
      
      if (maxStreak >= 3 && !unlockedIds.has('three_day_streak')) {
        if (await unlockAchievement('three_day_streak')) {
          newlyUnlocked.push('three_day_streak');
        }
      }
      if (maxStreak >= 7 && !unlockedIds.has('week_streak')) {
        if (await unlockAchievement('week_streak')) {
          newlyUnlocked.push('week_streak');
        }
      }
    }

    // First moods
    if (moodHistory.some(h => h.mood === 'happy') && !unlockedIds.has('first_happy')) {
      if (await unlockAchievement('first_happy')) {
        newlyUnlocked.push('first_happy');
      }
    }
    if (moodHistory.some(h => h.mood === 'calm') && !unlockedIds.has('first_calm')) {
      if (await unlockAchievement('first_calm')) {
        newlyUnlocked.push('first_calm');
      }
    }

    // First chat
    if (chatMessagesCount >= 1 && !unlockedIds.has('first_chat')) {
      if (await unlockAchievement('first_chat')) {
        newlyUnlocked.push('first_chat');
      }
    }

    return newlyUnlocked;
  }, [user, unlockedIds, unlockAchievement]);

  // Get all achievements with unlock status
  const getAchievements = useCallback((): Achievement[] => {
    return ALL_ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: unlockedIds.has(a.id),
    }));
  }, [unlockedIds]);

  return {
    achievements: getAchievements(),
    loading,
    checkAndUnlockAchievements,
    unlockAchievement,
    unlockedCount: unlockedIds.size,
    totalCount: ALL_ACHIEVEMENTS.length,
  };
};
