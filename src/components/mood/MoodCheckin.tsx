import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { CheckinEmotion, CheckinIntensity, CheckinInfluencer, MoodCheckinData } from '@/types';
import { cn } from '@/lib/utils';
import { playSound } from '@/services/soundService';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import ReactMarkdown from 'react-markdown';

interface MoodCheckinProps {
  onComplete: (data: MoodCheckinData, aiResponse: string) => void;
  onClose: () => void;
}

const EMOTIONS: { id: CheckinEmotion; emoji: string; label: string }[] = [
  { id: 'calmo', emoji: '😌', label: 'Calmo' },
  { id: 'ansioso', emoji: '😰', label: 'Ansioso' },
  { id: 'triste', emoji: '😢', label: 'Triste' },
  { id: 'cansado', emoji: '😴', label: 'Cansado' },
  { id: 'sobrecarregado', emoji: '😵', label: 'Sobrecarregado' },
  { id: 'grato', emoji: '🙏', label: 'Grato' },
  { id: 'motivado', emoji: '💪', label: 'Motivado' },
  { id: 'confuso', emoji: '😕', label: 'Confuso' },
  { id: 'esperancoso', emoji: '🌟', label: 'Esperançoso' },
  { id: 'vazio', emoji: '🫥', label: 'Vazio' },
];

const INTENSITIES: { id: CheckinIntensity; emoji: string; label: string }[] = [
  { id: 'leve', emoji: '🙂', label: 'Leve' },
  { id: 'moderado', emoji: '😐', label: 'Moderado' },
  { id: 'intenso', emoji: '⚡', label: 'Intenso' },
];

const INFLUENCERS: { id: CheckinInfluencer; emoji: string; label: string }[] = [
  { id: 'corpo', emoji: '🏃', label: 'Corpo (sono, cansaço, energia)' },
  { id: 'pensamentos', emoji: '💭', label: 'Pensamentos' },
  { id: 'pessoas', emoji: '👥', label: 'Pessoas' },
  { id: 'trabalho', emoji: '💼', label: 'Estudos / Trabalho' },
  { id: 'redes_sociais', emoji: '📱', label: 'Redes sociais' },
  { id: 'nada_especifico', emoji: '🤷', label: 'Nada específico' },
];

