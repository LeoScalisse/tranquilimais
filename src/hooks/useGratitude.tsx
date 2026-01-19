import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface GratitudeEntry {
  id: string;
  user_id: string;
  content: string;
  mood_emoji: string | null;
  created_at: string;
  updated_at: string;
}

export function useGratitude() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!user) return [];

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gratitude_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching gratitude entries:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const addEntry = useCallback(async (content: string, moodEmoji?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('gratitude_entries')
        .insert({
          user_id: user.id,
          content,
          mood_emoji: moodEmoji || null
        })
        .select()
        .single();

      if (error) throw error;
      setEntries(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding gratitude entry:', error);
      return null;
    }
  }, [user]);

  const updateEntry = useCallback(async (id: string, content: string, moodEmoji?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('gratitude_entries')
        .update({ content, mood_emoji: moodEmoji || null })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setEntries(prev => 
        prev.map(e => e.id === id ? { ...e, content, mood_emoji: moodEmoji || null } : e)
      );
      return true;
    } catch (error) {
      console.error('Error updating gratitude entry:', error);
      return false;
    }
  }, [user]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('gratitude_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setEntries(prev => prev.filter(e => e.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting gratitude entry:', error);
      return false;
    }
  }, [user]);

  const getTodayEntry = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return entries.find(e => e.created_at.startsWith(today));
  }, [entries]);

  return {
    entries,
    isLoading,
    fetchEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    getTodayEntry,
  };
}
