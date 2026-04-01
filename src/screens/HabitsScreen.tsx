import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, Plus, X, Flame, Trophy, Hash, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound } from '../services/soundService';
import BrandText from '../components/BrandText';
import { useHabits, HabitDefinition } from '@/hooks/useHabits';
import { useAuth } from '@/hooks/useAuth';
import AnimatedLoadingSkeleton from '@/components/ui/animated-loading-skeleton';

const HABIT_COLORS = [
  { name: 'Azul', value: 'blue', bg: 'bg-blue-500', dot: 'bg-blue-400', text: 'text-blue-500' },
  { name: 'Verde', value: 'green', bg: 'bg-green-500', dot: 'bg-green-400', text: 'text-green-500' },
  { name: 'Roxo', value: 'purple', bg: 'bg-purple-500', dot: 'bg-purple-400', text: 'text-purple-500' },
  { name: 'Laranja', value: 'orange', bg: 'bg-orange-500', dot: 'bg-orange-400', text: 'text-orange-500' },
  { name: 'Rosa', value: 'pink', bg: 'bg-pink-500', dot: 'bg-pink-400', text: 'text-pink-500' },
  { name: 'Vermelho', value: 'red', bg: 'bg-red-500', dot: 'bg-red-400', text: 'text-red-500' },
  { name: 'Amarelo', value: 'yellow', bg: 'bg-yellow-500', dot: 'bg-yellow-400', text: 'text-yellow-500' },
  { name: 'Ciano', value: 'teal', bg: 'bg-teal-500', dot: 'bg-teal-400', text: 'text-teal-500' },
];

const getColorClasses = (colorValue: string) =>
  HABIT_COLORS.find(c => c.value === colorValue) || HABIT_COLORS[0];

const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

