import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { ArrowLeftIcon, SparklesIcon } from '../ui/Icons';
import { supabase } from '@/integrations/supabase/client';
import { playSound } from '@/services/soundService';
import { toast } from '@/hooks/use-toast';

interface AnalysisResult {
  score: number;
  category: string;
  judgment: string;
  advice: string;
}

const EXAMPLE_GRIEVANCES = [
  { label: '😤 Barulho alto', text: 'Meu vizinho faz barulho demais à noite' },
  { label: '🚪 Porta aberta', text: 'Alguém não disse obrigado quando segurei a porta' },
  { label: '🐟 Peixe no micro', text: 'Meu colega esquenta peixe no micro-ondas do trabalho' },
  { label: '🧻 Papel errado', text: 'Colocaram o papel higiênico ao contrário' },
];

const PettinessMeterGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [grievance, setGrievance] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [displayScore, setDisplayScore] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const animateScore = (targetScore: number) => {
    const duration = 1500;
    const startTime = Date.now();

    const updateScore = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(targetScore * easeOut));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(updateScore);
      }
    };

    animationRef.current = requestAnimationFrame(updateScore);
  };

  const analyzeGrievance = async () => {
    if (!grievance.trim()) {
      setError('Conte o que te incomoda para analisarmos! 💙');
      return;
    }

    setLoading(true);
    setError('');
    playSound('select');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('pettiness-meter', {
        body: { grievance: grievance.trim() },
      });

      if (fnError) {
        console.error('Edge function error:', fnError);
        throw new Error(fnError.message || 'Erro ao analisar');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const analysisResult: AnalysisResult = {
        score: Math.max(0, Math.min(100, data.score || 50)),
        category: data.category || 'Chatice legítima',
        judgment: data.judgment || 'Seu sentimento é totalmente válido!',
        advice: data.advice || 'Respire fundo e cuide de você 💙',
      };

      setResult(analysisResult);
      animateScore(analysisResult.score);
      playSound('confirm');
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Não consegui analisar agora. Tente novamente! 💙');
      toast({
        title: 'Erro na análise',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetGame = () => {
    setGrievance('');
    setResult(null);
    setDisplayScore(0);
    setError('');
    playSound('click');
  };

  const getGaugeColor = (score: number): string => {
    if (score <= 20) return 'hsl(201, 100%, 61%)'; // tranquili-blue
    if (score <= 40) return 'hsl(180, 70%, 50%)';
    if (score <= 60) return 'hsl(47, 100%, 68%)'; // tranquili-yellow
    if (score <= 80) return 'hsl(30, 90%, 60%)';
    return 'hsl(350, 80%, 60%)';
  };

  const getGaugeFillDasharray = (score: number): string => {
    const arcLength = 220;
    const fillLength = (score / 100) * arcLength;
    return `${fillLength} ${arcLength}`;
  };

  return (
    <div className="w-full animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => { playSound('select'); onBack(); }}
        className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors z-10 p-2"
      >
        <ArrowLeftIcon className="w-5 h-5" /> Voltar
      </button>

      <div className="pt-12 flex flex-col items-center max-w-md mx-auto px-4">
        {/* Header */}
        <span className="text-5xl mb-3">💭</span>
        <h1 className="text-2xl font-bold text-center mb-1 text-foreground">
          Medidor de Chatices
        </h1>
        <p className="text-center text-muted-foreground mb-6 text-sm">
          Desabafe sem julgamentos — a Tranquilinha entende você 💙
        </p>

        {/* Gauge */}
        <div className="relative w-56 h-32 mb-4">
          <svg viewBox="0 0 200 120" className="w-full h-full">
            {/* Background arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Fill arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={getGaugeColor(result ? displayScore : 0)}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={getGaugeFillDasharray(result ? displayScore : 0)}
              className="transition-all duration-300"
            />
            {/* Labels */}
            <text x="15" y="115" fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="middle">0</text>
            <text x="100" y="20" fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="middle">50</text>
            <text x="185" y="115" fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="middle">100</text>
          </svg>

          {/* Score display */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <span className="text-3xl font-bold text-foreground">
              {result ? displayScore : 0}%
            </span>
            {result && (
              <span className="text-xs text-muted-foreground mt-0.5 text-center px-2">
                {result.category}
              </span>
            )}
          </div>
        </div>

        {/* Input / Result area */}
        <div className="w-full">
          <label className="text-sm font-medium text-foreground mb-2 block">
            O que te incomoda?
          </label>

          {!result ? (
            <>
              <textarea
                value={grievance}
                onChange={(e) => { setGrievance(e.target.value); setError(''); }}
                placeholder="Ex: Meu colega de quarto come a última fatia da pizza que eu estava guardando..."
                className="w-full p-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none resize-none text-sm"
                rows={3}
                disabled={loading}
              />

              {/* Example chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {EXAMPLE_GRIEVANCES.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => { setGrievance(example.text); playSound('click'); }}
                    className="px-3 py-1.5 text-xs border border-tranquili-blue/30 rounded-full text-foreground bg-background hover:bg-tranquili-blue/10 hover:border-tranquili-blue transition-colors"
                    disabled={loading}
                  >
                    {example.label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mt-3 flex items-center text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={analyzeGrievance}
                disabled={loading}
                className="mt-4 w-full py-3 rounded-xl font-bold text-white bg-tranquili-blue hover:bg-tranquili-blue/90 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    Analisar minha chatice
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="bg-muted/50 rounded-xl p-3 text-sm">
              <p className="italic text-muted-foreground">"{grievance}"</p>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="w-full mt-5 animate-fade-in">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">💬 O que a Tranquilinha diz:</p>
                <div className="bg-tranquili-blue/10 rounded-xl p-4">
                  <p className="text-sm text-foreground">{result.judgment}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">💡 Dica de autocuidado:</p>
                <div className="bg-tranquili-yellow/20 rounded-xl p-4">
                  <p className="text-sm text-foreground">{result.advice}</p>
                </div>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="mt-5 w-full py-3 border-2 border-tranquili-blue rounded-xl font-semibold text-tranquili-blue hover:bg-tranquili-blue/10 transition-colors"
            >
              Desabafar outra chatice
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PettinessMeterGame;
