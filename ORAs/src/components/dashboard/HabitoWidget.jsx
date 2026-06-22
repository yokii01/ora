import React from 'react';
import { Link } from 'react-router-dom';
import { Target, ArrowRight, Flame } from 'lucide-react';
import { format } from 'date-fns';
import WidgetCard from './WidgetCard';

export default function HabitoWidget({ habits = [], delay = 0 }) {
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <WidgetCard delay={delay}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-destructive" />
          </div>
          <h3 className="font-semibold text-sm">Habits</h3>
        </div>
        <Link to="/habits" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {habits.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Start tracking habits</p>
      ) : (
        <div className="space-y-3">
          {habits.slice(0, 4).map((habit) => {
            const doneToday = habit.completions?.some(c => c.date === today);
            return (
              <div key={habit.id} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  doneToday ? 'bg-success border-success' : 'border-muted-foreground/30'
                }`}>
                  {doneToday && <span className="text-white text-[10px]">✓</span>}
                </div>
                <span className="text-sm flex-1 truncate">{habit.name}</span>
                {habit.current_streak > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-warning font-medium">
                    <Flame className="w-3 h-3" />
                    {habit.current_streak}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </WidgetCard>
  );
}