import React, { useState, useEffect } from 'react';
import { Event } from '../types';
import { PlusIcon, TrashIcon, CalendarIcon } from '../components/ui/Icons';
import { playSound } from '../services/soundService';

const GRATITUDE_STORAGE_KEY = 'gratitude_events';

const GratitudeScreen: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [newEntry, setNewEntry] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(GRATITUDE_STORAGE_KEY);
    if (stored) setEvents(JSON.parse(stored));
  }, []);

  const saveEvents = (newEvents: Event[]) => {
    setEvents(newEvents);
    localStorage.setItem(GRATITUDE_STORAGE_KEY, JSON.stringify(newEvents));
  };

  const addEntry = () => {
    if (!newEntry.trim()) return;
    playSound('confirm');
    const event: Event = {
      id: crypto.randomUUID(),
      title: newEntry,
      category: 'Gratidão',
      startTime: new Date(),
      color: 'yellow'
    };
    saveEvents([...events, event]);
    setNewEntry('');
  };

  const deleteEntry = (id: string) => {
    playSound('select');
    saveEvents(events.filter(e => e.id !== id));
  };

  return (
    <div className="p-4 pb-28 bg-gray-50 h-full overflow-y-auto">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Diário de Gratidão</h1>
      <p className="text-gray-600 mb-6">Registre as coisas pelas quais você é grato</p>

      <div className="bg-white p-4 rounded-xl shadow-md mb-6">
        <textarea
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          placeholder="Pelo que você é grato hoje?"
          className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-tranquili-blue outline-none"
          rows={3}
        />
        <button
          onClick={addEntry}
          disabled={!newEntry.trim()}
          className={`mt-3 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            newEntry.trim() ? 'bg-tranquili-blue text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <PlusIcon className="w-5 h-5" /> Adicionar
        </button>
      </div>

      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma entrada ainda</p>
          </div>
        ) : (
          [...events].reverse().map((event) => (
            <div key={event.id} className="bg-white p-4 rounded-xl shadow-sm flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-800">{event.title}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(event.startTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => deleteEntry(event.id)} className="p-2 text-gray-400 hover:text-red-500">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GratitudeScreen;