const HabitsScreen: React.FC = () => {
  const { user } = useAuth();
  const {
    habits, definitions, isLoading,
    createDefinition, archiveDefinition,
    logHabit, unlogHabit,
    getHabitsForDate, isHabitLoggedOnDate, getStreakForHabit,
    streaks,
  } = useHabits();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState(HABIT_COLORS[0].value);
  const [checklistDate, setChecklistDate] = useState<string | null>(null);
  const [detailHabit, setDetailHabit] = useState<HabitDefinition | null>(null);

  const navigateMonth = useCallback((dir: 'prev' | 'next') => {
    playSound('select');
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (dir === 'next' ? 1 : -1));
      return d;
    });
  }, []);

  const calendarDays = (() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const days: Date[] = [];
    const current = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  })();

  const handleCreateHabit = useCallback(async () => {
    if (!newTitle.trim()) return;
    playSound('confirm');
    await createDefinition(newTitle.trim(), newColor);
    setIsCreateOpen(false);
    setNewTitle('');
  }, [newTitle, newColor, createDefinition]);

  const handleToggleHabit = useCallback(async (defId: string, date: string, isLogged: boolean) => {
    playSound('click');
    if (isLogged) {
      await unlogHabit(defId, date);
    } else {
      await logHabit(defId, date);
    }
  }, [logHabit, unlogHabit]);

  const todayStr = formatDateKey(new Date());
  const monthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const currentMonthHabits = habits.filter(h => {
    const d = new Date(h.date);
    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
  });
  const uniqueDays = new Set(currentMonthHabits.map(h => h.date)).size;

  if (!user) {
    return (
      <div className="p-4 pb-28 bg-background h-full overflow-y-auto flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl block mb-4">🔒</span>
          <p className="text-muted-foreground">Faça login para registrar seus hábitos</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 pb-28 bg-background h-full overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 text-foreground"><BrandText text="Meus Hábitos" /></h1>
        <AnimatedLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 pb-28 bg-background h-full overflow-y-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          <BrandText text="Meus Hábitos" />
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Defina seus hábitos e registre a prática diária
        </p>
      </header>

      {/* Meus Hábitos - Definitions */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Meus Hábitos</h2>
          <Button size="sm" variant="outline" onClick={() => { playSound('click'); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Novo
          </Button>
        </div>

        {definitions.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-6 text-center">
            <p className="text-muted-foreground text-sm">Nenhum hábito criado ainda.</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Criar primeiro hábito
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {definitions.map(def => {
              const color = getColorClasses(def.color);
              const streak = getStreakForHabit(def.id);
              return (
                <button
                  key={def.id}
                  onClick={() => { playSound('click'); setDetailHabit(def); }}
                  className="bg-card rounded-xl border border-border p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn('w-3 h-3 rounded-full', color.bg)} />
                    <span className="text-sm font-medium text-foreground truncate">{def.title}</span>
                  </div>
                  {streak.current > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Flame className="w-3 h-3 text-orange-500" />
                      <span>{streak.current} {streak.current === 1 ? 'dia' : 'dias'}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <Flame className="w-4 h-4 text-orange-500" />
            <p className="text-xs text-muted-foreground font-medium uppercase">Sequência atual</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{streaks.current} <span className="text-sm font-normal text-muted-foreground">{streaks.current === 1 ? 'dia' : 'dias'}</span></p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <p className="text-xs text-muted-foreground font-medium uppercase">Melhor sequência</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{streaks.best} <span className="text-sm font-normal text-muted-foreground">{streaks.best === 1 ? 'dia' : 'dias'}</span></p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <p className="text-xs text-muted-foreground font-medium uppercase">Este mês</p>
          <p className="text-2xl font-bold text-foreground">{currentMonthHabits.length}</p>
          <p className="text-xs text-muted-foreground">registros</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <p className="text-xs text-muted-foreground font-medium uppercase">Dias ativos</p>
          <p className="text-2xl font-bold text-foreground">{uniqueDays}</p>
          <p className="text-xs text-muted-foreground">dias com hábitos</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden mb-6">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground capitalize">{monthLabel}</h2>
            <button onClick={() => { playSound('select'); setCurrentDate(new Date()); }} className="text-xs text-primary hover:underline">Hoje</button>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-7 border-b border-border">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dateStr = formatDateKey(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = dateStr === todayStr;
            const dayHabits = getHabitsForDate(dateStr);

            return (
              <button
                key={index}
                onClick={() => {
                  if (!user || definitions.length === 0) return;
                  playSound('click');
                  setChecklistDate(dateStr);
                }}
                className={cn(
                  'relative aspect-square flex flex-col items-center justify-start p-1 border-r border-b border-border/50 transition-colors',
                  isCurrentMonth ? 'bg-card hover:bg-muted/50' : 'bg-muted/20 text-muted-foreground/50',
                  isToday && 'ring-2 ring-inset ring-primary/30'
                )}
              >
                <span className={cn(
                  'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                  isToday && 'bg-primary text-primary-foreground'
                )}>
                  {day.getDate()}
                </span>
                {dayHabits.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                    {dayHabits.slice(0, 4).map(h => {
                      const color = getColorClasses(h.color);
                      return <div key={h.id} className={cn('w-2 h-2 rounded-full', color.dot)} />;
                    })}
                    {dayHabits.length > 4 && (
                      <span className="text-[8px] text-muted-foreground">+{dayHabits.length - 4}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Checklist Dialog - register habits for a day */}
      <Dialog open={!!checklistDate} onOpenChange={(open) => { if (!open) setChecklistDate(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {checklistDate && new Date(checklistDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Marque os hábitos que você praticou neste dia:</p>
            {definitions.map(def => {
              const color = getColorClasses(def.color);
              const logged = checklistDate ? isHabitLoggedOnDate(def.id, checklistDate) : false;
              return (
                <label
                  key={def.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                    logged ? 'bg-primary/10' : 'bg-muted/50 hover:bg-muted'
                  )}
                >
                  <Checkbox
                    checked={logged}
                    onCheckedChange={() => {
                      if (checklistDate) handleToggleHabit(def.id, checklistDate, logged);
                    }}
                  />
                  <div className={cn('w-3 h-3 rounded-full', color.bg)} />
                  <span className="text-sm font-medium text-foreground">{def.title}</span>
                </label>
              );
            })}
            {definitions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Crie um hábito primeiro para poder registrar.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChecklistDate(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Habit Definition Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Criar Novo Hábito</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nome do hábito</label>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Ex: Meditação, Exercício, Leitura..."
                onKeyDown={e => e.key === 'Enter' && handleCreateHabit()}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Cor</label>
              <div className="flex flex-wrap gap-2">
                {HABIT_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => { playSound('click'); setNewColor(color.value); }}
                    className={cn(
                      'w-9 h-9 rounded-full transition-all',
                      color.bg,
                      newColor === color.value
                        ? 'ring-2 ring-offset-2 ring-foreground scale-110'
                        : 'opacity-60 hover:opacity-100'
                    )}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateHabit} disabled={!newTitle.trim()}>
              <Plus className="w-4 h-4 mr-1" /> Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Habit Detail Dialog */}
      <Dialog open={!!detailHabit} onOpenChange={(open) => { if (!open) setDetailHabit(null); }}>
        <DialogContent className="max-w-sm">
          {detailHabit && (() => {
            const color = getColorClasses(detailHabit.color);
            const streak = getStreakForHabit(detailHabit.id);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className={cn('w-4 h-4 rounded-full', color.bg)} />
                    {detailHabit.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-3 py-4">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{streak.current}</p>
                    <p className="text-xs text-muted-foreground">Atual</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{streak.best}</p>
                    <p className="text-xs text-muted-foreground">Melhor</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Hash className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{streak.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
                <DialogFooter className="flex-row justify-between sm:justify-between">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      playSound('select');
                      await archiveDefinition(detailHabit.id);
                      setDetailHabit(null);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Excluir
                  </Button>
                  <Button variant="outline" onClick={() => setDetailHabit(null)}>Fechar</Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HabitsScreen;
