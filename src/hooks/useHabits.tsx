import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface HabitDefinition {
  id: string;
  title: string;
  color: string;
  archived: boolean;
  created_at: string;
}

export interface HabitEntry {
  id: string;
  title: string;
  date: string;
  color: string;
  habit_definition_id: string | null;
}

export const useHabits = () => {
  const { user } = useAuth();
  const [definitions, setDefinitions] = useState<HabitDefinition[]>([]);
  const [habits, setHabits] = useState<HabitEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setDefinitions([]);
      setHabits([]);
      setIsLoading(false);
      return;
    }
    try {
      const [defRes, habRes] = await Promise.all([
        supabase.from('habit_definitions').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('habits').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      ]);
      if (defRes.error) throw defRes.error;
      if (habRes.error) throw habRes.error;

      setDefinitions(
        (defRes.data || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          color: d.color,
          archived: d.archived,
          created_at: d.created_at,
        }))
      );
      setHabits(
        (habRes.data || []).map((h: any) => ({
          id: h.id,
          title: h.title,
          date: h.date,
          color: h.color,
          habit_definition_id: h.habit_definition_id,
        }))
      );
    } catch (err) {
      console.error('Error fetching habits:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const activeDefinitions = useMemo(() => definitions.filter(d => !d.archived), [definitions]);

  const createDefinition = useCallback(async (title: string, color: string): Promise<HabitDefinition | null> => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('habit_definitions')
        .insert({ user_id: user.id, title, color })
        .select()
        .single();
      if (error) throw error;
      const newDef: HabitDefinition = { id: data.id, title: data.title, color: data.color, archived: data.archived, created_at: data.created_at };
      setDefinitions(prev => [...prev, newDef]);
      return newDef;
    } catch (err) {
      console.error('Error creating habit definition:', err);
      return null;
    }
  }, [user]);

  const deleteDefinition = useCallback(async (id: string) => {
    if (!user) return;
    try {
      // Delete all entries for this definition too
      await supabase.from('habits').delete().eq('habit_definition_id', id).eq('user_id', user.id);
      const { error } = await supabase.from('habit_definitions').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      setDefinitions(prev => prev.filter(d => d.id !== id));
      setHabits(prev => prev.filter(h => h.habit_definition_id !== id));
    } catch (err) {
      console.error('Error deleting habit definition:', err);
    }
  }, [user]);

  const toggleHabitForDate = useCallback(async (definitionId: string, dateStr: string) => {
    if (!user) return;
    const def = definitions.find(d => d.id === definitionId);
    if (!def) return;

    const existing = habits.find(h => h.habit_definition_id === definitionId && h.date === dateStr);
    if (existing) {
      // Remove
      try {
        const { error } = await supabase.from('habits').delete().eq('id', existing.id).eq('user_id', user.id);
        if (error) throw error;
        setHabits(prev => prev.filter(h => h.id !== existing.id));
      } catch (err) {
        console.error('Error removing habit entry:', err);
      }
    } else {
      // Add
      try {
        const { data, error } = await supabase
          .from('habits')
          .insert({ user_id: user.id, title: def.title, date: dateStr, color: def.color, habit_definition_id: definitionId })
          .select()
          .single();
        if (error) throw error;
        const newEntry: HabitEntry = { id: data.id, title: data.title, date: data.date, color: data.color, habit_definition_id: data.habit_definition_id };
        setHabits(prev => [newEntry, ...prev]);
      } catch (err) {
        console.error('Error adding habit entry:', err);
      }
    }
  }, [user, definitions, habits]);

  const getHabitsForDate = useCallback((dateStr: string) => {
    return habits.filter(h => h.date === dateStr);
  }, [habits]);

  const isHabitDoneForDate = useCallback((definitionId: string, dateStr: string) => {
    return habits.some(h => h.habit_definition_id === definitionId && h.date === dateStr);
  }, [habits]);

  // Per-habit streaks
  const getStreakForHabit = useCallback((definitionId: string) => {
    const entries = habits.filter(h => h.habit_definition_id === definitionId);
    const uniqueDates = [...new Set(entries.map(h => h.date))].sort().reverse();
    if (uniqueDates.length === 0) return { current: 0, best: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let current = 0;
    if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
      const startDate = new Date(uniqueDates[0] + 'T12:00:00');
      current = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const expected = new Date(startDate);
        expected.setDate(expected.getDate() - i);
        if (uniqueDates[i] === expected.toISOString().split('T')[0]) current++;
        else break;
      }
    }

    let best = 0, run = 1;
    const sorted = [...uniqueDates].sort();
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1] + 'T12:00:00');
      prev.setDate(prev.getDate() + 1);
      if (sorted[i] === prev.toISOString().split('T')[0]) run++;
      else { best = Math.max(best, run); run = 1; }
    }
    best = Math.max(best, run, current);

    return { current, best };
  }, [habits]);

  // Global streaks (any habit done)
  const streaks = useMemo(() => {
    if (habits.length === 0) return { current: 0, best: 0 };
    const uniqueDates = [...new Set(habits.map(h => h.date))].sort().reverse();
    if (uniqueDates.length === 0) return { current: 0, best: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let current = 0;
    if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
      const startDate = new Date(uniqueDates[0] + 'T12:00:00');
      current = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const expected = new Date(startDate);
        expected.setDate(expected.getDate() - i);
        if (uniqueDates[i] === expected.toISOString().split('T')[0]) current++;
        else break;
      }
    }

    let best = 0, run = 1;
    const sorted = [...uniqueDates].sort();
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1] + 'T12:00:00');
      prev.setDate(prev.getDate() + 1);
      if (sorted[i] === prev.toISOString().split('T')[0]) run++;
      else { best = Math.max(best, run); run = 1; }
    }
    best = Math.max(best, run, current);

    return { current, best };
  }, [habits]);

  return {
    definitions,
    activeDefinitions,
    habits,
    isLoading,
    createDefinition,
    deleteDefinition,
    toggleHabitForDate,
    getHabitsForDate,
    isHabitDoneForDate,
    getStreakForHabit,
    streaks,
    fetchAll,
  };
};
