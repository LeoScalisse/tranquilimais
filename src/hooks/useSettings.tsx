import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { AppSettings } from '@/types';
import { setMasterVolume } from '@/services/soundService';

const getDefaultSettings = (): AppSettings => ({
  notificationsEnabled: true,
  soundVolume: 0.5,
  iconSet: 'default',
});

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(getDefaultSettings());
  const [isLoading, setIsLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      // For guests, load from localStorage
      const stored = localStorage.getItem('tranquili_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
        setMasterVolume(parsed.soundVolume);
      }
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const s: AppSettings = {
          notificationsEnabled: data.notifications_enabled,
          soundVolume: Number(data.sound_volume),
          iconSet: data.icon_set,
        };
        setSettings(s);
        setMasterVolume(s.soundVolume);
      } else {
        // Create default settings row
        await supabase.from('user_settings').insert({
          user_id: user.id,
          notifications_enabled: true,
          sound_volume: 0.5,
          icon_set: 'default',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (newSettings: AppSettings) => {
    setSettings(newSettings);
    setMasterVolume(newSettings.soundVolume);

    if (!user) {
      localStorage.setItem('tranquili_settings', JSON.stringify(newSettings));
      return;
    }

    try {
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          notifications_enabled: newSettings.notificationsEnabled,
          sound_volume: newSettings.soundVolume,
          icon_set: newSettings.iconSet,
        }, { onConflict: 'user_id' });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [user]);

  return { settings, updateSettings, isLoading };
}
