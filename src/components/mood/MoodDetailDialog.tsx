import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MoodEntry, CheckinEmotion, CheckinIntensity, CheckinInfluencer } from '@/types';
import { MOOD_EMOJIS } from '@/constants';
import { cn } from '@/lib/utils';

interface MoodDetailDialogProps {
  mood: MoodEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMOTION_CONFIG: Record<CheckinEmotion, { label: string; emoji: string; color: string }> = {
  calmo: { label: 'Calmo', emoji: '😌', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  ansioso: { label: 'Ansioso', emoji: '😰', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  triste: { label: 'Triste', emoji: '😢', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  cansado: { label: 'Cansado', emoji: '😴', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400' },
  sobrecarregado: { label: 'Sobrecarregado', emoji: '😵', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  grato: { label: 'Grato', emoji: '🙏', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400' },
  motivado: { label: 'Motivado', emoji: '💪', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  confuso: { label: 'Confuso', emoji: '🤔', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  esperancoso: { label: 'Esperançoso', emoji: '🌟', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  vazio: { label: 'Vazio', emoji: '😶', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
};

const INTENSITY_CONFIG: Record<CheckinIntensity, { label: string; emoji: string; color: string }> = {
  leve: { label: 'Leve', emoji: '🙂', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  moderado: { label: 'Moderado', emoji: '😐', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  intenso: { label: 'Intenso', emoji: '⚡', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

const INFLUENCER_CONFIG: Record<CheckinInfluencer, { label: string; emoji: string }> = {
  corpo: { label: 'Corpo (sono, cansaço, energia)', emoji: '🧘' },
  pensamentos: { label: 'Pensamentos', emoji: '💭' },
  pessoas: { label: 'Pessoas', emoji: '👥' },
  trabalho: { label: 'Estudos / Trabalho', emoji: '💼' },
  redes_sociais: { label: 'Redes sociais', emoji: '📱' },
  nada_especifico: { label: 'Nada específico', emoji: '🤷' },
  custom: { label: 'Outro', emoji: '✏️' },
};

export const MoodDetailDialog: React.FC<MoodDetailDialogProps> = ({ mood, open, onOpenChange }) => {
  if (!mood) return null;

  const hasCheckinData = mood.checkin_data && mood.checkin_data.emotions?.length > 0;
  const formattedDate = new Date(mood.date).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Registro de Humor</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
          </div>

          {hasCheckinData ? (
            <>
              {/* Emotions */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Como estava se sentindo</h3>
                <div className="flex flex-wrap gap-2">
                  {mood.checkin_data!.emotions.map((emotion) => {
                    const config = EMOTION_CONFIG[emotion];
                    return (
                      <span
                        key={emotion}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                          config.color
                        )}
                      >
                        <span>{config.emoji}</span>
                        <span>{config.label}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Intensity */}
              {mood.checkin_data!.intensity && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Intensidade</h3>
                  <div>
                    {(() => {
                      const config = INTENSITY_CONFIG[mood.checkin_data!.intensity!];
                      return (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                            config.color
                          )}
                        >
                          <span>{config.emoji}</span>
                          <span>{config.label}</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Influencer */}
              {mood.checkin_data!.influencer && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">O que influenciou</h3>
                  <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                    <span className="text-xl">
                      {INFLUENCER_CONFIG[mood.checkin_data!.influencer].emoji}
                    </span>
                    <span className="text-sm">
                      {mood.checkin_data!.influencer === 'custom' && mood.checkin_data!.customInfluencer
                        ? mood.checkin_data!.customInfluencer
                        : INFLUENCER_CONFIG[mood.checkin_data!.influencer].label}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Legacy mood display */
            <div className="text-center py-6">
              <span className="text-6xl mb-4 block">{MOOD_EMOJIS[mood.mood]}</span>
              <p className="text-lg font-medium capitalize text-foreground">{mood.mood}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
