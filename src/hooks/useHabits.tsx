import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface HabitDefinition {
  id: string;
  title: string;
  color: string;
  archived: boolean;
}

export interface HabitEntry {
  id: string;
  habit_definition_id: string | null;
  title: string;
  date: string;
  color: string;
}

export interface HabitStreak {
  current: number;
  best: number;
  total: number;
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
      const [defsRes, habitsRes] = await Promise.all([
        supabase.from('habit_definitions').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('habits').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      ]);

      if (defsRes.error) throw defsRes.error;
      if (habitsRes.error) throw habitsRes.error;

      setDefinitions(
        (defsRes.data || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          color: d.color,
          archived: d.archived,
        }))
      );

      setHabits(
        (habitsRes.data || []).map((h: any) => ({
          id: h.id,
          habit_definition_id: h.habit_definition_id,
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
    fetchAll();
  }, [fetchAll]);

  // --- Definitions CRUD ---
  const createDefinition = useCallback(async (title: string, color: string): Promise<HabitDefinition | null> => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('habit_definitions')
        .insert({ user_id: user.id, title, color })
        .select()
        .single();
      if (error) throw error;
      const def: HabitDefinition = { id: data.id, title: data.title, color: data.color, archived: data.archived };
      setDefinitions(prev => [...prev, def]);
      return def;
    } catch (err) {
      console.error('Error creating habit definition:', err);
      return null;
    }
  }, [user]);

  const archiveDefinition = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('habit_definitions')
        .update({ archived: true })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      setDefinitions(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Error archiving habit definition:', err);
    }
  }, [user]);

  // --- Daily logging ---
  const logHabit = useCallback(async (definitionId: string, date: string) => {
    if (!user) return;
    const def = definitions.find(d => d.id === definitionId);
    if (!def) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({ user_id: user.id, title: def.title, color: def.color, date, habit_definition_id: definitionId })
        .select()
        .single();
      if (error) throw error;
      setHabits(prev => [{
        id: data.id,
        habit_definition_id: data.habit_definition_id,
        title: data.title,
        date: data.date,
        color: data.color,
      }, ...prev]);
    } catch (err) {
      console.error('Error logging habit:', err);
    }
  }, [user, definitions]);

  const unlogHabit = useCallback(async (definitionId: string, date: string) => {
    if (!user) return;
    const entry = habits.find(h => h.habit_definition_id === definitionId && h.date === date);
    if (!entry) return;

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', entry.id)
        .eq('user_id', user.id);
      if (error) throw error;
      setHabits(prev => prev.filter(h => h.id !== entry.id));
    } catch (err) {
      console.error('Error unlogging habit:', err);
    }
  }, [user, habits]);

  const isHabitLogged = useCallback((definitionId: string, date: string) => {
    return habits.some(h => h.habit_definition_id === definitionId && h.date === date);
  }, [habits]);

  const getHabitsForDate = useCallback((dateStr: string) => {
    return habits.filter(h => h.date === dateStr);
  }, [habits]);

  // --- Per-habit streaks ---
  const getStreakForHabit = useCallback((definitionId: string): HabitStreak => {
    const entries = habits.filter(h => h.habit_definition_id === definitionId);
    if (entries.length === 0) return { current: 0, best: 0, total: 0 };

    const uniqueDates = [...new Set(entries.map(h => h.date))].sort().reverse();
    const total = uniqueDates.length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

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

    return { current, best, total };
  }, [habits]);

  // Global streaks (backward compat)
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

  const activeDefinitions = useMemo(() => definitions.filter(d => !d.archived), [definitions]);

  return {
    definitions: activeDefinitions,
    habits,
    isLoading,
    createDefinition,
    archiveDefinition,
    logHabit,
    unlogHabit,
    isHabitLogged,
    getHabitsForDate,
    getStreakForHabit,
    fetchHabits: fetchAll,
    streaks,
  };
};
