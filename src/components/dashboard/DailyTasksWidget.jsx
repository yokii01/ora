import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DailyTasksWidget({ delay = 0 }) {
  const tasks = [
    { id: 1, text: 'Review pull requests', done: true },
    { id: 2, text: 'Design widget gallery', done: false },
    { id: 3, text: 'Update dependencies', done: false },
    { id: 4, text: 'Write documentation', done: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="h-full rounded-3xl p-6 bg-card border border-border shadow-sm flex flex-col relative overflow-hidden"
    >
      {/* Decorative bg */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />

      <div className="flex items-center justify-between mb-5 relative z-10">
        <div>
          <h3 className="font-bold text-lg">Daily Focus</h3>
          <p className="text-xs text-muted-foreground mt-0.5">1 of 4 completed</p>
        </div>
        <div className="w-12 h-12 rounded-full border-[3px] border-primary/20 flex items-center justify-center relative">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="21" cy="21" r="19" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary" strokeDasharray="120" strokeDashoffset="90" />
          </svg>
          <span className="text-xs font-bold text-primary">25%</span>
        </div>
      </div>

      <div className="flex-1 space-y-3 relative z-10 overflow-y-auto pr-2 custom-scrollbar">
        {tasks.map(t => (
          <div key={t.id} className="flex items-start gap-3 group cursor-pointer">
            <button className="mt-0.5 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
              {t.done ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>
            <span className={cn('text-sm transition-all', t.done ? 'text-muted-foreground line-through' : 'text-foreground font-medium group-hover:text-primary')}>
              {t.text}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
