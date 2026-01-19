import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface GameRecord {
  id: string;
  user_id: string;
  game_id: string;
  game_name: string;
  score: number;
  level: number | null;
  time_seconds: number | null;
  metadata: any;
  achieved_at: string;
}

export function useGameRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!user) return [];

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('game_records')
        .select('*')
        .eq('user_id', user.id)
        .order('score', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching game records:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getRecord = useCallback((gameId: string) => {
    return records.find(r => r.game_id === gameId);
  }, [records]);

  const saveRecord = useCallback(async (
    gameId: string,
    gameName: string,
    score: number,
    level?: number,
    timeSeconds?: number,
    metadata?: Record<string, any>
  ) => {
    if (!user) return null;

    try {
      // Check if record exists
      const existing = records.find(r => r.game_id === gameId);
      
      // Only update if new score is higher
      if (existing && existing.score >= score) {
        return existing;
      }

      const { data, error } = await supabase
        .from('game_records')
        .upsert({
          user_id: user.id,
          game_id: gameId,
          game_name: gameName,
          score,
          level: level || null,
          time_seconds: timeSeconds || null,
          metadata: metadata || null,
          achieved_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,game_id'
        })
        .select()
        .single();

      if (error) throw error;
      
      setRecords(prev => {
        const filtered = prev.filter(r => r.game_id !== gameId);
        return [...filtered, data].sort((a, b) => b.score - a.score);
      });
      
      return data;
    } catch (error) {
      console.error('Error saving game record:', error);
      return null;
    }
  }, [user, records]);

  const deleteRecord = useCallback(async (gameId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('game_records')
        .delete()
        .eq('game_id', gameId)
        .eq('user_id', user.id);

      if (error) throw error;
      setRecords(prev => prev.filter(r => r.game_id !== gameId));
      return true;
    } catch (error) {
      console.error('Error deleting game record:', error);
      return false;
    }
  }, [user]);

  return {
    records,
    isLoading,
    fetchRecords,
    getRecord,
    saveRecord,
    deleteRecord,
  };
}
