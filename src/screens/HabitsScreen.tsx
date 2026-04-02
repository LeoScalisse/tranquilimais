import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Plus, X, CheckCircle2, Flame, Trophy, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import BrandText from '../components/BrandText';
import { useHabits } from '@/hooks/useHabits';
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

const HabitsScreen: React.FC = () => {
  const { user } = useAuth();
  const {
    activeDefinitions, habits, isLoading,
    createDefinition, deleteDefinition, toggleHabitForDate,
    getHabitsForDate, isHabitDoneForDate, getStreakForHabit, streaks,
  } = useHabits();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateDefOpen, setIsCreateDefOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState(HABIT_COLORS[0].value);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showManage, setShowManage] = useState(false);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1));
      return d;
    });
  }, []);

  const calendarDays = useMemo(() => {
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
  }, [currentDate]);

  const formatDateKey = (date: Date) => date.toISOString().split('T')[0];
  const todayStr = formatDateKey(new Date());
  const monthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const handleCreateDef = useCallback(async () => {
    if (!newTitle.trim()) return;
    await createDefinition(newTitle.trim(), newColor);
    setIsCreateDefOpen(false);
    setNewTitle('');
    setNewColor(HABIT_COLORS[0].value);
  }, [newTitle, newColor, createDefinition]);

  const handleDayClick = (date: Date) => {
    if (!user || activeDefinitions.length === 0) return;
    setSelectedDate(formatDateKey(date));
  };

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
      <header className="mb-5">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          <BrandText text="Meus Hábitos" />
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Defina seus hábitos e registre seu progresso diário</p>
      </header>

      {/* Global Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <Flame className="w-4 h-4 text-orange-500" />
            <p className="text-xs text-muted-foreground font-medium uppercase">Sequência geral</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{streaks.current} <span className="text-sm font-normal text-muted-foreground">{streaks.current === 1 ? 'dia' : 'dias'}</span></p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <p className="text-xs text-muted-foreground font-medium uppercase">Melhor geral</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{streaks.best} <span className="text-sm font-normal text-muted-foreground">{streaks.best === 1 ? 'dia' : 'dias'}</span></p>
        </div>
      </div>

      {/* Habit Definitions */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Seus Hábitos</h2>
          <div className="flex gap-2">
            {activeDefinitions.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setShowManage(true)} className="text-xs text-muted-foreground">
                Gerenciar
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setIsCreateDefOpen(true)} className="gap-1">
              <Plus className="w-3.5 h-3.5" /> Novo
            </Button>
          </div>
        </div>

        {activeDefinitions.length === 0 ? (
          <button
            onClick={() => setIsCreateDefOpen(true)}
            className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors"
          >
            <Plus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Crie seu primeiro hábito</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Ex: Meditação, Exercício, Leitura...</p>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {activeDefinitions.map(def => {
              const color = getColorClasses(def.color);
              const streak = getStreakForHabit(def.id);
              const doneToday = isHabitDoneForDate(def.id, todayStr);
              return (
                <div
                  key={def.id}
                  className={cn(
                    'bg-card rounded-xl p-3 border border-border shadow-sm relative overflow-hidden',
                    doneToday && 'ring-2 ring-primary/30'
                  )}
                >
                  <div className={cn('absolute top-0 left-0 w-1 h-full', color.bg)} />
                  <div className="pl-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn('w-2.5 h-2.5 rounded-full', color.bg)} />
                      <span className="text-sm font-medium text-foreground truncate">{def.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Flame className="w-3 h-3 text-orange-400" />
                      <span>{streak.current}d</span>
                      <span className="text-muted-foreground/50">·</span>
                      <Trophy className="w-3 h-3 text-yellow-400" />
                      <span>{streak.best}d</span>
                    </div>
                    {doneToday && (
                      <div className="flex items-center gap-1 mt-1">
                        <Check className="w-3 h-3 text-primary" />
                        <span className="text-[10px] text-primary font-medium">Feito hoje</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden mb-5">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground capitalize">{monthLabel}</h2>
            <button onClick={() => setCurrentDate(new Date())} className="text-xs text-primary hover:underline">Hoje</button>
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
                onClick={() => handleDayClick(day)}
                className={cn(
                  'relative aspect-square flex flex-col items-center justify-start p-1 border-r border-b border-border/50 transition-colors',
                  isCurrentMonth ? 'bg-card hover:bg-muted/50' : 'bg-muted/20 text-muted-foreground/50',
                  isToday && 'ring-2 ring-inset ring-primary/30',
                  activeDefinitions.length === 0 && 'cursor-default'
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

      {/* Day Check-in Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm text-muted-foreground mb-3">Marque os hábitos que você praticou neste dia:</p>
            {activeDefinitions.map(def => {
              const color = getColorClasses(def.color);
              const done = selectedDate ? isHabitDoneForDate(def.id, selectedDate) : false;
              return (
                <button
                  key={def.id}
                  onClick={() => selectedDate && toggleHabitForDate(def.id, selectedDate)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                    done
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-muted/30 border-border hover:bg-muted/50'
                  )}
                >
                  <div className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                    done ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                  )}>
                    {done && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                  </div>
                  <div className={cn('w-3 h-3 rounded-full', color.bg)} />
                  <span className={cn('text-sm font-medium', done ? 'text-foreground' : 'text-muted-foreground')}>{def.title}</span>
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDate(null)} className="w-full">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Habit Definition Dialog */}
      <Dialog open={isCreateDefOpen} onOpenChange={setIsCreateDefOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Criar Hábito</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nome do hábito</label>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Ex: Meditação, Exercício, Leitura..."
                onKeyDown={e => e.key === 'Enter' && handleCreateDef()}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Cor</label>
              <div className="flex flex-wrap gap-2">
                {HABIT_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setNewColor(color.value)}
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
            <Button variant="outline" onClick={() => setIsCreateDefOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateDef} disabled={!newTitle.trim()}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Habits Dialog */}
      <Dialog open={showManage} onOpenChange={setShowManage}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Gerenciar Hábitos</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {activeDefinitions.map(def => {
              const color = getColorClasses(def.color);
              const streak = getStreakForHabit(def.id);
              return (
                <div key={def.id} className="flex items-center justify-between bg-muted/30 rounded-xl p-3 border border-border">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-4 h-4 rounded-full', color.bg)} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{def.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Flame className="w-3 h-3" /> {streak.current}d · <Trophy className="w-3 h-3" /> {streak.best}d
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteDefinition(def.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManage(false)} className="w-full">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HabitsScreen;
