import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, RefreshCw, Search, Bookmark } from 'lucide-react';
import AnimatedLoadingSkeleton from '../components/ui/animated-loading-skeleton';
import { newsApi, NewsArticle } from '@/lib/api/news';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSavedNews } from '@/hooks/useSavedNews';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Main sections
type MainTab = 'estudos' | 'boas-noticias' | 'saved';

// Sub-filters for Estudos
const estudosFilters = ['Todos', 'Sono', 'Nutrição', 'Exercícios', 'Meditação', 'Saúde Mental'];

const categoryEmojis: Record<string, string> = {
  'Todos': '📚',
  'Sono': '😴',
  'Nutrição': '🥗',
  'Exercícios': '🏃',
  'Meditação': '🧘',
  'Saúde Mental': '🧠',
  'Boas Notícias': '🌟',
  'Estudos': '🔬',
};

const CACHE_KEY = 'tranquili_news_cache';
const CACHE_DURATION = 15 * 60 * 1000;

interface CacheEntry {
  data: NewsArticle[];
  timestamp: number;
  category: string;
}

const getCache = (category: string): NewsArticle[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const entries: CacheEntry[] = JSON.parse(cached);
    const entry = entries.find(e => e.category === category);
    if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
      return entry.data;
    }
    return null;
  } catch {
    return null;
  }
};

const setCache = (category: string, data: NewsArticle[]) => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    let entries: CacheEntry[] = cached ? JSON.parse(cached) : [];
    entries = entries.filter(e => e.category !== category);
    entries.push({ category, data, timestamp: Date.now() });
    if (entries.length > 10) entries = entries.slice(-10);
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch {}
};

