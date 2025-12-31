import React from 'react';
import { Screen } from '../types';
import { ICON_SETS } from '../constants';
import { playSound } from '../services/soundService';

interface BottomNavProps {
  activeScreen: Screen;
  navigateTo: (screen: Screen) => void;
  iconSet: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, navigateTo, iconSet }) => {
  const icons = ICON_SETS[iconSet] || ICON_SETS.default;

  const navItems = [
    { screen: Screen.Home, icon: icons.home, label: 'Início' },
    { screen: Screen.Chat, icon: icons.chat, label: 'Chat' },
    { screen: Screen.Gratitude, icon: icons.gratitude, label: 'Gratidão' },
    { screen: Screen.Games, icon: icons.games, label: 'Jogos' },
    { screen: Screen.Reports, icon: icons.reports, label: 'Evolução' },
  ];

  const handleClick = (screen: Screen) => {
    if (activeScreen !== screen) {
      playSound('select');
      navigateTo(screen);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 px-2 py-2 z-50 shadow-lg">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map(({ screen, icon, label }) => {
          const isActive = activeScreen === screen;
          return (
            <button
              key={screen}
              onClick={() => handleClick(screen)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 min-w-[60px] ${
                isActive
                  ? 'text-tranquili-blue bg-tranquili-blue/10 scale-105'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                {icon}
              </span>
              <span className={`text-[10px] mt-1 font-medium transition-opacity ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
