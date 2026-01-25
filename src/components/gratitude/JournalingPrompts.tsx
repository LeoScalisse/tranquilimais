import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface JournalingPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  recentEntries?: string[];
}

const JournalingPrompts: React.FC<JournalingPromptsProps> = ({ onSelectPrompt, recentEntries }) => {
  const [prompts, setPrompts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'manhã';
    if (hour < 18) return 'tarde';
    return 'noite';
  };

  const fetchPrompts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-prompts', {
        body: {
          timeOfDay: getTimeOfDay(),
          recentEntries: recentEntries?.slice(0, 3).map(e => e.substring(0, 50))
        }
      });

      if (error) throw error;
      
      if (data?.prompts && Array.isArray(data.prompts)) {
        setPrompts(data.prompts);
      }
    } catch (error) {
      console.error('Error fetching prompts:', error);
      // Use fallback prompts
      setPrompts([
        "O que te fez sorrir hoje?",
        "Uma pessoa que você é grato por ter",
        "Um momento simples que te trouxe paz",
        "Algo que você conquistou recentemente"
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [recentEntries]);

  useEffect(() => {
    if (isExpanded && prompts.length === 0) {
      fetchPrompts();
    }
  }, [isExpanded, prompts.length, fetchPrompts]);

  const handleRefresh = () => {
    setPrompts([]);
    fetchPrompts();
  };

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
      >
        <span className="text-lg">💡</span>
        <span className="font-medium">
          {isExpanded ? 'Ocultar sugestões' : 'Precisa de inspiração?'}
        </span>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  Gerando sugestões personalizadas...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-2">
                    {prompts.map((prompt, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => onSelectPrompt(prompt)}
                        className="text-left p-3 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-primary/60 group-hover:text-primary transition-colors">
                            {['🌟', '💭', '🌱', '✨'][index % 4]}
                          </span>
                          <span className="text-sm text-foreground">{prompt}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleRefresh}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-2"
                  >
                    <span>🔄</span> Gerar novas sugestões
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JournalingPrompts;
