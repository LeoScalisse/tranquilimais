import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AnimatedLoadingSkeleton from '../components/ui/animated-loading-skeleton';

interface NewsArticle {
  id: number;
  title: string;
  description: string;
  emoji: string;
  category: string;
  readTime: string;
  image: string;
}

const newsData: NewsArticle[] = [
  {
    id: 1,
    title: 'Benefícios da meditação diária',
    description: 'Descubra como 10 minutos de meditação podem transformar completamente seu dia e melhorar sua saúde mental.',
    emoji: '🧘',
    category: 'Meditação',
    readTime: '5 min',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=200&fit=crop'
  },
  {
    id: 2,
    title: 'Sono e saúde mental',
    description: 'A importância de uma boa noite de sono para o equilíbrio emocional e cognitivo.',
    emoji: '😴',
    category: 'Sono',
    readTime: '4 min',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=200&fit=crop'
  },
  {
    id: 3,
    title: 'Alimentação consciente',
    description: 'Como a alimentação afeta diretamente seu humor e disposição ao longo do dia.',
    emoji: '🥗',
    category: 'Nutrição',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=200&fit=crop'
  },
  {
    id: 4,
    title: 'Exercícios para ansiedade',
    description: 'Técnicas simples de respiração e movimento que ajudam a aliviar sintomas de ansiedade.',
    emoji: '🏃',
    category: 'Exercícios',
    readTime: '3 min',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=200&fit=crop'
  },
  {
    id: 5,
    title: 'Conexões sociais e bem-estar',
    description: 'Por que manter relacionamentos saudáveis é essencial para sua felicidade.',
    emoji: '🤝',
    category: 'Social',
    readTime: '5 min',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=200&fit=crop'
  },
  {
    id: 6,
    title: 'Mindfulness no trabalho',
    description: 'Práticas de atenção plena para reduzir o estresse profissional e aumentar a produtividade.',
    emoji: '💼',
    category: 'Trabalho',
    readTime: '4 min',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=200&fit=crop'
  }
];

const NewsScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [articles, setArticles] = useState<NewsArticle[]>([]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setArticles(newsData);
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: { delay: i * 0.1, duration: 0.4 }
    })
  };

  if (isLoading) {
    return (
      <div className="p-4 pb-28 bg-gray-50 h-full overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Notícias</h1>
        <p className="text-gray-500 mb-4">Buscando artigos sobre bem-estar...</p>
        <AnimatedLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 pb-28 bg-gray-50 h-full overflow-y-auto">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Notícias</h1>
      <p className="text-gray-500 mb-6">Artigos sobre bem-estar e saúde mental</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {articles.map((article, index) => (
          <motion.div
            key={article.id}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={index}
            className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="relative h-32 overflow-hidden">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                {article.category}
              </div>
              <div className="absolute top-2 right-2 text-2xl">
                {article.emoji}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{article.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-2">{article.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-tranquili-blue font-medium">{article.readTime} de leitura</span>
                <span className="text-xs text-gray-400">Ler mais →</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default NewsScreen;
