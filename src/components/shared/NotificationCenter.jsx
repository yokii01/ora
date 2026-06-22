const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckSquare, Calendar, Target, Clock, X, CheckCheck, AlertTriangle, Zap, Star,
  Repeat, CreditCard, RefreshCw
} from 'lucide-react';
import { format, differenceInMinutes, parseISO } from 'date-fns';

import { cn } from '@/lib/utils';

const priorityConfig = {
  urgent: { color: 'text-destructive', bg: 'bg-destructive/10' },
  high: { color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20' },
  normal: { color: 'text-primary', bg: 'bg-primary/8' },
};

function buildNotifications(tasks, events, habits, transactions) {
  const notifs = [];
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const tomorrow = format(new Date(now.getTime() + 86400000), 'yyyy-MM-dd');

  // 1. Overdue tasks
  tasks.filter(t => t.status !== 'completed' && t.due_date && t.due_date < today).slice(0, 3).forEach(t => {
    notifs.push({ id: `task-overdue-${t.id}`, type: 'task', priority: 'urgent', title: `Overdue: ${t.title}`, body: `Was due ${t.due_date}`, icon: AlertTriangle, color: 'text-destructive', actionPath: '/tasks' });
  });

  // 2. Tasks due today
  tasks.filter(t => t.status !== 'completed' && t.due_date === today).slice(0, 3).forEach(t => {
    notifs.push({ id: `task-today-${t.id}`, type: 'task', priority: 'high', title: t.title, body: 'Due today', icon: CheckSquare, color: 'text-orange-500', actionPath: '/tasks' });
  });

  // 3. Tasks due tomorrow
  tasks.filter(t => t.status !== 'completed' && t.due_date === tomorrow).slice(0, 2).forEach(t => {
    notifs.push({ id: `task-tomorrow-${t.id}`, type: 'task', priority: 'normal', title: t.title, body: 'Due tomorrow', icon: Clock, color: 'text-blue-400', actionPath: '/tasks' });
  });

  // 4. Urgent/high priority tasks not started
  tasks.filter(t => t.status === 'pending' && (t.priority === 'urgent' || t.priority === 'high') && !t.due_date).slice(0, 2).forEach(t => {
    notifs.push({ id: `task-priority-${t.id}`, type: 'task', priority: t.priority === 'urgent' ? 'urgent' : 'high', title: t.title, body: `${t.priority} priority · not started`, icon: Zap, color: t.priority === 'urgent' ? 'text-destructive' : 'text-orange-500', actionPath: '/tasks' });
  });

  // 5. Events today
  events.filter(e => e.start_date?.split('T')[0] === today).slice(0, 3).forEach(e => {
    const timeStr = e.start_date ? format(parseISO(e.start_date), 'h:mm a') : '';
    const minsUntil = e.start_date ? differenceInMinutes(parseISO(e.start_date), now) : null;
    const isSoon = minsUntil !== null && minsUntil >= 0 && minsUntil <= 60;
    notifs.push({ id: `event-today-${e.id}`, type: 'event', priority: isSoon ? 'high' : 'normal', title: e.title, body: isSoon ? `Starting in ${minsUntil} min · ${timeStr}` : `Today · ${timeStr}`, icon: Calendar, color: 'text-blue-500', actionPath: '/calendar' });
  });

  // 6. Events tomorrow
  events.filter(e => e.start_date?.split('T')[0] === tomorrow).slice(0, 2).forEach(e => {
    notifs.push({ id: `event-tomorrow-${e.id}`, type: 'event', priority: 'normal', title: e.title, body: 'Tomorrow', icon: Calendar, color: 'text-green-500', actionPath: '/calendar' });
  });

  // 7. Habits not done today
  habits.filter(h => {
    const doneToday = h.completions?.some(c => c.date === today);
    return h.active && !doneToday && h.frequency === 'daily';
  }).slice(0, 3).forEach(h => {
    notifs.push({ id: `habit-${h.id}`, type: 'habit', priority: 'normal', title: h.name, body: `Daily habit · ${h.current_streak || 0} day streak`, icon: Target, color: 'text-purple-500', actionPath: '/habits' });
  });

  // 8. Habit streak at risk (streak > 2 and not done today)
  habits.filter(h => {
    const doneToday = h.completions?.some(c => c.date === today);
    return h.active && !doneToday && (h.current_streak || 0) >= 3;
  }).slice(0, 2).forEach(h => {
    notifs.push({ id: `habit-streak-${h.id}`, type: 'habit', priority: 'high', title: `🔥 Streak at risk: ${h.name}`, body: `${h.current_streak} day streak will reset if skipped`, icon: Star, color: 'text-amber-500', actionPath: '/habits' });
  });

  // 9. Large expenses today
  transactions.filter(t => t.type === 'expense' && t.date === today && t.amount > 100).slice(0, 2).forEach(t => {
    notifs.push({ id: `finance-${t.id}`, type: 'finance', priority: 'normal', title: `Expense logged: ${t.title}`, body: `$${t.amount} · ${t.category || 'other'}`, icon: CreditCard, color: 'text-emerald-500', actionPath: '/finance' });
  });

  // 10. Recurring tasks (reminder)
  tasks.filter(t => t.recurring && t.recurring !== 'none' && t.status !== 'completed').slice(0, 2).forEach(t => {
    notifs.push({ id: `task-recurring-${t.id}`, type: 'task', priority: 'normal', title: t.title, body: `Recurring · ${t.recurring}`, icon: Repeat, color: 'text-sky-500', actionPath: '/tasks' });
  });

  // Deduplicate by id
  const seen = new Set();
  return notifs.filter(n => { if (seen.has(n.id)) return false; seen.add(n.id); return true; }).slice(0, 15);
}

export default function NotificationCenter({ open, onClose, onCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [snoozed, setSnoozed] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [tasks, events, habits, transactions] = await Promise.all([
      db.entities.Task.list('-due_date', 50),
      db.entities.CalendarEvent.list('-start_date', 30),
      db.entities.Habit.list(),
      db.entities.Transaction.list('-date', 20),
    ]);
    const built = buildNotifications(tasks, events, habits, transactions);
    const active = built.filter(n => !snoozed.includes(n.id));
    setNotifications(active);
    onCountChange?.(active.length);
    setLoading(false);
  };

  useEffect(() => {
    if (!open) return;
    load();
  }, [open]);

  // Also compute count on mount (even when closed)
  useEffect(() => {
    Promise.all([
      db.entities.Task.list('-due_date', 50),
      db.entities.CalendarEvent.list('-start_date', 30),
      db.entities.Habit.list(),
      db.entities.Transaction.list('-date', 20),
    ]).then(([tasks, events, habits, transactions]) => {
      const built = buildNotifications(tasks, events, habits, transactions);
      onCountChange?.(built.length);
    });
  }, []);

  const dismiss = (id) => {
    setNotifications(prev => {
      const next = prev.filter(n => n.id !== id);
      onCountChange?.(next.length);
      return next;
    });
  };

  const snooze = (id) => {
    setSnoozed(prev => [...prev, id]);
    dismiss(id);
  };

  const dismissAll = () => {
    setNotifications([]);
    onCountChange?.(0);
  };

  const groups = {
    urgent: notifications.filter(n => n.priority === 'urgent'),
    high: notifications.filter(n => n.priority === 'high'),
    normal: notifications.filter(n => n.priority === 'normal'),
  };

  if (!open) return null;

  return (
    <div className="relative">
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="absolute top-full right-0 mt-2 w-80 bg-card/95 backdrop-blur-2xl border border-border/60 rounded-2xl shadow-2xl overflow-hidden z-50"
      >
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Notifications</h3>
            {notifications.length > 0 && (
              <span className="text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full font-bold">{notifications.length}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className={cn('p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground', loading && 'animate-spin')}>
              <RefreshCw className="w-3 h-3" />
            </button>
            {notifications.length > 0 && (
              <button onClick={dismissAll} className="text-[10px] text-muted-foreground hover:text-primary transition-colors font-medium">
                Clear all
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {notifications.length === 0 && !loading && (
            <div className="text-center py-10 text-muted-foreground">
              <CheckCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs mt-1 opacity-70">No new notifications</p>
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-xs">Loading...</span>
            </div>
          )}

          {!loading && ['urgent', 'high', 'normal'].map(priority => {
            const group = groups[priority];
            if (!group.length) return null;
            const labels = { urgent: '🔴 Urgent', high: '🟠 Important', normal: '🔔 Reminders' };
            return (
              <div key={priority}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-3 pb-1">{labels[priority]}</p>
                <AnimatePresence>
                  {group.map(n => {
                    const Icon = n.icon;
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10, height: 0 }}
                        className="px-3 pb-1"
                      >
                        <div className={cn('flex items-start gap-3 p-3 rounded-xl mb-1 group', priority === 'urgent' ? 'bg-destructive/8' : 'hover:bg-muted/50')}>
                          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', priority === 'urgent' ? 'bg-destructive/15' : 'bg-muted')}>
                            <Icon className={cn('w-3.5 h-3.5', n.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold line-clamp-1">{n.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{n.body}</p>
                            <div className="flex gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => snooze(n.id)} className="text-[10px] text-muted-foreground hover:text-primary font-medium flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> Snooze
                              </button>
                              <button onClick={() => dismiss(n.id)} className="text-[10px] text-muted-foreground hover:text-destructive font-medium">Dismiss</button>
                            </div>
                          </div>
                          <button onClick={() => dismiss(n.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-md hover:bg-muted mt-0.5">
                            <X className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}