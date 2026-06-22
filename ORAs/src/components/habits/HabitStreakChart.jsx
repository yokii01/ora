import React from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Flame, Target } from 'lucide-react';

export default function HabitStreakChart({ habits = [] }) {
  const last30 = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });

  // Build daily completion rate data
  const chartData = last30.map(day => {
    const d = format(day, 'yyyy-MM-dd');
    const total = habits.filter(h => h.active !== false).length;
    const done = habits.filter(h => h.completions?.some(c => c.date === d)).length;
    return {
      date: d,
      label: format(day, 'MMM d'),
      shortLabel: format(day, 'd'),
      completed: done,
      total,
      rate: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

  // Show every 5th label to avoid crowding
  const tickFormatter = (_, index) => index % 5 === 0 ? chartData[index]?.shortLabel || '' : '';

  const totalCompletions = chartData.reduce((s, d) => s + d.completed, 0);
  const avgRate = chartData.length > 0
    ? Math.round(chartData.reduce((s, d) => s + d.rate, 0) / chartData.length)
    : 0;
  const bestDay = [...chartData].sort((a, b) => b.rate - a.rate)[0];
  const maxStreak = Math.max(...habits.map(h => h.best_streak || 0), 0);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-card border border-border/60 rounded-xl p-2.5 shadow-lg text-xs">
        <p className="font-semibold text-foreground">{d.label}</p>
        <p className="text-muted-foreground mt-0.5">{d.completed}/{d.total} habits</p>
        <p className="text-primary font-bold mt-0.5">{d.rate}% complete</p>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card rounded-2xl border border-border/60 p-5 space-y-5"
    >
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">30-Day Streak Trends</h3>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-primary/5 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-xl font-bold text-primary">{avgRate}%</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Avg. Rate</p>
        </div>
        <div className="bg-warning/5 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame className="w-3.5 h-3.5 text-warning" />
          </div>
          <p className="text-xl font-bold text-warning">{maxStreak}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Best Streak</p>
        </div>
        <div className="bg-success/5 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target className="w-3.5 h-3.5 text-success" />
          </div>
          <p className="text-xl font-bold text-success">{totalCompletions}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Total Done</p>
        </div>
      </div>

      {/* Bar Chart */}
      {habits.length > 0 ? (
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={6} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
              <XAxis
                dataKey="shortLabel"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={tickFormatter}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rate" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.rate === 100 ? 'hsl(var(--success))' : entry.rate >= 50 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground)/0.3)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
          Add habits to see your trends
        </div>
      )}

      {/* Completion heatmap mini */}
      <div>
        <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Completion heatmap</p>
        <div className="flex gap-1 flex-wrap">
          {chartData.map((d, i) => (
            <div
              key={i}
              title={`${d.label}: ${d.rate}%`}
              className="w-5 h-5 rounded-md transition-all"
              style={{
                backgroundColor: d.rate === 0
                  ? 'hsl(var(--muted))'
                  : d.rate === 100
                    ? 'hsl(var(--success))'
                    : `hsl(var(--primary) / ${0.2 + (d.rate / 100) * 0.8})`,
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[9px] text-muted-foreground">Less</span>
          {[0.15, 0.35, 0.55, 0.75, 1].map((opacity, i) => (
            <div key={i} className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: `hsl(var(--primary) / ${opacity})` }} />
          ))}
          <span className="text-[9px] text-muted-foreground">More</span>
        </div>
      </div>
    </motion.div>
  );
}