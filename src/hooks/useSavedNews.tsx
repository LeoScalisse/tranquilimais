import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { NewsArticle } from '@/lib/api/news';

export interface SavedNews {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  url: string;
  image_url: string | null;
  source: string | null;
  category: string | null;
  saved_at: string;
}

export function useSavedNews() {
  const { user } = useAuth();
  const [savedNews, setSavedNews] = useState<SavedNews[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSavedNews = useCallback(async () => {
    if (!user) return [];

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_news')
        .select('*')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;
      setSavedNews(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching saved news:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const isNewsSaved = useCallback((url: string) => {
    return savedNews.some(n => n.url === url);
  }, [savedNews]);

  const saveNews = useCallback(async (article: NewsArticle, category?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('saved_news')
        .insert({
          user_id: user.id,
          title: article.title,
          description: article.description || null,
          url: article.url,
          image_url: null,
          source: article.source || null,
          category: category || article.category || null
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Duplicate - already saved
          return null;
        }
        throw error;
      }
      
      setSavedNews(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error saving news:', error);
      return null;
    }
  }, [user]);

  const unsaveNews = useCallback(async (url: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('saved_news')
        .delete()
        .eq('url', url)
        .eq('user_id', user.id);

      if (error) throw error;
      setSavedNews(prev => prev.filter(n => n.url !== url));
      return true;
    } catch (error) {
      console.error('Error unsaving news:', error);
      return false;
    }
  }, [user]);

  const toggleSaveNews = useCallback(async (article: NewsArticle, category?: string) => {
    if (isNewsSaved(article.url)) {
      return unsaveNews(article.url);
    } else {
      const result = await saveNews(article, category);
      return result !== null;
    }
  }, [isNewsSaved, saveNews, unsaveNews]);

  return {
    savedNews,
    isLoading,
    fetchSavedNews,
    isNewsSaved,
    saveNews,
    unsaveNews,
    toggleSaveNews,
  };
}
