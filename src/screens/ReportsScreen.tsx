import React, { useState } from 'react';
import { MoodEntry, UserProfile, Achievement, CheckinEmotion } from '../types';
import { MOOD_EMOJIS } from '../constants';
import { TrophyIcon, TargetIcon, CheckIcon } from '../components/ui/Icons';
import { Lock } from 'lucide-react';
import { MoodMiniChart } from '../components/ui/mood-mini-chart';
import { MoodDetailDialog } from '../components/mood/MoodDetailDialog';
import WeeksOfLife from '../components/reports/WeeksOfLife';
interface ReportsScreenProps {
  moodHistory: MoodEntry[];
  chatCount: number;
  userProfile?: UserProfile;
  achievements?: Achievement[];
}

const EMOTION_LABELS: Record<CheckinEmotion, string> = {
  calmo: 'Calmo',
  ansioso: 'Ansioso',
  triste: 'Triste',
  cansado: 'Cansado',
  sobrecarregado: 'Sobrecarregado',
  grato: 'Grato',
  motivado: 'Motivado',
  confuso: 'Confuso',
  esperancoso: 'Esperançoso',
  vazio: 'Vazio',
};

const EMOTION_EMOJIS: Record<CheckinEmotion, string> = {
  calmo: '😌',
  ansioso: '😰',
  triste: '😢',
  cansado: '😴',
  sobrecarregado: '😵',
  grato: '🙏',
  motivado: '💪',
  confuso: '🤔',
  esperancoso: '🌟',
  vazio: '😶',
};

