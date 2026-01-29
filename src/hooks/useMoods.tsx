import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Mood, MoodEntry, MoodCheckinData } from '@/types';

export const useMoods = () => {
  const { user } = useAuth();
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch moods from database
  const fetchMoods = useCallback(async () => {
    if (!user) {
      setMoodHistory([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('moods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMoods: MoodEntry[] = (data || []).map(mood => ({
        id: mood.id,
        user_id: mood.user_id,
        date: mood.created_at.split('T')[0],
        mood: getMoodFromLevel(mood.mood_level),
        checkin_data: mood.checkin_data as unknown as MoodCheckinData | undefined
      }));

      setMoodHistory(formattedMoods);
    } catch (error) {
      console.error('Error fetching moods:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMoods();
  }, [fetchMoods]);

  // Add a new mood with check-in data
  const addMood = async (mood: Mood, note?: string, checkinData?: MoodCheckinData) => {
    if (!user) return false;

    const today = new Date().toISOString().split('T')[0];
    
    // Check if mood already registered today
    if (moodHistory.some(entry => entry.date === today)) {
      return false;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertData: any = {
        user_id: user.id,
        mood_level: getMoodLevel(mood),
        note,
      };
      
      if (checkinData) {
        insertData.checkin_data = checkinData;
      }

      const { error } = await supabase
        .from('moods')
        .insert([insertData]);

      if (error) throw error;

      // Refresh moods
      await fetchMoods();
      return true;
    } catch (error) {
      console.error('Error adding mood:', error);
      return false;
    }
  };

  return { moodHistory, loading, addMood, fetchMoods };
};

// Helper functions to convert between mood string and level
const getMoodLevel = (mood: Mood): number => {
  const levels: Record<Mood, number> = {
    happy: 5,
    calm: 4,
    neutral: 3,
    sad: 2,
    anxious: 1
  };
  return levels[mood];
};

const getMoodFromLevel = (level: number): Mood => {
  const moods: Record<number, Mood> = {
    5: 'happy',
    4: 'calm',
    3: 'neutral',
    2: 'sad',
    1: 'anxious'
  };
  return moods[level] || 'neutral';
};
