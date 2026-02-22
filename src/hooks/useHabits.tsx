import { useState, useEffect, useCallback } from 'react';
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

  return { habits, isLoading, addHabit, deleteHabit, getHabitsForDate, fetchHabits };
};
