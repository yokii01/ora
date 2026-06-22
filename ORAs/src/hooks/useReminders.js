const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect } from 'react';

import { toast } from 'sonner';
import { isToday, isTomorrow, isPast, differenceInDays, format } from 'date-fns';

const REMINDER_KEY = 'oras_last_reminder_check';

export function useReminders() {
  useEffect(() => {
    const lastCheck = localStorage.getItem(REMINDER_KEY);
    const today = format(new Date(), 'yyyy-MM-dd');
    if (lastCheck === today) return; // Already checked today

    const checkReminders = async () => {
      try {
        const [tasks, habits] = await Promise.all([
          db.entities.Task.list('-due_date'),
          db.entities.Habit.list('-created_date'),
        ]);

        // Tasks due today
        const todayTasks = tasks.filter(t =>
          t.status !== 'completed' && t.due_date && isToday(new Date(t.due_date))
        );
        if (todayTasks.length > 0) {
          toast(`📋 ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} due today`, {
            description: todayTasks.slice(0, 2).map(t => t.title).join(', '),
            duration: 6000,
          });
        }

        // Overdue tasks
        const overdueTasks = tasks.filter(t =>
          t.status !== 'completed' && t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))
        );
        if (overdueTasks.length > 0) {
          setTimeout(() => {
            toast.warning(`⚠️ ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`, {
              description: overdueTasks.slice(0, 2).map(t => t.title).join(', '),
              duration: 6000,
            });
          }, 1500);
        }

        // Due tomorrow
        const tomorrowTasks = tasks.filter(t =>
          t.status !== 'completed' && t.due_date && isTomorrow(new Date(t.due_date))
        );
        if (tomorrowTasks.length > 0) {
          setTimeout(() => {
            toast(`🗓️ ${tomorrowTasks.length} task${tomorrowTasks.length > 1 ? 's' : ''} due tomorrow`, {
              description: tomorrowTasks.slice(0, 2).map(t => t.title).join(', '),
              duration: 5000,
            });
          }, 3000);
        }

        // Daily habits not completed today
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const pendingHabits = habits.filter(h => {
          if (!h.active || h.frequency !== 'daily') return false;
          const completedToday = (h.completions || []).some(c => c.date === todayStr);
          return !completedToday;
        });
        if (pendingHabits.length > 0) {
          setTimeout(() => {
            toast(`🔥 ${pendingHabits.length} habit${pendingHabits.length > 1 ? 's' : ''} pending today`, {
              description: pendingHabits.slice(0, 2).map(h => h.name).join(', '),
              duration: 5000,
            });
          }, 4500);
        }

        localStorage.setItem(REMINDER_KEY, today);
      } catch (e) {
        // Silently fail
      }
    };

    // Delay check by 2 seconds after app load
    const timer = setTimeout(checkReminders, 2000);
    return () => clearTimeout(timer);
  }, []);
}