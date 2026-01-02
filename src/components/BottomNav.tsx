import React from 'react';
import { Screen } from '../types';
import { playSound } from '../services/soundService';
import { Dock, DockIcon, DockItem, DockLabel } from './ui/dock';
import { Home, MessageCircle, Heart, Gamepad2, BarChart3, Newspaper } from 'lucide-react';

interface BottomNavProps {
  activeScreen: Screen;
  navigateTo: (screen: Screen) => void;
  iconSet: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, navigateTo }) => {
  const navItems = [
    { screen: Screen.Home, icon: Home, label: 'Início' },
    { screen: Screen.Chat, icon: MessageCircle, label: 'Tranquilinha' },
    { screen: Screen.Gratitude, icon: Heart, label: 'Gratidão' },
    { screen: Screen.Games, icon: Gamepad2, label: 'Games' },
    { screen: Screen.Reports, icon: BarChart3, label: 'Evolução' },
    { screen: Screen.News, icon: Newspaper, label: 'Notícias' },
  ];

  const handleClick = (screen: Screen) => {
    if (activeScreen !== screen) {
      playSound('select');
      navigateTo(screen);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-2">
      <Dock
        magnification={60}
        distance={100}
        panelHeight={56}
        className="gap-2"
      >
        {navItems.map(({ screen, icon: Icon, label }) => {
          const isActive = activeScreen === screen;
          return (
            <DockItem
              key={screen}
              onClick={() => handleClick(screen)}
              isActive={isActive}
            >
              <DockLabel>{label}</DockLabel>
              <DockIcon className={isActive ? 'text-tranquili-blue' : 'text-gray-500'}>
                <Icon className="w-full h-full" />
              </DockIcon>
            </DockItem>
          );
        })}
      </Dock>
    </nav>
  );
};

export default BottomNav;