const MoodCheckin: React.FC<MoodCheckinProps> = ({ onComplete, onClose }) => {
  const [step, setStep] = useState(1);
  const [selectedEmotions, setSelectedEmotions] = useState<CheckinEmotion[]>([]);
  const [selectedIntensity, setSelectedIntensity] = useState<CheckinIntensity | null>(null);
  const [selectedInfluencer, setSelectedInfluencer] = useState<CheckinInfluencer | null>(null);
  const [customInfluencer, setCustomInfluencer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const { profile } = useProfile();

  const totalSteps = 4;

  const handleEmotionToggle = (emotion: CheckinEmotion) => {
    playSound('select');
    setSelectedEmotions(prev => {
      if (prev.includes(emotion)) {
        return prev.filter(e => e !== emotion);
      }
      if (prev.length >= 2) {
        return [...prev.slice(1), emotion];
      }
      return [...prev, emotion];
    });
  };

  const handleIntensitySelect = (intensity: CheckinIntensity) => {
    playSound('select');
    setSelectedIntensity(intensity);
  };

  const handleInfluencerSelect = (influencer: CheckinInfluencer) => {
    playSound('select');
    setSelectedInfluencer(influencer);
    if (influencer !== 'custom') {
      setCustomInfluencer('');
    }
  };

  const handleSkip = () => {
    playSound('toggle');
    if (step < 3) {
      setStep(step + 1);
    } else {
      generateAIResponse();
    }
  };

  const handleContinue = () => {
    playSound('confirm');
    if (step < 3) {
      setStep(step + 1);
    } else {
      generateAIResponse();
    }
  };

  const generateAIResponse = async () => {
    setStep(4);
    setIsLoading(true);

    const checkinData: MoodCheckinData = {
      emotions: selectedEmotions,
      intensity: selectedIntensity || undefined,
      influencer: selectedInfluencer || undefined,
      customInfluencer: customInfluencer || undefined,
    };

    try {
      const { data, error } = await supabase.functions.invoke('mood-response', {
        body: {
          checkinData,
          userProfile: profile ? {
            name: profile.name,
            path: profile.path,
          } : null,
        },
      });

      if (error) throw error;

      setAiResponse(data?.response || getDefaultResponse(checkinData));
    } catch (error) {
      console.error('Error generating AI response:', error);
      setAiResponse(getDefaultResponse(checkinData));
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultResponse = (data: MoodCheckinData): string => {
    const emotion = data.emotions[0];
    if (!emotion) {
      return "Obrigada por fazer esse check-in consigo mesma. Cada momento de pausa é um ato de autocuidado. 💙";
    }

    const responses: Record<string, string> = {
      calmo: "Que bom sentir essa calma em você. Aproveite esse momento de paz interior. Você merece essa tranquilidade. 💙",
      ansioso: "Percebo que você está se sentindo ansioso. Que tal uma pausa para respirar fundo? Inspire por 4 segundos, segure por 4 e solte lentamente. Estou aqui com você. 💙",
      triste: "A tristeza faz parte da nossa jornada. Você não precisa estar bem o tempo todo. Que tal se permitir sentir e acolher esse momento? 💙",
      cansado: "Seu corpo está pedindo descanso, e isso é válido. Cuidar de si mesmo inclui respeitar seus limites. 💙",
      sobrecarregado: "Parece que muita coisa está pesando em você agora. Que tal dar um passo de cada vez? Não precisa resolver tudo hoje. 💙",
      grato: "Que lindo sentir gratidão! Esse sentimento ilumina o dia. O que mais te trouxe essa sensação hoje? 💙",
      motivado: "Adoro ver essa energia! A motivação é contagiante. Use essa força para algo que te faça bem. 💙",
      confuso: "Está tudo bem não ter clareza agora. Às vezes precisamos de tempo para as coisas fazerem sentido. Seja gentil consigo. 💙",
      esperancoso: "A esperança é uma semente poderosa. Continue cultivando esse sentimento. Dias melhores estão a caminho. 💙",
      vazio: "Às vezes o vazio nos visita. Você não precisa preencher esse espaço agora. Apenas permita-se estar presente. 💙",
    };

    return responses[emotion] || responses.calmo;
  };

  const handleFinish = () => {
    playSound('confirm');
    const checkinData: MoodCheckinData = {
      emotions: selectedEmotions,
      intensity: selectedIntensity || undefined,
      influencer: selectedInfluencer || undefined,
      customInfluencer: customInfluencer || undefined,
    };
    onComplete(checkinData, aiResponse || '');
  };

  const canContinue = () => {
    if (step === 1) return selectedEmotions.length > 0;
    if (step === 2) return selectedIntensity !== null;
    if (step === 3) return selectedInfluencer !== null;
    return true;
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Como você está se sentindo agora?
              </h2>
              <p className="text-sm text-gray-500">
                Escolha até 2 emoções
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {EMOTIONS.map((emotion) => (
                <button
                  key={emotion.id}
                  onClick={() => handleEmotionToggle(emotion.id)}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200",
                    selectedEmotions.includes(emotion.id)
                      ? "border-primary bg-primary/10 shadow-md scale-[1.02]"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  )}
                >
                  <span className="text-2xl">{emotion.emoji}</span>
                  <span className="text-sm font-medium text-gray-700">{emotion.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Quão forte isso está agora?
              </h2>
              <p className="text-sm text-gray-500">
                Perceba a intensidade do que sente
              </p>
            </div>

            <div className="space-y-3">
              {INTENSITIES.map((intensity) => (
                <button
                  key={intensity.id}
                  onClick={() => handleIntensitySelect(intensity.id)}
                  className={cn(
                    "w-full flex items-center justify-center gap-4 p-5 rounded-xl border-2 transition-all duration-200",
                    selectedIntensity === intensity.id
                      ? "border-primary bg-primary/10 shadow-md scale-[1.02]"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  )}
                >
                  <span className="text-3xl">{intensity.emoji}</span>
                  <span className="text-lg font-medium text-gray-700">{intensity.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                O que mais influenciou seu humor hoje?
              </h2>
              <p className="text-sm text-gray-500">
                Escolha uma opção ou escreva
              </p>
            </div>

            <div className="space-y-3">
              {INFLUENCERS.map((influencer) => (
                <button
                  key={influencer.id}
                  onClick={() => handleInfluencerSelect(influencer.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left",
                    selectedInfluencer === influencer.id
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  )}
                >
                  <span className="text-xl">{influencer.emoji}</span>
                  <span className="text-sm font-medium text-gray-700">{influencer.label}</span>
                </button>
              ))}

              {/* Custom input */}
              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Ou escreva aqui..."
                  value={customInfluencer}
                  onChange={(e) => {
                    setCustomInfluencer(e.target.value);
                    if (e.target.value) {
                      setSelectedInfluencer('custom');
                    }
                  }}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 transition-all duration-200 text-sm",
                    selectedInfluencer === 'custom' && customInfluencer
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                  )}
                />
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center"
          >
            {isLoading ? (
              <div className="py-12">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Preparando uma mensagem para você...</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-primary/10 p-6 rounded-2xl border border-primary/20">
                  <div className="prose prose-sm text-gray-700 text-left">
                    <ReactMarkdown>{aiResponse || ''}</ReactMarkdown>
                  </div>
                </div>

                <button
                  onClick={handleFinish}
                  className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Concluir check-in
                </button>
              </>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {step < 4 && (
              <>
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-colors duration-300",
                      s <= step ? "bg-primary" : "bg-gray-200"
                    )}
                  />
                ))}
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>

        {/* Footer - only show for steps 1-3 */}
        {step < 4 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
            >
              Pular
            </button>
            <button
              onClick={handleContinue}
              disabled={!canContinue()}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200",
                canContinue()
                  ? "bg-primary text-white hover:bg-primary/90 shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              {step === 3 ? 'Finalizar' : 'Continuar'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default MoodCheckin;
