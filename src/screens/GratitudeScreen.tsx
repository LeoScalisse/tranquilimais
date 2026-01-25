import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, CalendarIcon, EditIcon, CheckIcon, XIcon } from '../components/ui/Icons';
import { playSound } from '../services/soundService';
import { useGratitude, GratitudeEntry } from '@/hooks/useGratitude';
import { useAuth } from '@/hooks/useAuth';
import { useTranscription } from '@/hooks/useTranscription';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import JournalingModeSelector, { JournalingMode } from '@/components/gratitude/JournalingModeSelector';
import DrawingCanvas from '@/components/gratitude/DrawingCanvas';
import ImageUpload from '@/components/gratitude/ImageUpload';
import { toast } from '@/hooks/use-toast';

const moodEmojis = ['😊', '🙏', '💪', '🌟', '❤️', '🌈', '☀️', '🎉'];

const GratitudeScreen: React.FC = () => {
  const { user } = useAuth();
  const { entries, isLoading, fetchEntries, addEntry, deleteEntry, updateEntry } = useGratitude();
  const { isTranscribing, transcribeImage, transcribeCanvasImage } = useTranscription();
  
  const [newContent, setNewContent] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  
  // Journaling mode state
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [currentMode, setCurrentMode] = useState<JournalingMode | null>(null);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, fetchEntries]);

  const handleAddEntry = async () => {
    const contentToSave = transcribedText || newContent;
    if (!contentToSave.trim()) return;
    playSound('confirm');
    
    const result = await addEntry(contentToSave, selectedEmoji || undefined);
    if (result) {
      setNewContent('');
      setSelectedEmoji(null);
      setTranscribedText(null);
      setCurrentMode(null);
      setShowModeSelector(false);
      toast({
        title: 'Entrada salva!',
        description: 'Seu journaling foi adicionado ao diário.',
      });
    }
  };

  const handleDeleteEntry = async (id: string) => {
    playSound('select');
    await deleteEntry(id);
  };

  const handleStartEdit = (entry: GratitudeEntry) => {
    setEditingId(entry.id);
    setEditContent(entry.content);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    playSound('confirm');
    await updateEntry(id, editContent);
    setEditingId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleModeSelect = (mode: JournalingMode) => {
    setCurrentMode(mode);
    setShowModeSelector(false);
    setTranscribedText(null);
    setNewContent('');
  };

  const handleCancelMode = () => {
    setCurrentMode(null);
    setShowModeSelector(true);
    setTranscribedText(null);
    setNewContent('');
  };

  const handleCanvasTranscribe = async (imageData: string) => {
    const result = await transcribeCanvasImage(imageData);
    if (result) {
      setTranscribedText(result);
      toast({
        title: 'Texto transcrito!',
        description: 'Revise o texto abaixo e salve.',
      });
    }
  };

  const handleImageTranscribe = async (base64: string, mimeType: string) => {
    const result = await transcribeImage(base64, mimeType);
    if (result) {
      setTranscribedText(result);
      toast({
        title: 'Texto transcrito!',
        description: 'Revise o texto abaixo e salve.',
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const resetJournaling = () => {
    setShowModeSelector(false);
    setCurrentMode(null);
    setTranscribedText(null);
    setNewContent('');
    setSelectedEmoji(null);
  };

  if (!user) {
    return (
      <div className="p-4 pb-28 bg-background h-full flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl block mb-4">🔒</span>
          <p className="text-muted-foreground">Faça login para acessar seu diário de gratidão</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-28 bg-background h-full overflow-y-auto">
      <h1 className="text-3xl font-bold mb-2 text-foreground">Diário de Gratidão</h1>
      <p className="text-muted-foreground mb-6">Registre as coisas pelas quais você é grato</p>

      {/* New Entry Section */}
      <div className="bg-card p-4 rounded-xl shadow-sm border border-border mb-6">
        <AnimatePresence mode="wait">
          {/* Initial State - Show "New Entry" button */}
          {!showModeSelector && !currentMode && !transcribedText && (
            <motion.div
              key="new-entry-button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <button
                onClick={() => setShowModeSelector(true)}
                className="w-full py-4 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="font-medium">Novo Journaling</span>
              </button>
            </motion.div>
          )}

          {/* Mode Selector */}
          {showModeSelector && !currentMode && (
            <motion.div
              key="mode-selector"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <JournalingModeSelector onSelectMode={handleModeSelect} />
              <button
                onClick={resetJournaling}
                className="w-full mt-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          )}

          {/* Type Mode */}
          {currentMode === 'type' && !transcribedText && (
            <motion.div
              key="type-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">⌨️</span>
                <span className="font-medium text-foreground">Digite seu journaling</span>
              </div>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Pelo que você é grato hoje?"
                className="w-full p-3 border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary outline-none bg-background text-foreground"
                rows={4}
                autoFocus
              />
              
              {/* Emoji Selector */}
              <div className="flex gap-2 flex-wrap">
                {moodEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(selectedEmoji === emoji ? null : emoji)}
                    className={`text-2xl p-2 rounded-lg transition-all ${
                      selectedEmoji === emoji 
                        ? 'bg-primary/20 scale-110' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCancelMode}
                  className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:bg-muted"
                >
                  Voltar
                </button>
                <button
                  onClick={handleAddEntry}
                  disabled={!newContent.trim()}
                  className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    newContent.trim() 
                      ? 'bg-primary text-primary-foreground hover:opacity-90' 
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  <CheckIcon className="w-5 h-5" /> Salvar
                </button>
              </div>
            </motion.div>
          )}

          {/* Draw Mode */}
          {currentMode === 'write-draw' && !transcribedText && (
            <motion.div
              key="draw-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">✍️</span>
                <span className="font-medium text-foreground">Escreva seu journaling</span>
              </div>
              <DrawingCanvas
                onSave={handleCanvasTranscribe}
                onCancel={handleCancelMode}
              />
              {isTranscribing && (
                <div className="mt-3 text-center text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto mb-2" />
                  Transcrevendo sua escrita...
                </div>
              )}
            </motion.div>
          )}

          {/* Upload Mode */}
          {currentMode === 'write-upload' && !transcribedText && (
            <motion.div
              key="upload-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">📷</span>
                <span className="font-medium text-foreground">Envie foto da sua escrita</span>
              </div>
              <ImageUpload
                onImageSelect={handleImageTranscribe}
                onCancel={handleCancelMode}
                isProcessing={isTranscribing}
              />
            </motion.div>
          )}

          {/* Transcribed Text Review */}
          {transcribedText && (
            <motion.div
              key="transcribed-review"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">✅</span>
                <span className="font-medium text-foreground">Revise e salve seu journaling</span>
              </div>
              
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Texto transcrito:</p>
                <p className="text-foreground whitespace-pre-wrap">{transcribedText}</p>
              </div>

              {/* Emoji Selector */}
              <div className="flex gap-2 flex-wrap">
                {moodEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(selectedEmoji === emoji ? null : emoji)}
                    className={`text-2xl p-2 rounded-lg transition-all ${
                      selectedEmoji === emoji 
                        ? 'bg-primary/20 scale-110' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCancelMode}
                  className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:bg-muted"
                >
                  Refazer
                </button>
                <button
                  onClick={handleAddEntry}
                  className="flex-1 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <CheckIcon className="w-5 h-5" /> Salvar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma entrada ainda</p>
            <p className="text-sm mt-1">Comece a registrar sua gratidão!</p>
          </div>
        ) : (
          <AnimatePresence>
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="bg-card p-4 rounded-xl shadow-sm border border-border"
              >
                {editingId === entry.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary outline-none bg-background text-foreground"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(entry.id)}
                        className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg flex items-center justify-center gap-2"
                      >
                        <CheckIcon className="w-4 h-4" /> Salvar
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg flex items-center justify-center gap-2"
                      >
                        <XIcon className="w-4 h-4" /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {entry.mood_emoji && (
                          <span className="text-xl">{entry.mood_emoji}</span>
                        )}
                        <p className="text-foreground">{entry.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(entry.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleStartEdit(entry)} 
                        className="p-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteEntry(entry.id)} 
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default GratitudeScreen;