const NewsScreen: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [mainTab, setMainTab] = useState<MainTab>('estudos');
  const [estudosFilter, setEstudosFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { savedNews, isNewsSaved, toggleSaveNews, fetchSavedNews } = useSavedNews();

  // Derive the actual category to fetch based on main tab + filter
  const getSearchCategory = useCallback(() => {
    if (mainTab === 'boas-noticias') return 'Boas Notícias';
    if (mainTab === 'estudos') {
      return estudosFilter === 'Todos' ? 'Estudos' : `Estudos-${estudosFilter}`;
    }
    return 'Todos';
  }, [mainTab, estudosFilter]);

  const fetchNews = useCallback(async (category: string, forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        const cached = getCache(category);
        if (cached && cached.length > 0) {
          setArticles(cached);
          setIsLoading(false);
          return;
        }
      }

      const response = await newsApi.searchNews(category, 12);

      if (response.success && response.data) {
        setArticles(response.data);
        setCache(category, response.data);
      } else {
        const cached = getCache(category);
        if (cached) {
          setArticles(cached);
          toast({ title: 'Usando cache', description: 'Mostrando notícias salvas anteriormente' });
        } else {
          toast({ title: 'Erro ao buscar notícias', description: response.error || 'Tente novamente mais tarde', variant: 'destructive' });
        }
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      const cached = getCache(category);
      if (cached) {
        setArticles(cached);
      } else {
        toast({ title: 'Erro de conexão', description: 'Não foi possível conectar ao servidor', variant: 'destructive' });
      }
    }
  }, [toast]);

  useEffect(() => {
    if (mainTab === 'saved') return;
    const category = getSearchCategory();
    const loadNews = async () => {
      const cached = getCache(category);
      if (cached && cached.length > 0) {
        setArticles(cached);
        setIsLoading(false);
        fetchNews(category, false);
      } else {
        setIsLoading(true);
        await fetchNews(category);
        setIsLoading(false);
      }
    };
    loadNews();
  }, [mainTab, estudosFilter, fetchNews, getSearchCategory]);

  useEffect(() => {
    if (user && mainTab === 'saved') {
      fetchSavedNews();
    }
  }, [user, mainTab, fetchSavedNews]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNews(getSearchCategory(), true);
    setIsRefreshing(false);
    toast({ title: 'Notícias atualizadas', description: 'As últimas notícias foram carregadas' });
  };

  const handleOpenArticle = (url: string) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleToggleSave = async (article: NewsArticle, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: 'Faça login', description: 'Entre para salvar notícias favoritas', variant: 'destructive' });
      return;
    }
    const saved = await toggleSaveNews(article, article.category);
    toast({
      title: saved ? 'Notícia salva!' : 'Notícia removida',
      description: saved ? 'Adicionada aos seus favoritos' : 'Removida dos favoritos',
    });
  };

  const filteredArticles = searchQuery
    ? articles.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : articles;

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: (i: number) => ({ y: 0, opacity: 1, transition: { delay: i * 0.1, duration: 0.4 } })
  };

  const renderArticleCard = (article: NewsArticle, index: number) => (
    <motion.div
      key={article.id || article.url}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      layout
      onClick={() => handleOpenArticle(article.url)}
      className="bg-card rounded-xl shadow-sm overflow-hidden border border-border hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group"
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
            {categoryEmojis[article.category] || '📰'} {article.category}
          </span>
          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={(e) => handleToggleSave(article, e)}
                className={`p-1.5 rounded-full transition-colors ${
                  isNewsSaved(article.url)
                    ? 'bg-primary/20 text-primary'
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <Bookmark className="h-4 w-4" fill={isNewsSaved(article.url) ? 'currentColor' : 'none'} />
              </button>
            )}
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
        <h3 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {article.description}
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground truncate max-w-[60%]">
            📍 {article.source}
          </span>
          <span className="text-xs text-primary font-medium flex items-center gap-1">
            Ler artigo <ExternalLink className="h-3 w-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );

  const renderArticleGrid = (articleList: NewsArticle[]) => (
    articleList.length === 0 ? (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {searchQuery
            ? 'Nenhum artigo encontrado para sua pesquisa.'
            : 'Nenhuma notícia encontrada. Tente atualizar.'}
        </p>
        <Button variant="outline" onClick={handleRefresh} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {articleList.map((article, index) => renderArticleCard(article, index))}
      </div>
    )
  );

  if (isLoading && mainTab !== 'saved') {
    return (
      <div className="p-4 pb-28 bg-background h-full overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Boas Novas</h1>
        <p className="text-muted-foreground mb-4">Buscando notícias que inspiram esperança...</p>
        <AnimatedLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 pb-28 bg-background h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-foreground">Boas Novas</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-muted-foreground hover:text-primary"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <p className="text-muted-foreground mb-4">Conhecimento e boas novas para a sua vida 🌟</p>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={(v) => { setMainTab(v as MainTab); setSearchQuery(''); }} className="mb-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="estudos">🔬 Estudos</TabsTrigger>
          <TabsTrigger value="boas-noticias">🌟 Boas Notícias</TabsTrigger>
          <TabsTrigger value="saved">⭐ Salvos {savedNews.length > 0 && `(${savedNews.length})`}</TabsTrigger>
        </TabsList>

        {/* === ESTUDOS === */}
        <TabsContent value="estudos" className="mt-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Pesquisar estudos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>

          {/* Sub-filters */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
            {estudosFilters.map((filter) => (
              <motion.button
                key={filter}
                onClick={() => setEstudosFilter(filter)}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  estudosFilter === filter
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-card text-muted-foreground border border-border hover:border-primary hover:text-primary'
                }`}
              >
                <span className="mr-1">{categoryEmojis[filter] || '📚'}</span>
                {filter}
              </motion.button>
            ))}
          </div>

          {renderArticleGrid(filteredArticles)}
        </TabsContent>

        {/* === BOAS NOTÍCIAS === */}
        <TabsContent value="boas-noticias" className="mt-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Pesquisar boas notícias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
            <p className="text-sm text-muted-foreground">
              🌍 Acontecimentos genuinamente bons que estão transformando o mundo, mas que quase ninguém fica sabendo.
            </p>
          </div>

          {renderArticleGrid(filteredArticles)}
        </TabsContent>

        {/* === SALVOS === */}
        <TabsContent value="saved" className="mt-4">
          {!user ? (
            <div className="text-center py-12">
              <span className="text-6xl block mb-4">🔒</span>
              <p className="text-muted-foreground">Faça login para ver suas notícias salvas</p>
            </div>
          ) : savedNews.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl block mb-4">📑</span>
              <p className="text-muted-foreground">Nenhuma notícia salva ainda</p>
              <p className="text-sm text-muted-foreground mt-2">
                Clique no ícone ⭐ para salvar artigos favoritos
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence>
                {savedNews.map((news, index) => {
                  const article: NewsArticle = {
                    id: news.id,
                    title: news.title,
                    description: news.description || '',
                    url: news.url,
                    category: news.category || 'Geral',
                    source: news.source || 'Fonte desconhecida',
                  };
                  return renderArticleCard(article, index);
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewsScreen;