const MoodSummary: React.FC<{ moodHistory: MoodEntry[] }> = ({ moodHistory }) => {
  if (moodHistory.length === 0) return null;

  // Count emotions from new check-in data
  const emotionCounts: Record<string, number> = {};
  
  moodHistory.forEach(entry => {
    if (entry.checkin_data?.emotions?.length) {
      entry.checkin_data.emotions.forEach(emotion => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
    } else {
      // Fallback for legacy data
      emotionCounts[entry.mood] = (emotionCounts[entry.mood] || 0) + 1;
    }
  });

  const sortedEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
  
  if (sortedEmotions.length === 0) return null;
  
  const topEmotion = sortedEmotions[0];
  const isNewFormat = Object.keys(EMOTION_LABELS).includes(topEmotion[0]);

  return (
    <div className="bg-card p-5 rounded-xl shadow-md mb-6 border border-border">
      <h2 className="text-lg font-bold text-foreground mb-4">Resumo do Humor</h2>
      <div className="flex items-center justify-center gap-4 mb-4">
        <span className="text-5xl">
          {isNewFormat 
            ? EMOTION_EMOJIS[topEmotion[0] as CheckinEmotion] 
            : MOOD_EMOJIS[topEmotion[0] as keyof typeof MOOD_EMOJIS]}
        </span>
        <div>
          <p className="text-muted-foreground">Sentimento mais frequente</p>
          <p className="font-bold text-xl capitalize text-foreground">
            {isNewFormat ? EMOTION_LABELS[topEmotion[0] as CheckinEmotion] : topEmotion[0]}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap justify-around gap-2">
        {sortedEmotions.slice(0, 5).map(([emotion, count]) => {
          const isNew = Object.keys(EMOTION_LABELS).includes(emotion);
          return (
            <div key={emotion} className="text-center">
              <span className="text-2xl">
                {isNew 
                  ? EMOTION_EMOJIS[emotion as CheckinEmotion]
                  : MOOD_EMOJIS[emotion as keyof typeof MOOD_EMOJIS]}
              </span>
              <p className="text-sm font-bold text-muted-foreground">{count}x</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MoodChartSection: React.FC<{ moodHistory: MoodEntry[]; onMoodClick: (mood: MoodEntry) => void }> = ({ moodHistory, onMoodClick }) => {
  if (moodHistory.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-foreground mb-4">Evolução do Humor</h2>
      <MoodMiniChart moodHistory={moodHistory} onMoodClick={onMoodClick} />
      <p className="text-xs text-muted-foreground text-center mt-2">
        Toque em uma barra para ver detalhes
      </p>
    </div>
  );
};

const PurposeCard: React.FC<{ userProfile?: UserProfile }> = ({ userProfile }) => {
  if (!userProfile?.reason) return null;

  return (
    <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-5 rounded-xl shadow-md mb-6 border border-primary/20">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/20 rounded-full">
          <TargetIcon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground mb-2">Seu Propósito</h2>
          <p className="text-muted-foreground italic">"{userProfile.reason}"</p>
          <p className="text-xs text-muted-foreground mt-2">
            Caminho: <span className="font-semibold text-primary">{userProfile.path}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const AchievementsSection: React.FC<{ achievements: Achievement[] }> = ({ achievements }) => {
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="bg-card p-5 rounded-xl shadow-md mb-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-yellow-500" />
          Conquistas
        </h2>
        <span className="text-sm font-semibold px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full dark:bg-yellow-900/30 dark:text-yellow-400">
          {unlockedCount}/{achievements.length}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-3 rounded-lg border-2 transition-all relative ${
              achievement.unlocked
                ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300 dark:from-yellow-900/20 dark:to-amber-900/20 dark:border-yellow-600'
                : 'bg-secondary border-border'
            }`}
          >
            {achievement.unlocked ? (
              <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <CheckIcon className="w-3 h-3 text-white" />
              </div>
            ) : (
              <div className="absolute top-2 right-2 w-5 h-5 bg-muted rounded-full flex items-center justify-center">
                <Lock className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{achievement.unlocked ? '🏆' : '🔒'}</span>
              <h3 className={`font-bold text-sm ${achievement.unlocked ? 'text-yellow-800 dark:text-yellow-400' : 'text-muted-foreground'}`}>
                {achievement.title}
              </h3>
            </div>
            <p className={`text-xs ${achievement.unlocked ? 'text-yellow-700 dark:text-yellow-500' : 'text-muted-foreground'}`}>
              {achievement.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReportsScreen: React.FC<ReportsScreenProps> = ({ moodHistory, chatCount, userProfile, achievements = [] }) => {
  const [selectedMood, setSelectedMood] = useState<MoodEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleMoodClick = (mood: MoodEntry) => {
    setSelectedMood(mood);
    setDialogOpen(true);
  };

  const getDisplayEmoji = (entry: MoodEntry): string => {
    if (entry.checkin_data?.emotions?.length) {
      return EMOTION_EMOJIS[entry.checkin_data.emotions[0]];
    }
    return MOOD_EMOJIS[entry.mood];
  };

  const getDisplayLabel = (entry: MoodEntry): string => {
    if (entry.checkin_data?.emotions?.length) {
      return entry.checkin_data.emotions
        .map(e => EMOTION_LABELS[e])
        .join(', ');
    }
    return entry.mood;
  };

  if (moodHistory.length === 0) {
    return (
      <div className="p-4 pb-28 bg-background h-full overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Sua Evolução</h1>
        
        <PurposeCard userProfile={userProfile} />
        
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">📈</span>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            Registre seu primeiro humor para começar a ver gráficos e estatísticas aqui.
          </p>
        </div>
        
        {achievements.length > 0 && (
          <AchievementsSection achievements={achievements} />
        )}

        <MoodDetailDialog 
          mood={selectedMood} 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
        />
      </div>
    );
  }

  return (
    <div className="p-4 pb-28 bg-background h-full overflow-y-auto">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Sua Evolução</h1>
      
      <PurposeCard userProfile={userProfile} />
      <WeeksOfLife />
      <MoodChartSection moodHistory={moodHistory} onMoodClick={handleMoodClick} />
      <MoodSummary moodHistory={moodHistory} />
      
      {achievements.length > 0 && (
        <AchievementsSection achievements={achievements} />
      )}
      
      <h2 className="text-xl font-bold mb-4 text-foreground">Histórico Recente</h2>
      <div className="space-y-3">
        {[...moodHistory].reverse().slice(0, 10).map((entry, idx) => (
          <div 
            key={entry.id || idx} 
            className="flex items-center p-4 rounded-xl shadow-sm bg-card border-l-4 border-primary cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleMoodClick(entry)}
          >
            <span className="text-4xl mr-4">{getDisplayEmoji(entry)}</span>
            <div className="flex-1">
              <p className="font-bold text-foreground capitalize">{getDisplayLabel(entry)}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
              </p>
            </div>
            {entry.checkin_data?.intensity && (
              <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                {entry.checkin_data.intensity === 'leve' && '🙂 Leve'}
                {entry.checkin_data.intensity === 'moderado' && '😐 Moderado'}
                {entry.checkin_data.intensity === 'intenso' && '⚡ Intenso'}
              </span>
            )}
          </div>
        ))}
      </div>

      <MoodDetailDialog 
        mood={selectedMood} 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
      />
    </div>
  );
};

export default ReportsScreen;
