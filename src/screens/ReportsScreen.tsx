import React from 'react';
import { MoodEntry, UserProfile } from '../types';
import { MOOD_EMOJIS } from '../constants';
import { checkAchievements } from '../services/achievementService';
import { TrophyIcon, TargetIcon } from '../components/ui/Icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ReportsScreenProps {
  moodHistory: MoodEntry[];
  chatCount: number;
  userProfile?: UserProfile;
}

const MoodSummary: React.FC<{ moodHistory: MoodEntry[] }> = ({ moodHistory }) => {
  if (moodHistory.length === 0) return null;

  const moodCounts = moodHistory.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
  const topMood = sortedMoods[0];

  return (
    <div className="bg-card p-5 rounded-xl shadow-md mb-6 border border-border">
      <h2 className="text-lg font-bold text-foreground mb-4">Resumo do Humor</h2>
      <div className="flex items-center justify-center gap-4 mb-4">
        <span className="text-5xl">{MOOD_EMOJIS[topMood[0] as keyof typeof MOOD_EMOJIS]}</span>
        <div>
          <p className="text-muted-foreground">Humor mais frequente</p>
          <p className="font-bold text-xl capitalize text-foreground">{topMood[0]}</p>
        </div>
      </div>
      <div className="flex justify-around">
        {sortedMoods.map(([mood, count]) => (
          <div key={mood} className="text-center">
            <span className="text-2xl">{MOOD_EMOJIS[mood as keyof typeof MOOD_EMOJIS]}</span>
            <p className="text-sm font-bold text-muted-foreground">{count}x</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const MoodChart: React.FC<{ moodHistory: MoodEntry[] }> = ({ moodHistory }) => {
  if (moodHistory.length === 0) return null;

  const moodValues: Record<string, number> = {
    happy: 5,
    calm: 4,
    neutral: 3,
    sad: 2,
    anxious: 1,
  };

  const last14Days = moodHistory.slice(-14);
  const chartData = last14Days.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    value: moodValues[entry.mood] || 3,
    mood: entry.mood,
  }));

  return (
    <div className="bg-card p-5 rounded-xl shadow-md mb-6 border border-border">
      <h2 className="text-lg font-bold text-foreground mb-4">Evolução do Humor</h2>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              domain={[1, 5]} 
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(value) => {
                const labels: Record<number, string> = { 1: '😰', 2: '😢', 3: '😐', 4: '😌', 5: '😊' };
                return labels[value] || '';
              }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: number) => {
                const labels: Record<number, string> = { 1: 'Ansioso', 2: 'Triste', 3: 'Neutro', 4: 'Calmo', 5: 'Feliz' };
                return [labels[value], 'Humor'];
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
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

const AchievementsSection: React.FC<{ moodHistory: MoodEntry[]; chatCount: number }> = ({ moodHistory, chatCount }) => {
  const achievements = checkAchievements(moodHistory, chatCount);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="bg-card p-5 rounded-xl shadow-md mb-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-yellow-500" />
          Conquistas
        </h2>
        <span className="text-sm text-muted-foreground">{unlockedCount}/{achievements.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-3 rounded-lg border-2 transition-all ${
              achievement.unlocked
                ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-600'
                : 'bg-secondary border-border opacity-50'
            }`}
          >
            <h3 className={`font-bold text-sm ${achievement.unlocked ? 'text-yellow-800 dark:text-yellow-400' : 'text-muted-foreground'}`}>
              {achievement.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReportsScreen: React.FC<ReportsScreenProps> = ({ moodHistory, chatCount, userProfile }) => {
  if (moodHistory.length === 0) {
    return (
      <div className="p-4 pb-28 bg-background h-full flex flex-col items-center justify-center text-center">
        <span className="text-6xl mb-4">📈</span>
        <h1 className="text-3xl font-bold mb-4 text-foreground">Sua Evolução</h1>
        <p className="text-muted-foreground max-w-sm mb-6">
          Registre seu primeiro humor para começar a ver gráficos e estatísticas aqui.
        </p>
        {userProfile?.reason && (
          <PurposeCard userProfile={userProfile} />
        )}
      </div>
    );
  }

  return (
    <div className="p-4 pb-28 bg-background h-full overflow-y-auto">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Sua Evolução</h1>
      
      <PurposeCard userProfile={userProfile} />
      <MoodChart moodHistory={moodHistory} />
      <MoodSummary moodHistory={moodHistory} />
      <AchievementsSection moodHistory={moodHistory} chatCount={chatCount} />
      
      <h2 className="text-xl font-bold mb-4 text-foreground">Histórico Recente</h2>
      <div className="space-y-3">
        {[...moodHistory].reverse().slice(0, 10).map((entry, idx) => (
          <div key={idx} className="flex items-center p-4 rounded-xl shadow-sm bg-card border-l-4 border-primary">
            <span className="text-4xl mr-4">{MOOD_EMOJIS[entry.mood]}</span>
            <div>
              <p className="font-bold text-foreground capitalize">{entry.mood}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsScreen;
