import { supabase } from '@/integrations/supabase/client';

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  source: string;
  publishedAt?: string;
}

type NewsResponse = {
  success: boolean;
  error?: string;
  data?: NewsArticle[];
};

export const newsApi = {
  async searchNews(category: string = 'Todos', limit: number = 10): Promise<NewsResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-news', {
        body: { category, limit },
      });

      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error: error.message };
      }

      return data;
    } catch (error) {
      console.error('Error fetching news:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao buscar notícias' 
      };
    }
  },
};
