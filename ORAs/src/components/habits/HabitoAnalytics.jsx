import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek, startOfYear, endOfYear, getDay, getWeek } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Flame, Target, CalendarDays, BarChart3, Activity, PieChart, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const MEDITATION_ARTWORK = "https://images.unsplash.com/photo-1545389336-eaeece093963?auto=format&fit=crop&q=80&w=800";

export default function HabitoAnalytics({ habits = [], onClose }) {
  const [timeRange, setTimeRange] = useState('monthly'); // weekly, monthly, yearly, all
  
  // Data processing based on timeRange
  const daysMap = { weekly: 7, monthly: 30, yearly: 365, all: 365 };
  const daysToProcess = daysMap[timeRange] || 30;
  
  const dateInterval = eachDayOfInterval({ start: subDays(new Date(), daysToProcess - 1), end: new Date() });

  const chartData = useMemo(() => {
    return dateInterval.map(day => {
      const d = format(day, 'yyyy-MM-dd');
      const total = habits.length;
      const done = habits.filter(h => h.completions?.some(c => c.date === d)).length;
      return {
        date: d,
        label: format(day, timeRange === 'yearly' ? 'MMM yyyy' : 'MMM d'),
        shortLabel: format(day, timeRange === 'yearly' ? 'MMM' : 'd'),
        completed: done,
        total,
        rate: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    });
  }, [dateInterval, habits, timeRange]);

  const tickFormatter = (_, index) => {
    if (timeRange === 'weekly') return chartData[index]?.label || '';
    if (timeRange === 'monthly') return index % 5 === 0 ? chartData[index]?.shortLabel || '' : '';
    if (timeRange === 'yearly') return index % 30 === 0 ? chartData[index]?.shortLabel || '' : '';
    return '';
  };

  const totalCompletions = chartData.reduce((s, d) => s + d.completed, 0);
  const avgRate = chartData.length > 0 ? Math.round(chartData.reduce((s, d) => s + d.rate, 0) / chartData.length) : 0;
  const maxStreak = Math.max(...habits.map(h => h.best_streak || 0), 0);
  
  // Category Stats (by color)
  const categoryStats = useMemo(() => {
    const stats = {};
    habits.forEach(h => {
      const c = h.color || 'purple';
      stats[c] = (stats[c] || 0) + 1;
    });
    return Object.entries(stats).map(([color, count]) => ({ color, count }));
  }, [habits]);

  // Heatmap Data (Yearly)
  const yearDays = eachDayOfInterval({ start: startOfYear(new Date()), end: endOfYear(new Date()) });
  const heatmapData = useMemo(() => {
    return yearDays.map(day => {
      const d = format(day, 'yyyy-MM-dd');
      const done = habits.filter(h => h.completions?.some(c => c.date === d)).length;
      const rate = habits.length > 0 ? (done / habits.length) * 100 : 0;
      return { date: d, rate };
    });
  }, [yearDays, habits]);

  const hasMeditation = habits.some(h => h.name.toLowerCase().includes('meditat') || h.name.toLowerCase().includes('mindful'));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-2xl overflow-y-auto"
    >
      <div className="max-w-5xl mx-auto p-4 lg:p-8 pt-safe">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <Activity className="text-primary w-8 h-8" />
              Habito Analytics
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Deep dive into your progress and consistency.</p>
          </div>
          <button onClick={onClose} className="p-3 bg-card border rounded-full hover:bg-muted transition-colors">
            ✕
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="flex bg-card border rounded-full p-1 w-fit mb-8 shadow-sm">
          {['weekly', 'monthly', 'yearly', 'all'].map(t => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold capitalize transition-all",
                timeRange === t ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card border p-5 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Target className="w-16 h-16" /></div>
                <p className="text-4xl font-black text-primary">{avgRate}%</p>
                <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Average Rate</p>
              </div>
              <div className="bg-card border p-5 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Flame className="w-16 h-16 text-warning" /></div>
                <p className="text-4xl font-black text-warning">{maxStreak}</p>
                <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Best Streak</p>
              </div>
              <div className="bg-card border p-5 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Shield className="w-16 h-16 text-success" /></div>
                <p className="text-4xl font-black text-success">{totalCompletions}</p>
                <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Total Done</p>
              </div>
            </div>

            {/* Main Chart */}
            <div className="bg-card border rounded-[2rem] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Performance Trend</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="shortLabel" tickLine={false} axisLine={false} tickFormatter={tickFormatter} tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}} />
                    <YAxis tickLine={false} axisLine={false} tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorRate)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GitHub Style Heatmap */}
            <div className="bg-card border rounded-[2rem] p-6 shadow-sm overflow-x-auto">
              <h3 className="font-bold text-lg mb-4">Yearly Consistency</h3>
              <div className="flex flex-col gap-1 min-w-max">
                <div className="flex gap-1">
                  {/* Generate weeks and days in a grid */}
                  {Array.from({ length: 52 }).map((_, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-1">
                      {Array.from({ length: 7 }).map((_, dayIdx) => {
                        const dayData = heatmapData[weekIdx * 7 + dayIdx];
                        if (!dayData) return <div key={dayIdx} className="w-3 h-3" />;
                        
                        let bgColor = 'hsl(var(--muted)/0.5)';
                        if (dayData.rate > 0) bgColor = `hsl(var(--primary)/${0.2 + (dayData.rate / 100) * 0.8})`;
                        if (dayData.rate === 100) bgColor = 'hsl(var(--success))';

                        return (
                          <div 
                            key={dayIdx} 
                            title={`${dayData.date}: ${Math.round(dayData.rate)}%`}
                            className="w-3 h-3 rounded-sm transition-transform hover:scale-125 hover:z-10 cursor-crosshair"
                            style={{ backgroundColor: bgColor }} 
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Category Stats */}
            <div className="bg-card border rounded-[2rem] p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><PieChart className="w-5 h-5"/> Categories</h3>
              <div className="space-y-4">
                {categoryStats.map(stat => (
                  <div key={stat.color} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-${stat.color}-500`} style={{ backgroundColor: `var(--${stat.color})` }} />
                    <span className="flex-1 text-sm font-medium capitalize">{stat.color} Habits</span>
                    <span className="text-sm font-bold bg-muted px-2 py-0.5 rounded-full">{stat.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meditation Artwork Integration */}
            {hasMeditation && (
              <div className="bg-card border rounded-[2rem] overflow-hidden shadow-sm relative group">
                <img src={MEDITATION_ARTWORK} alt="Meditation" className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-5">
                  <p className="text-white font-bold text-lg">Mindful State</p>
                  <p className="text-white/70 text-xs mt-1">Your meditation habits are active. Keep finding your center.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
