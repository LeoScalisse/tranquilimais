import React from 'react';
import { Screen, UserProfile } from '../types';
import { XIcon, UserIcon, LogOutIcon } from './ui/Icons';
import { ICON_SETS } from '../constants';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  navigateTo: (screen: Screen) => void;
  onLogout: () => void;
  iconSet: string;
  isGuest?: boolean;
  onShowSignUp?: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  userProfile,
  navigateTo,
  onLogout,
  iconSet,
  isGuest = false,
  onShowSignUp,
}) => {
  const icons = ICON_SETS[iconSet] || ICON_SETS.default;

  const menuItems = [
    { screen: Screen.Home, icon: icons.home, label: 'Início' },
    { screen: Screen.Chat, icon: icons.chat, label: 'Tranquilinha IA' },
    { screen: Screen.Gratitude, icon: icons.gratitude, label: 'Diário de Gratidão' },
    { screen: Screen.Habits, icon: '📅', label: 'Meus Hábitos' },
    { screen: Screen.News, icon: icons.news, label: 'Notícias' },
    { screen: Screen.Games, icon: icons.games, label: 'Academia Mental' },
    { screen: Screen.Reports, icon: icons.reports, label: 'Minha Evolução' },
    { screen: Screen.Settings, icon: icons.settings, label: 'Configurações' },
  ];

  const handleNavigate = (screen: Screen) => {
    navigateTo(screen);
    onClose();
  };

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Side Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-tranquili-blue to-blue-400">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <UserIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {userProfile?.name || 'Visitante'}
                </h2>
                <p className="text-white/80 text-sm">
                  Bem-vindo ao Tranquili<span className="text-tranquili-yellow">+</span>
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map(({ screen, icon, label }) => (
              <button
                key={screen}
                onClick={() => handleNavigate(screen)}
                className="w-full flex items-center gap-4 px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-tranquili-blue transition-colors"
              >
                <span className="text-gray-400">{icon}</span>
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            {isGuest ? (
              <button
                onClick={() => { onClose(); onShowSignUp?.(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-colors font-medium"
              >
                Criar conta
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOutIcon className="w-5 h-5" />
                <span className="font-medium">Sair</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
