const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, StickyNote, Calendar, Wallet, Target, CloudRain, PenLine, CheckCircle2, Globe, Lock, Bot } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import TasksWidget from '@/components/dashboard/TasksWidget';
import NotesWidget from '@/components/dashboard/NotesWidget';
import CalendarWidget from '@/components/dashboard/CalendarWidget';
import FinanceWidget from '@/components/dashboard/FinanceWidget';
import HabitoWidget from '@/components/dashboard/HabitoWidget';
import QuickActions from '@/components/dashboard/QuickActions';
import WidgetCustomizer from '@/components/dashboard/WidgetCustomizer';
import QuickNotesWidget from '@/components/dashboard/QuickNotesWidget';
import DailyTasksWidget from '@/components/dashboard/DailyTasksWidget';
import NewsSpotlightWidget from '@/components/dashboard/NewsSpotlightWidget';
import VaultAccessWidget from '@/components/dashboard/VaultAccessWidget';
import AssistantPromptWidget from '@/components/dashboard/AssistantPromptWidget';
import CompactWidget from '@/components/dashboard/CompactWidget';

const DEFAULT_WIDGETS = [
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600', visible: true, pinned: false, size: 'normal' },
  { id: 'notes', label: 'Notes', icon: StickyNote, color: 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600', visible: true, pinned: false, size: 'normal' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, color: 'bg-green-50 dark:bg-green-950/30 text-green-600', visible: true, pinned: false, size: 'normal' },
  { id: 'finance', label: 'Finance', icon: Wallet, color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600', visible: true, pinned: false, size: 'normal' },
  { id: 'habits', label: 'Habito', icon: Target, color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600', visible: true, pinned: false, size: 'normal' },
  { id: 'quick_notes', label: 'Quick Notes', icon: PenLine, color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600', visible: false, pinned: false, size: 'normal' },
  { id: 'daily_tasks', label: 'Daily Tasks', icon: CheckCircle2, color: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600', visible: false, pinned: false, size: 'normal' },
  { id: 'news', label: 'News Spotlight', icon: Globe, color: 'bg-red-50 dark:bg-red-950/30 text-red-600', visible: false, pinned: false, size: 'wide' },
  { id: 'vault', label: 'Vault Access', icon: Lock, color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100', visible: false, pinned: false, size: 'compact' },
  { id: 'assistant', label: 'Assistant', icon: Bot, color: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600', visible: false, pinned: false, size: 'wide' },
];

const WIDGETS_KEY = 'oras_home_widgets';

function loadWidgets() {
  try {
    const saved = JSON.parse(localStorage.getItem(WIDGETS_KEY) || 'null');
    if (!saved) return DEFAULT_WIDGETS;
    // Merge saved order/visibility/size with current defaults (preserving icons)
    return saved.map(sw => {
      const def = DEFAULT_WIDGETS.find(d => d.id === sw.id);
      return def ? { ...def, visible: sw.visible, size: sw.size, pinned: sw.pinned } : null;
    }).filter(Boolean);
  } catch { return DEFAULT_WIDGETS; }
}

function saveWidgets(widgets) {
  localStorage.setItem(WIDGETS_KEY, JSON.stringify(widgets.map(w => ({ id: w.id, visible: w.visible, size: w.size, pinned: w.pinned }))));
}

const WIDGET_COMPONENTS = {
  tasks: TasksWidget,
  notes: NotesWidget,
  calendar: CalendarWidget,
  finance: FinanceWidget,
  habits: HabitoWidget,
  quick_notes: QuickNotesWidget,
  daily_tasks: DailyTasksWidget,
  news: NewsSpotlightWidget,
  vault: VaultAccessWidget,
  assistant: AssistantPromptWidget,
};

export default function Home() {
  const [widgets, setWidgets] = useState(loadWidgets);

  const handleSetWidgets = (newWidgets) => {
    setWidgets(newWidgets);
    saveWidgets(newWidgets);
  };
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const outletCtx = useOutletContext() || {};
  const { user } = useAuth() || {};
  useEffect(() => {
    if (outletCtx.editModeOpen) {
      setCustomizerOpen(true);
      // keep `editModeOpen` true until the modal closes so layout
      // (e.g., BottomNav) can react to the modal being open
    }
  }, [outletCtx.editModeOpen]);

  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => db.entities.Task.list('-created_date', 20) });
  const { data: notes = [] } = useQuery({ queryKey: ['notes'], queryFn: () => db.entities.Note.list('-updated_date', 10) });
  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => db.entities.CalendarEvent.list('-start_date', 10) });
  const { data: transactions = [] } = useQuery({ queryKey: ['transactions'], queryFn: () => db.entities.Transaction.list('-date', 50) });
  const { data: habits = [] } = useQuery({ queryKey: ['habits'], queryFn: () => db.entities.Habit.list() });

  const today = new Date();
  const hour = today.getHours();
  const greetingWord = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const rawName = user?.full_name?.split(' ')[0] || '';
  // Map full names to preferred display names
  const NAME_MAP = { 'Yogheswar': 'Yoki', 'yogheswar': 'Yoki' };
  const firstName = NAME_MAP[rawName] || rawName;
  // Custom premium greeting
  const greeting = 'Helloo, Yok!! 👋';

  const widgetData = { tasks, notes, events, transactions, habits };

  const getWidgetProps = (id) => ({
    tasks: { tasks },
    notes: { notes },
    calendar: { events },
    finance: { transactions },
    habits: { habits },
  }[id] || {});

  const visibleWidgets = widgets.filter(w => w.visible);

  const getColSpan = (size) => {
    if (size === 'wide') return 'md:col-span-2 xl:col-span-2';
    if (size === 'compact') return 'md:col-span-1 xl:col-span-1';
    return 'md:col-span-1 xl:col-span-1';
  };

  const getSizeClasses = (size) => {
    if (size === 'compact') return 'aspect-square';
    if (size === 'wide') return 'md:col-span-2 xl:col-span-2';
    return '';
  };

  return (
    <div className="space-y-6 pt-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{greeting} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">{format(today, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        {/* Mobile customize button - only in TopBar now */}
      </motion.div>

      {/* Quick Actions */}
      <QuickActions delay={0.1} />

      {/* Widget Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 place-content-center">
        <AnimatePresence>
          {visibleWidgets.map((w, i) => {
            const Component = WIDGET_COMPONENTS[w.id];
            if (!Component) return null;
            const props = getWidgetProps(w.id);
            const sizeClasses = getSizeClasses(w.size);
            return (
              <motion.div
                key={w.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ delay: i * 0.05, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className={`${getColSpan(w.size)} ${sizeClasses} h-full`}
              >
                {w.size === 'compact' ? (
                  (() => {
                    const def = DEFAULT_WIDGETS.find(d => d.id === w.id) || {};
                    return <CompactWidget icon={def.icon} label={def.label} />;
                  })()
                ) : (
                  <Component {...props} delay={0.1 + i * 0.05} />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Widget Customizer */}
      <AnimatePresence>
        {customizerOpen && (
          <WidgetCustomizer
            widgets={widgets}
            setWidgets={handleSetWidgets}
            components={WIDGET_COMPONENTS}
            getWidgetProps={getWidgetProps}
            onClose={() => { setCustomizerOpen(false); outletCtx.setEditModeOpen?.(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}