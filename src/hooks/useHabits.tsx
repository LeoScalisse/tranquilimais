import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface HabitEntry {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  color: string;
}

export const useHabits = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<HabitEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHabits = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      setHabits(
        (data || []).map((h: any) => ({
          id: h.id,
          title: h.title,
          date: h.date,
          color: h.color,
        }))
      );
    } catch (err) {
      console.error('Error fetching habits:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const addHabit = useCallback(async (title: string, date: string, color: string): Promise<HabitEntry | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({ user_id: user.id, title, date, color })
        .select()
        .single();

      if (error) throw error;

      const newHabit: HabitEntry = {
        id: data.id,
        title: data.title,
        date: data.date,
        color: data.color,
      };

      setHabits(prev => [newHabit, ...prev]);
      return newHabit;
    } catch (err) {
      console.error('Error adding habit:', err);
      return null;
    }
  }, [user]);

  const deleteHabit = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setHabits(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error('Error deleting habit:', err);
    }
  }, [user]);

  const getHabitsForDate = useCallback((dateStr: string) => {
    return habits.filter(h => h.date === dateStr);
  }, [habits]);

  const streaks = useMemo(() => {
    if (habits.length === 0) return { current: 0, best: 0 };
    const uniqueDates = [...new Set(habits.map(h => h.date))].sort().reverse();
    if (uniqueDates.length === 0) return { current: 0, best: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Current streak
    let current = 0;
    if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
      const startDate = new Date(uniqueDates[0] + 'T12:00:00');
      current = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const expected = new Date(startDate);
        expected.setDate(expected.getDate() - i);
        if (uniqueDates[i] === expected.toISOString().split('T')[0]) {
          current++;
        } else break;
      }
    }

    // Best streak
    let best = 0, run = 1;
    const sorted = [...uniqueDates].sort();
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1] + 'T12:00:00');
      prev.setDate(prev.getDate() + 1);
      if (sorted[i] === prev.toISOString().split('T')[0]) {
        run++;
      } else {
        best = Math.max(best, run);
        run = 1;
      }
    }
    best = Math.max(best, run, current);

    return { current, best };
  }, [habits]);

  return { habits, isLoading, addHabit, deleteHabit, getHabitsForDate, fetchHabits, streaks };
};
