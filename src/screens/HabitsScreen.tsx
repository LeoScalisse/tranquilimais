import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Plus, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound } from '../services/soundService';
import BrandText from '../components/BrandText';
import { useHabits } from '@/hooks/useHabits';
import { useAuth } from '@/hooks/useAuth';
import AnimatedLoadingSkeleton from '@/components/ui/animated-loading-skeleton';

const HABIT_COLORS = [
  { name: 'Azul', value: 'blue', bg: 'bg-blue-500', dot: 'bg-blue-400' },
  { name: 'Verde', value: 'green', bg: 'bg-green-500', dot: 'bg-green-400' },
  { name: 'Roxo', value: 'purple', bg: 'bg-purple-500', dot: 'bg-purple-400' },
  { name: 'Laranja', value: 'orange', bg: 'bg-orange-500', dot: 'bg-orange-400' },
  { name: 'Rosa', value: 'pink', bg: 'bg-pink-500', dot: 'bg-pink-400' },
  { name: 'Vermelho', value: 'red', bg: 'bg-red-500', dot: 'bg-red-400' },
  { name: 'Amarelo', value: 'yellow', bg: 'bg-yellow-500', dot: 'bg-yellow-400' },
  { name: 'Ciano', value: 'teal', bg: 'bg-teal-500', dot: 'bg-teal-400' },
];

const HabitsScreen: React.FC = () => {
  const { user } = useAuth();
  const { habits, isLoading, addHabit, deleteHabit, getHabitsForDate } = useHabits();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitColor, setNewHabitColor] = useState(HABIT_COLORS[0].value);
  const [viewingDate, setViewingDate] = useState<string | null>(null);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    playSound('select');
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1));
      return d;
    });
  }, []);

  const goToToday = useCallback(() => {
    playSound('select');
    setCurrentDate(new Date());
  }, []);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days: Date[] = [];
    const current = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return { days, lastDay };
  }, [currentDate]);

  const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

  const handleDayClick = (date: Date) => {
    if (!user) return;
    playSound('click');
    const dateStr = formatDateKey(date);
    const dayHabits = getHabitsForDate(dateStr);
    if (dayHabits.length > 0) {
      setViewingDate(dateStr);
    } else {
      setSelectedDate(dateStr);
      setNewHabitTitle('');
      setNewHabitColor(HABIT_COLORS[0].value);
      setIsDialogOpen(true);
    }
  };

  const handleAddFromViewing = () => {
    if (viewingDate) {
      setSelectedDate(viewingDate);
      setNewHabitTitle('');
      setNewHabitColor(HABIT_COLORS[0].value);
      setViewingDate(null);
      setIsDialogOpen(true);
    }
  };

  const handleCreateHabit = useCallback(async () => {
    if (!newHabitTitle.trim() || !selectedDate) return;
    playSound('confirm');
    await addHabit(newHabitTitle.trim(), selectedDate, newHabitColor);
    setIsDialogOpen(false);
    setNewHabitTitle('');
  }, [newHabitTitle, selectedDate, newHabitColor, addHabit]);

  const handleDeleteHabit = useCallback(async (id: string) => {
    playSound('select');
    await deleteHabit(id);
  }, [deleteHabit]);

  const getColorClasses = (colorValue: string) => {
    return HABIT_COLORS.find(c => c.value === colorValue) || HABIT_COLORS[0];
  };

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
          Registre os hábitos que praticou em cada dia
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <p className="text-xs text-muted-foreground font-medium uppercase">Este mês</p>
          <p className="text-2xl font-bold text-foreground">{currentMonthHabits.length}</p>
          <p className="text-xs text-muted-foreground">hábitos registrados</p>
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
            <button onClick={goToToday} className="text-xs text-primary hover:underline">Hoje</button>
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
          {calendarDays.days.map((day, index) => {
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

      {/* Viewing Day Habits */}
      {viewingDate && (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">
              {new Date(viewingDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
            </h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleAddFromViewing}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setViewingDate(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {getHabitsForDate(viewingDate).map(habit => {
              const color = getColorClasses(habit.color);
              return (
                <div key={habit.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-3 h-3 rounded-full', color.bg)} />
                    <span className="text-sm font-medium text-foreground">{habit.title}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Habit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Hábito</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Qual hábito você praticou?
              </label>
              <Input
                value={newHabitTitle}
                onChange={e => setNewHabitTitle(e.target.value)}
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
                    onClick={() => { playSound('click'); setNewHabitColor(color.value); }}
                    className={cn(
                      'w-9 h-9 rounded-full transition-all',
                      color.bg,
                      newHabitColor === color.value
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateHabit} disabled={!newHabitTitle.trim()} className="bg-primary text-primary-foreground">
              <CheckCircle2 className="w-4 h-4 mr-1" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HabitsScreen;
