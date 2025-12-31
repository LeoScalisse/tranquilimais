import React from 'react';
import { AppSettings } from '../types';
import { VolumeIcon, BellIcon, PaletteIcon } from '../components/ui/Icons';
import { playSound, setMasterVolume } from '../services/soundService';
import { ICON_SET_NAMES } from '../constants';

interface SettingsScreenProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, onSettingsChange }) => {
  const handleVolumeChange = (value: number) => {
    const newSettings = { ...settings, soundVolume: value };
    onSettingsChange(newSettings);
    setMasterVolume(value);
    if (value > 0) playSound('click');
  };

  const handleIconSetChange = (iconSet: string) => {
    playSound('select');
    onSettingsChange({ ...settings, iconSet });
  };

  return (
    <div className="p-4 pb-28 bg-gray-50 h-full overflow-y-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Configurações</h1>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <VolumeIcon className="w-5 h-5 text-tranquili-blue" />
            <h3 className="font-bold text-gray-800">Volume dos Sons</h3>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.soundVolume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-tranquili-blue"
          />
          <p className="text-sm text-gray-500 mt-1">{Math.round(settings.soundVolume * 100)}%</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <BellIcon className="w-5 h-5 text-tranquili-blue" />
            <h3 className="font-bold text-gray-800">Notificações</h3>
          </div>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-600">Ativar notificações</span>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => {
                playSound('toggle');
                onSettingsChange({ ...settings, notificationsEnabled: e.target.checked });
              }}
              className="w-5 h-5 accent-tranquili-blue"
            />
          </label>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <PaletteIcon className="w-5 h-5 text-tranquili-blue" />
            <h3 className="font-bold text-gray-800">Estilo dos Ícones</h3>
          </div>
          <div className="flex gap-2">
            {Object.entries(ICON_SET_NAMES).map(([key, name]) => (
              <button
                key={key}
                onClick={() => handleIconSetChange(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  settings.iconSet === key
                    ? 'bg-tranquili-blue text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
