const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Flame, CheckCircle2, Trophy, TrendingUp, X, BarChart3, CalendarDays,
  Activity, Book, Droplets, Dumbbell, PenLine, Moon, Target, Star, Brain, Palette, Utensils, Briefcase, DollarSign, Music, Wind, Plane, Crosshair
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/shared/EmptyState';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isSameDay } from 'date-fns';
import HabitoAnalytics from '@/components/habits/HabitoAnalytics';

const HABIT_COLORS = {
  blue: { bg: 'bg-blue-500', light: 'bg-blue-500/15', text: 'text-blue-500', glow: '0 0 20px rgba(59,130,246,0.5)', hex: '#3b82f6' },
  green: { bg: 'bg-emerald-500', light: 'bg-emerald-500/15', text: 'text-emerald-500', glow: '0 0 20px rgba(16,185,129,0.5)', hex: '#10b981' },
  red: { bg: 'bg-red-500', light: 'bg-red-500/15', text: 'text-red-500', glow: '0 0 20px rgba(239,68,68,0.5)', hex: '#ef4444' },
  orange: { bg: 'bg-orange-500', light: 'bg-orange-500/15', text: 'text-orange-500', glow: '0 0 20px rgba(249,115,22,0.5)', hex: '#f97316' },
  purple: { bg: 'bg-violet-500', light: 'bg-violet-500/15', text: 'text-violet-500', glow: '0 0 20px rgba(139,92,246,0.5)', hex: '#8b5cf6' },
  pink: { bg: 'bg-pink-500', light: 'bg-pink-500/15', text: 'text-pink-500', glow: '0 0 20px rgba(236,72,153,0.5)', hex: '#ec4899' },
};

const HABIT_ICONS = {
  Activity, Book, Droplets, Dumbbell, PenLine, Moon, Target, Star, Brain, Palette, Utensils, Briefcase, DollarSign, Music, Wind, Plane, Crosshair
};

function CircleProgress({ percent, color, size = 56, stroke = 4 }) {
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const dash = (percent / 100) * c;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-border/30" />
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={HABIT_COLORS[color]?.hex || '#8b5cf6'}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - dash }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
      />
    </svg>
  );
}

const HabitCard = React.memo(({ habit, selectedDate, onToggle, onDelete, index }) => {
  const [pressed, setPressed] = useState(false);
  const colorConf = HABIT_COLORS[habit.color] || HABIT_COLORS.purple;
  const doneToday = habit.completions?.some(c => c.date === selectedDate);
  const last7 = eachDayOfInterval({ start: startOfWeek(new Date(selectedDate), { weekStartsOn: 1 }), end: endOfWeek(new Date(selectedDate), { weekStartsOn: 1 }) });
  const completedDays = last7.filter(d => habit.completions?.some(c => c.date === format(d, 'yyyy-MM-dd'))).length;
  const weekPercent = (completedDays / 7) * 100;
  
  const IconComponent = HABIT_ICONS[habit.icon] || Target;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 28 }}
      className={cn(
        'relative overflow-hidden rounded-[28px] border transition-all duration-300 p-4',
        doneToday
          ? `${colorConf.light} border-transparent`
          : 'bg-card border-border/50 hover:shadow-md'
      )}
    >
      {/* Background glow when done */}
      {doneToday && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-3xl"
          style={{ background: `radial-gradient(circle at 30% 50%, ${colorConf.hex}18 0%, transparent 70%)` }}
        />
      )}

      <div className="relative flex items-center gap-3">
        {/* Check button with circle progress */}
        <div className="relative flex-shrink-0">
          <CircleProgress percent={weekPercent} color={habit.color} size={52} stroke={3} />
          <button
            onClick={() => onToggle(habit)}
            className="absolute inset-0 flex items-center justify-center transition-transform hover:scale-90 active:scale-75 touch-target-safe"
          >
            <AnimatePresence mode="wait">
              {doneToday ? (
                <motion.div
                  key="done"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <CheckCircle2 className={cn('w-6 h-6', colorConf.text)} />
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                  <div className={cn('w-6 h-6 rounded-full border-2', colorConf.text.replace('text-', 'border-'), 'opacity-40')} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <IconComponent className={cn('w-4 h-4', colorConf.text)} />
            <p className={cn('text-sm font-semibold', doneToday && 'line-through opacity-60')}>{habit.name}</p>
            {habit.current_streak >= 3 && (
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-xs flex items-center gap-0.5 text-orange-500 font-bold"
              >
                <Flame className="w-3 h-3" />{habit.current_streak}
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground">{completedDays}/7 this week</span>
            {habit.best_streak > 0 && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Trophy className="w-2.5 h-2.5" /> Best: {habit.best_streak}
              </span>
            )}
          </div>
          {/* Week mini dots */}
          <div className="flex gap-1 mt-2">
            {last7.map((day, i) => {
              const d = format(day, 'yyyy-MM-dd');
              const done = habit.completions?.some(c => c.date === d);
              const isSelectedDay = d === selectedDate;
              return (
                <motion.div
                  key={d}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    'flex-1 h-1.5 rounded-full transition-all',
                    done ? colorConf.bg : 'bg-muted/60',
                    isSelectedDay && !done && 'ring-1 ring-offset-1 ring-border'
                  )}
                />
              );
            })}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(habit.id)}
          className="opacity-0 md:opacity-100 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-destructive/10 transition-all absolute top-0 right-0"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </motion.div>
  );
});

