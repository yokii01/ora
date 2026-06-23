import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { Activity, X, Target, Flame, CalendarDays, TrendingUp, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HabitoAnalytics({ habits = [], onClose }) {
  
  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const weekDays = eachDayOfInterval({ start: subDays(today, 6), end: today });
    const monthDays = eachDayOfInterval({ start: subDays(today, 29), end: today });

    const totalActive = habits.filter(h => h.active !== false).length;
    if (totalActive === 0) return { today: 0, weekly: 0, monthly: 0, currentStreak: 0, bestStreak: 0, recentActivity: [] };

    let todayDone = 0;
    let weeklyDone = 0;
    let monthlyDone = 0;
    let maxCurrentStreak = 0;
    let maxBestStreak = 0;
    const allCompletions = [];

    habits.forEach(h => {
      if (h.active === false) return;
      
      const comp = h.completions || [];
      if (comp.some(c => c.date === todayStr)) todayDone++;
      
      weekDays.forEach(d => {
        if (comp.some(c => c.date === format(d, 'yyyy-MM-dd'))) weeklyDone++;
      });

      monthDays.forEach(d => {
        if (comp.some(c => c.date === format(d, 'yyyy-MM-dd'))) monthlyDone++;
      });

      maxCurrentStreak = Math.max(maxCurrentStreak, h.current_streak || 0);
      maxBestStreak = Math.max(maxBestStreak, h.best_streak || 0);

      // Extract recent activity
      comp.forEach(c => {
        allCompletions.push({ habit: h, date: new Date(c.date) });
      });
    });

    const weeklyPossible = totalActive * 7;
    const monthlyPossible = totalActive * 30;

    const recentActivity = allCompletions
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);

    return {
      today: totalActive > 0 ? Math.round((todayDone / totalActive) * 100) : 0,
      todayRatio: `${todayDone}/${totalActive}`,
      weekly: weeklyPossible > 0 ? Math.round((weeklyDone / weeklyPossible) * 100) : 0,
      monthly: monthlyPossible > 0 ? Math.round((monthlyDone / monthlyPossible) * 100) : 0,
      currentStreak: maxCurrentStreak,
      bestStreak: maxBestStreak,
      recentActivity
    };
  }, [habits]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 30, transition: { duration: 0.2 } }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto"
    >
      <div className="max-w-md mx-auto p-5 pt-safe min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Activity className="text-primary w-6 h-6" />
              Progress
            </h1>
          </div>
          <button onClick={onClose} className="p-2 bg-card border rounded-full hover:bg-muted transition-colors active:scale-90">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Highlight */}
        <div className="bg-primary/10 border border-primary/20 rounded-[28px] p-6 text-center mb-6 relative overflow-hidden flex-shrink-0">
          <Target className="absolute -right-4 -bottom-4 w-32 h-32 text-primary opacity-10 pointer-events-none" />
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">Today's Completion</h2>
          <div className="flex items-center justify-center gap-3">
             <span className="text-5xl font-black tracking-tighter text-primary">{stats.today}%</span>
          </div>
          <p className="text-sm font-medium text-primary/80 mt-1">{stats.todayRatio} Habits Done</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card border border-border/50 rounded-[24px] p-4 flex flex-col gap-1 relative overflow-hidden">
             <TrendingUp className="w-8 h-8 absolute top-4 right-4 opacity-5 text-emerald-500 pointer-events-none" />
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Weekly</span>
             <span className="text-2xl font-black">{stats.weekly}%</span>
             <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${stats.weekly}%` }} />
             </div>
          </div>
          <div className="bg-card border border-border/50 rounded-[24px] p-4 flex flex-col gap-1 relative overflow-hidden">
             <CalendarDays className="w-8 h-8 absolute top-4 right-4 opacity-5 text-blue-500 pointer-events-none" />
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Monthly</span>
             <span className="text-2xl font-black">{stats.monthly}%</span>
             <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${stats.monthly}%` }} />
             </div>
          </div>
          <div className="bg-card border border-border/50 rounded-[24px] p-4 flex flex-col gap-1 relative overflow-hidden">
             <Flame className="w-8 h-8 absolute top-4 right-4 opacity-5 text-orange-500 pointer-events-none" />
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current Streak</span>
             <span className="text-2xl font-black text-orange-500">{stats.currentStreak} <span className="text-sm text-muted-foreground">days</span></span>
          </div>
          <div className="bg-card border border-border/50 rounded-[24px] p-4 flex flex-col gap-1 relative overflow-hidden">
             <Target className="w-8 h-8 absolute top-4 right-4 opacity-5 text-purple-500 pointer-events-none" />
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Best Streak</span>
             <span className="text-2xl font-black text-purple-500">{stats.bestStreak} <span className="text-sm text-muted-foreground">days</span></span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="flex-1">
          <h3 className="text-sm font-bold tracking-tight mb-4 flex items-center gap-2">
             <CheckCircle2 className="w-4 h-4 text-primary" /> Recent Completions
          </h3>
          <div className="space-y-3">
             {stats.recentActivity.length === 0 ? (
               <p className="text-xs text-muted-foreground text-center py-6">No recent activity</p>
             ) : (
               stats.recentActivity.map((activity, i) => (
                 <div key={i} className="flex items-center gap-3 bg-card border border-border/50 p-3 rounded-[18px]">
                   <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2", `bg-${activity.habit.color}-500/10 border-${activity.habit.color}-500/20 text-${activity.habit.color}-500`)}>
                     <CheckCircle2 className="w-5 h-5" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold truncate">{activity.habit.name}</p>
                     <p className="text-[10px] text-muted-foreground mt-0.5">
                        {isSameDay(activity.date, new Date()) ? 'Today' : format(activity.date, 'MMM d, yyyy')}
                     </p>
                   </div>
                 </div>
               ))
             )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
