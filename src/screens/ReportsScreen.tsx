import React from 'react';
import { MoodEntry } from '../types';
import { MOOD_EMOJIS } from '../constants';
import { checkAchievements } from '../services/achievementService';
import { TrophyIcon } from '../components/ui/Icons';

interface ReportsScreenProps {
  moodHistory: MoodEntry[];
  chatCount: number;
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
    <div className="bg-white p-5 rounded-xl shadow-md mb-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Resumo do Humor</h2>
      <div className="flex items-center justify-center gap-4 mb-4">
        <span className="text-5xl">{MOOD_EMOJIS[topMood[0] as keyof typeof MOOD_EMOJIS]}</span>
        <div>
          <p className="text-gray-600">Humor mais frequente</p>
          <p className="font-bold text-xl capitalize text-gray-800">{topMood[0]}</p>
        </div>
      </div>
      <div className="flex justify-around">
        {sortedMoods.map(([mood, count]) => (
          <div key={mood} className="text-center">
            <span className="text-2xl">{MOOD_EMOJIS[mood as keyof typeof MOOD_EMOJIS]}</span>
            <p className="text-sm font-bold text-gray-700">{count}x</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const MoodChart: React.FC<{ moodHistory: MoodEntry[] }> = ({ moodHistory }) => {
  if (moodHistory.length === 0) return null;

  const last7Days = moodHistory.slice(-7);
  const moodValues: Record<string, number> = {
    happy: 5,
    calm: 4,
    neutral: 3,
    sad: 2,
    anxious: 1,
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-md mb-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Últimos 7 dias</h2>
      <div className="flex items-end justify-around h-32">
        {last7Days.map((entry, idx) => {
          const value = moodValues[entry.mood] || 3;
          const height = (value / 5) * 100;
          return (
            <div key={idx} className="flex flex-col items-center">
              <div
                className="w-8 bg-gradient-to-t from-tranquili-blue to-blue-300 rounded-t-lg transition-all duration-500"
                style={{ height: `${height}%` }}
              />
              <span className="text-lg mt-1">{MOOD_EMOJIS[entry.mood]}</span>
              <span className="text-[10px] text-gray-400">
                {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit' })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AchievementsSection: React.FC<{ moodHistory: MoodEntry[]; chatCount: number }> = ({ moodHistory, chatCount }) => {
  const achievements = checkAchievements(moodHistory, chatCount);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="bg-white p-5 rounded-xl shadow-md mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-yellow-500" />
          Conquistas
        </h2>
        <span className="text-sm text-gray-500">{unlockedCount}/{achievements.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-3 rounded-lg border-2 transition-all ${
              achievement.unlocked
                ? 'bg-yellow-50 border-yellow-300'
                : 'bg-gray-50 border-gray-200 opacity-50'
            }`}
          >
            <h3 className={`font-bold text-sm ${achievement.unlocked ? 'text-yellow-800' : 'text-gray-500'}`}>
              {achievement.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{achievement.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReportsScreen: React.FC<ReportsScreenProps> = ({ moodHistory, chatCount }) => {
  if (moodHistory.length === 0) {
    return (
      <div className="p-4 pb-28 bg-gray-50 h-full flex flex-col items-center justify-center text-center">
        <span className="text-6xl mb-4">📈</span>
        <h1 className="text-3xl font-bold mb-4 text-gray-900">Sua Evolução</h1>
        <p className="text-gray-500 max-w-sm">
          Registre seu primeiro humor para começar a ver gráficos e estatísticas aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-28 bg-gray-50 h-full overflow-y-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Sua Evolução</h1>
      <MoodSummary moodHistory={moodHistory} />
      <MoodChart moodHistory={moodHistory} />
      <AchievementsSection moodHistory={moodHistory} chatCount={chatCount} />
      
      <h2 className="text-xl font-bold mb-4 text-gray-700">Histórico Recente</h2>
      <div className="space-y-3">
        {[...moodHistory].reverse().slice(0, 10).map((entry, idx) => (
          <div key={idx} className="flex items-center p-4 rounded-xl shadow-sm bg-white border-l-4 border-gray-200">
            <span className="text-4xl mr-4">{MOOD_EMOJIS[entry.mood]}</span>
            <div>
              <p className="font-bold text-gray-800 capitalize">{entry.mood}</p>
              <p className="text-xs text-gray-500">
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