export default function Habito() {
  const [showAdd, setShowAdd] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', color: 'purple', frequency: 'daily', icon: 'Target' });
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);
  const queryClient = useQueryClient();
  const selectedDate = format(selectedDateObj, 'yyyy-MM-dd');
  const todayDateStr = format(new Date(), 'yyyy-MM-dd');

  const { data: habits = [] } = useQuery({
    queryKey: ['habits'],
    queryFn: () => db.entities.Habit.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Habit.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['habits'] }); setShowAdd(false); setNewHabit({ name: '', color: 'purple', frequency: 'daily', icon: 'Target' }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Habit.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Habit.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  const toggleToday = (habit) => {
    const completions = habit.completions || [];
    const doneToday = completions.some(c => c.date === selectedDate);
    let updated;
    if (doneToday) {
      updated = completions.filter(c => c.date !== selectedDate);
    } else {
      updated = [...completions, { date: selectedDate, count: 1 }];
    }
    const streak = doneToday ? Math.max(0, (habit.current_streak || 0) - 1) : (habit.current_streak || 0) + 1;
    const best = Math.max(streak, habit.best_streak || 0);
    updateMutation.mutate({ id: habit.id, data: { completions: updated, current_streak: streak, best_streak: best } });
  };

  const activeHabits = habits.filter(h => h.active !== false);
  const completedToday = activeHabits.filter(h => h.completions?.some(c => c.date === selectedDate)).length;
  const totalActive = activeHabits.length;
  const overallProgress = totalActive > 0 ? Math.round((completedToday / totalActive) * 100) : 0;
  const topStreak = habits.reduce((max, h) => Math.max(max, h.current_streak || 0), 0);
  
  // Real calendar week (Monday to Sunday)
  const dateMarkers = eachDayOfInterval({ 
    start: startOfWeek(selectedDateObj, { weekStartsOn: 1 }), 
    end: endOfWeek(selectedDateObj, { weekStartsOn: 1 }) 
  });
  
  const visualizationDays = eachDayOfInterval({ start: subDays(selectedDateObj, 13), end: selectedDateObj });
  const averageCompletion = totalActive
    ? Math.round(visualizationDays.reduce((sum, day) => {
      const date = format(day, 'yyyy-MM-dd');
      const done = activeHabits.filter(habit => habit.completions?.some(c => c.date === date)).length;
      return sum + (done / totalActive) * 100;
    }, 0) / visualizationDays.length)
    : 0;

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Habits</h1>
          <div className="flex items-center gap-2 mt-0.5 relative">
            <input 
              type="date" 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDateObj(new Date(e.target.value));
                }
              }}
            />
            <p className="text-sm text-primary font-medium flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-md hover:bg-primary/20 transition-colors pointer-events-none">
              {isSameDay(selectedDateObj, new Date()) ? 'Today' : format(selectedDateObj, 'MMM d, yyyy')} <CalendarDays className="w-3 h-3" />
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowVisualization(true)} size="sm" variant="outline" className="gap-1.5 rounded-full px-4">
            <BarChart3 className="w-4 h-4" /> Visualize
          </Button>
          <Button onClick={() => setShowAdd(true)} size="sm" className="gap-1.5 rounded-full shadow-lg shadow-primary/20 px-5">
            <Plus className="w-4 h-4" /> Add Habit
          </Button>
        </div>
      </div>

      {/* Real Calendar Week View */}
      <div className="rounded-[24px] border border-border/50 bg-card/60 p-3 relative overflow-hidden">
        {/* Subtle week view background decoration */}
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <CalendarDays className="w-24 h-24" />
        </div>
        <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground relative z-10">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            {format(dateMarkers[0], 'MMM d')} - {format(dateMarkers[6], 'MMM d')}
          </div>
          {/* Jump to Today Button */}
          {!isSameDay(selectedDateObj, new Date()) && (
             <button 
                onClick={() => setSelectedDateObj(new Date())}
                className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-md hover:opacity-80 transition-opacity"
             >
               Go to Today
             </button>
          )}
        </div>
        <div className="grid grid-cols-7 gap-2 relative z-10">
          {dateMarkers.map(day => {
            const date = format(day, 'yyyy-MM-dd');
            const doneCount = activeHabits.filter(habit => habit.completions?.some(c => c.date === date)).length;
            const percent = totalActive ? doneCount / totalActive : 0;
            const isSelected = date === selectedDate;
            const isTodayInGrid = date === todayDateStr;
            return (
              <div 
                key={date} 
                onClick={() => setSelectedDateObj(day)}
                className="flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-all group-hover:scale-110 group-active:scale-95',
                  percent === 1 && 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
                  percent > 0 && percent < 1 && 'border-primary/50 bg-primary/15 text-primary',
                  percent === 0 && 'border-border bg-muted/40 text-muted-foreground',
                  isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-md',
                  isTodayInGrid && !isSelected && 'underline decoration-primary decoration-2 underline-offset-4'
                )}>
                  {format(day, 'd')}
                </div>
                <span className={cn("text-[10px] font-medium", isSelected ? "text-primary font-bold" : "text-muted-foreground")}>
                  {format(day, 'EEE')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Done Today', value: `${completedToday}/${totalActive}`, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Completion', value: `${overallProgress}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Top Streak', value: `${topStreak}🔥`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-card rounded-[24px] border border-border/50 p-3 text-center"
          >
            <div className={cn('w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-1.5', stat.bg)}>
              <stat.icon className={cn('w-4 h-4', stat.color)} />
            </div>
            <p className="text-base font-bold">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Daily Progress Ring */}
      {totalActive > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-primary/5 via-primary/10 to-violet-500/5 rounded-[28px] border border-primary/20 p-5 flex items-center gap-5"
        >
          <div className="relative flex-shrink-0">
            <CircleProgress percent={overallProgress} color="purple" size={76} stroke={5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{overallProgress}%</span>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-base">
              {overallProgress === 100 ? '🏆 All done!' : overallProgress >= 50 ? '💪 Keep going!' : '🌅 Let\'s start!'}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {completedToday} of {totalActive} habits completed today
            </p>
            {overallProgress === 100 && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-emerald-500 font-semibold mt-1"
              >
                ✨ Perfect day! Amazing streak!
              </motion.p>
            )}
          </div>
        </motion.div>
      )}

      {/* Habits List */}
      <div className="space-y-3 group">
        <AnimatePresence>
          {activeHabits.map((habit, i) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              selectedDate={selectedDate}
              onToggle={toggleToday}
              onDelete={deleteMutation.mutate}
              index={i}
            />
          ))}
        </AnimatePresence>
      </div>

      {activeHabits.length === 0 && (
        <EmptyState 
          icon={<Target />} 
          title="Track your first habit" 
          description="Build consistency, one day at a time. Start your journey to a better you."
          action={{ label: "Add Habit", icon: <Plus className="w-4 h-4" />, onClick: () => setShowAdd(true) }}
        />
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {React.createElement(HABIT_ICONS[newHabit.icon] || Target, { className: 'w-5 h-5 text-primary' })}
              New Habit
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Icon picker */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {Object.keys(HABIT_ICONS).map(iconKey => {
                  const Icon = HABIT_ICONS[iconKey];
                  return (
                    <button 
                      key={iconKey} 
                      onClick={() => setNewHabit({ ...newHabit, icon: iconKey })}
                      className={cn('p-2 rounded-xl transition-all', newHabit.icon === iconKey ? 'bg-primary/15 scale-110 ring-1 ring-primary text-primary' : 'hover:bg-muted text-muted-foreground')}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              placeholder="Habit name..."
              value={newHabit.name}
              onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
              className="rounded-full px-5"
              autoFocus
            />

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Color</label>
              <div className="flex gap-2">
                {Object.entries(HABIT_COLORS).map(([key, c]) => (
                  <button key={key} onClick={() => setNewHabit({ ...newHabit, color: key })}
                    className={cn('w-8 h-8 rounded-full border-2 transition-all hover:scale-110', c.bg,
                      newHabit.color === key ? 'border-foreground scale-125 shadow-lg' : 'border-transparent')}
                  />
                ))}
              </div>
            </div>

            <Select value={newHabit.frequency} onValueChange={(v) => setNewHabit({ ...newHabit, frequency: v })}>
              <SelectTrigger className="rounded-full px-5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1 rounded-full">Cancel</Button>
              <Button
                onClick={() => newHabit.name && createMutation.mutate(newHabit)}
                className="flex-1 rounded-full gap-1.5"
                disabled={!newHabit.name.trim()}
              >
                <Plus className="w-4 h-4" /> Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {showVisualization && <HabitoAnalytics habits={activeHabits} onClose={() => setShowVisualization(false)} />}
      </AnimatePresence>
    </div>
  );
}
