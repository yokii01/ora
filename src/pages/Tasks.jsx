const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';

import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus, Search, Circle, CheckCircle2,
  Trash2, Calendar, MoreHorizontal, Pencil, X, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

const PRIORITY_CONFIG = {
  urgent: { color: 'text-red-100', bg: 'bg-red-500/50 border-red-500/40', label: 'Urgent', dot: 'bg-red-500' },
  high: { color: 'text-red-100', bg: 'bg-red-500/50 border-red-500/40', label: 'High', dot: 'bg-red-500' },
  medium: { color: 'text-blue-100', bg: 'bg-blue-500/50 border-blue-500/40', label: 'Medium', dot: 'bg-blue-500' },
  low: { color: 'text-green-100', bg: 'bg-emerald-500/50 border-emerald-500/40', label: 'Low', dot: 'bg-emerald-500' },
};

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'personal', label: 'Personal' },
];

function getDueDateLabel(due_date) {
  if (!due_date) return null;
  const d = new Date(due_date);
  if (isPast(d) && !isToday(d)) return { text: 'Overdue', class: 'text-destructive' };
  if (isToday(d)) return { text: 'Today', class: 'text-warning' };
  if (isTomorrow(d)) return { text: 'Tomorrow', class: 'text-info' };
  return { text: format(d, 'MMM d'), class: 'text-muted-foreground' };
}

/* ─── Confetti Particle Component ─── */
function ConfettiParticles({ active }) {
  const particles = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      angle: (i * 360) / 14 + (Math.random() * 20 - 10),
      distance: 28 + Math.random() * 22,
      size: 3 + Math.random() * 4,
      color: [
        'hsl(152, 60%, 46%)', // green
        'hsl(45, 100%, 60%)', // gold
        'hsl(252, 80%, 68%)', // purple
        'hsl(200, 80%, 60%)', // blue
        'hsl(340, 80%, 65%)', // pink
        'hsl(30, 90%, 60%)',  // orange
      ][i % 6],
      shape: i % 3, // 0=circle, 1=square, 2=star
      delay: Math.random() * 0.08,
    }))
  ).current;

  return (
    <AnimatePresence>
      {active && particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0, 1.2, 0.3],
              x: [0, tx * 0.6, tx],
              y: [0, ty * 0.6, ty],
              rotate: [0, 180 + Math.random() * 180],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.65,
              delay: p.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute pointer-events-none"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.shape === 0 ? '50%' : p.shape === 1 ? '2px' : '50%',
              left: '50%',
              top: '50%',
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              zIndex: 30,
            }}
          />
        );
      })}
    </AnimatePresence>
  );
}

/* ─── Completion Checkbox with Multi-stage Animation ─── */
const CompletionCheckbox = React.memo(({ task, completing, isCompleted, onToggle, config }) => {
  const showConfetti = completing === task.id;

  return (
    <button
      onClick={(e) => onToggle(task, e)}
      className="flex-shrink-0 relative z-10 w-7 h-7 flex items-center justify-center"
    >
      {/* Glow ring – expands when completing */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            key="glow-ring"
            className="absolute inset-0 rounded-full"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
              scale: [0.5, 2.2, 2.8],
              opacity: [0, 0.7, 0],
            }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{
              background: 'radial-gradient(circle, hsl(152, 60%, 46%) 0%, transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Confetti burst */}
      <ConfettiParticles active={showConfetti} />

      {/* Icon states */}
      <AnimatePresence mode="wait">
        {showConfetti ? (
          <motion.div
            key="completing"
            className="relative flex items-center justify-center w-5 h-5"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: [0, 1.4, 1], rotate: [0, 10, 0] }}
            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <div className="absolute inset-0 rounded-full bg-success shadow-[0_0_12px_3px_hsl(152,60%,46%,0.6)]" />
            <Check className="w-3 h-3 text-white relative z-10" strokeWidth={3} />
          </motion.div>
        ) : isCompleted ? (
          <motion.div
            key="done"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            <CheckCircle2 className="w-5 h-5 text-success" />
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <Circle className={cn('w-6 h-6', config.color, 'opacity-40 hover:opacity-80 transition-opacity')} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
});

function SubtaskItem({ subtask, onToggle }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <button onClick={onToggle} className="flex-shrink-0">
        {subtask.completed
          ? <CheckCircle2 className="w-4 h-4 text-success" />
          : <Circle className="w-4 h-4 text-muted-foreground/40" />}
      </button>
      <span className={cn('text-sm', subtask.completed && 'line-through text-muted-foreground')}>{subtask.title}</span>
    </div>
  );
}

const TaskItem = React.memo(({
  task,
  completing,
  onToggleStatus,
  onDelete,
  onOpenDetail
}) => {
  const isCompletingNow = completing === task.id;
  const isCompleted = task.status === 'completed';

  const config = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const dueDateInfo = getDueDateLabel(task.due_date);
  const totalSubtasks = (task.subtasks || []).length;
  const completedSubtasks = (task.subtasks || []).filter(s => s.completed).length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={isCompletingNow ? { opacity: 1, y: 0, height: 'auto', marginBottom: 12, backgroundColor: 'rgba(34, 197, 94, 0.06)' } : { opacity: 1, y: 0, height: 'auto', marginBottom: 12, backgroundColor: 'transparent' }}
      exit={{ opacity: 0, x: 60, scale: 0.95, height: 0, marginBottom: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
      className="relative rounded-[22px] overflow-hidden"
    >
      <div
        onClick={() => !isCompletingNow && onOpenDetail(task)}
        className={cn(
          'relative flex items-stretch cursor-pointer group overflow-hidden transition-all duration-300',
          'min-h-[72px]',
          'rounded-[22px]',
          'z-10',
          'bg-card border-2',
          isCompleted ? 'border-emerald-500/15 bg-emerald-500/5' : 'border-border/60',
          'shadow-sm',
          isCompleted ? 'shadow-none' : 'hover:border-border hover:shadow-md',
          isCompletingNow && 'shadow-[0_0_24px_rgba(34,197,94,0.15)] glow-success'
        )}
      >
        {/* Soft Brushed Gradient ONLY on the right side */}
        <div className="absolute inset-y-0 right-0 w-[40%] md:w-[35%] overflow-hidden rounded-r-[22px] pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-card z-10 w-16" />
          {!isCompleted && (
            <div className={cn('absolute inset-0 opacity-15 dark:opacity-20 transition-opacity duration-500', config.bg.split(' ')[0])} style={{ filter: 'blur(16px)' }} />
          )}
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white/10 to-transparent mix-blend-overlay" />
        </div>

        <div className={cn("flex-1 min-w-0 py-3 pl-[16px] pr-[16px] flex items-center justify-between relative z-20 transition-all duration-300", isCompleted && "opacity-70 grayscale-[0.2]")}>
          
          {/* Left: Checkbox & Content */}
          <div className="flex items-center gap-[14px] flex-1 min-w-0 pr-4">
            <div className="flex flex-col items-center justify-center shrink-0">
              <CompletionCheckbox task={task} completing={completing} isCompleted={isCompleted} onToggle={onToggleStatus} config={config} />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <p className={cn(
                  'text-[16px] font-bold tracking-tight leading-tight line-clamp-1',
                  'text-zinc-900 dark:text-zinc-100',
                  isCompleted && 'line-through text-muted-foreground',
                  isCompletingNow && 'text-green-500 dark:text-green-400'
                )}>
                  {task.title}
                </p>
              </div>

              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {dueDateInfo && (
                  <span className={cn('text-[11px] font-semibold tracking-wide uppercase', dueDateInfo.class)}>
                    {dueDateInfo.text}
                  </span>
                )}
                {totalSubtasks > 0 && (
                  <span className="text-[11px] font-medium text-muted-foreground">{completedSubtasks}/{totalSubtasks} subtasks</span>
                )}
                {task.tags?.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-hidden shrink-0">
                    {task.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[10px] font-bold text-primary bg-primary/5 dark:bg-primary/10 px-2 py-0.5 rounded-full truncate max-w-[70px]">
                        #{tag.replace(/^#/, '')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Priority Badge ONLY */}
          <div className="flex-shrink-0 flex flex-col justify-center items-end relative z-20">
             <span className={cn('text-[10px] font-bold px-3 py-1 rounded-full shadow-sm', config.bg, config.color)}>
               {config.label}
             </span>
          </div>

        </div>
      </div>
    </motion.div>
  );
}, (prev, next) => (
  prev.task.id === next.task.id &&
  prev.task.status === next.task.status &&
  prev.task.priority === next.task.priority &&
  prev.task.title === next.task.title &&
  prev.task.due_date === next.task.due_date &&
  prev.completing === next.completing &&
  JSON.stringify(prev.task.tags) === JSON.stringify(next.task.tags) &&
  JSON.stringify(prev.task.subtasks) === JSON.stringify(next.task.subtasks)
));

export default function Tasks() {
  const [activeTab, setActiveTab] = useLocalStorageState('tasks_active_tab', 'all');
  const [search, setSearch] = useLocalStorageState('tasks_search_query', '');
  const [showSearch, setShowSearch] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [newSubtask, setNewSubtask] = useState('');
  const [newTag, setNewTag] = useState('');
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => db.entities.Task.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Task.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setShowAdd(false); setEditTask(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Task.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setDetailTask(null); },
  });

  const [completing, setCompleting] = useState(null);

  const toggleStatus = useCallback((task, e) => {
    e?.stopPropagation();
    const next = task.status === 'completed' ? 'pending' : 'completed';
    if (next === 'completed') {
      setCompleting(task.id);
      // Multi-stage: glow+checkmark (0-450ms) → confetti (100-650ms) → card slide-out after 600ms
      setTimeout(() => {
        updateMutation.mutate({ id: task.id, data: { status: next } });
        setTimeout(() => setCompleting(null), 500);
      }, 600);
    } else {
      updateMutation.mutate({ id: task.id, data: { status: next } });
    }
  }, [updateMutation]);

  const openEdit = (task) => {
    setEditTask({ ...task });
    setDetailTask(null);
    setShowAdd(true);
  };

  const saveTask = () => {
    if (!editTask?.title?.trim()) return;
    if (editTask.id) updateMutation.mutate({ id: editTask.id, data: editTask });
    else createMutation.mutate(editTask);
    setShowAdd(false);
    setEditTask(null);
  };

  const toggleSubtask = (task, idx) => {
    const subtasks = [...(task.subtasks || [])];
    subtasks[idx] = { ...subtasks[idx], completed: !subtasks[idx].completed };
    updateMutation.mutate({ id: task.id, data: { subtasks } });
    if (detailTask?.id === task.id) setDetailTask({ ...detailTask, subtasks });
  };

  const addSubtask = () => {
    if (!newSubtask.trim() || !editTask) return;
    setEditTask({ ...editTask, subtasks: [...(editTask.subtasks || []), { title: newSubtask.trim(), completed: false }] });
    setNewSubtask('');
  };

  const addTag = () => {
    if (!newTag.trim() || !editTask) return;
    const tags = [...(editTask.tags || [])];
    if (!tags.includes(newTag.trim())) tags.push(newTag.trim());
    setEditTask({ ...editTask, tags });
    setNewTag('');
  };

  const getFiltered = () => {
    let result = tasks.filter(t => t.title?.toLowerCase().includes(search.toLowerCase()));
    if (activeTab === 'today') result = result.filter(t => t.due_date && isToday(new Date(t.due_date)));
    if (activeTab === 'upcoming') result = result.filter(t => t.due_date && !isToday(new Date(t.due_date)) && !isPast(new Date(t.due_date)));
    if (activeTab === 'personal') result = result.filter(t => t.tags?.includes('Personal') || !t.tags?.length);
    return result;
  };

  const filtered = getFiltered();
  const todayCount = tasks.filter(t => t.due_date && isToday(new Date(t.due_date)) && t.status !== 'completed').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
            {todayCount > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">
                You've got <span className="text-primary font-semibold">{todayCount} task{todayCount > 1 ? 's' : ''}</span> to crush today
                <span className="ml-1 text-muted-foreground/60">{format(new Date(), 'd MMM')}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSearch(!showSearch)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setEditTask({ title: '', description: '', priority: 'medium', status: 'pending', due_date: '', tags: [], subtasks: [] }); setShowAdd(true); }}
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-2xl bg-muted/50 border-0" autoFocus />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Tabs */}
        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar px-1">
          {STATUS_TABS.map(tab => (
            <motion.button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn('px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.5)]' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border shadow-sm')}>
              {tab.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Section header */}
      {filtered.filter(t => t.status !== 'completed').length > 0 && (
        <div className="flex items-center justify-between mb-4 mt-2 px-1">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">To do tasks</p>
          <button className="text-xs text-primary font-semibold hover:underline">See all</button>
        </div>
      )}

      {/* Task List — Capsule Cards */}
      <div className="pb-4">
        <AnimatePresence>
          {filtered.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              completing={completing}
              onToggleStatus={toggleStatus}
              onDelete={deleteMutation.mutate}
              onOpenDetail={setDetailTask}
            />
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="text-base font-semibold">All clear!</p>
          <p className="text-sm text-muted-foreground mt-1">No tasks here. Tap + to add one.</p>
        </motion.div>
      )}

      {/* Task Detail Dialog */}
      <Dialog open={!!detailTask} onOpenChange={(o) => !o && setDetailTask(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-[36px] border-border/50 p-6">
          {detailTask && (() => {
            const config = PRIORITY_CONFIG[detailTask.priority] || PRIORITY_CONFIG.medium;
            const dueDateInfo = getDueDateLabel(detailTask.due_date);
            return (
              <>
                <DialogHeader className="mb-2 space-y-3">
                  <div className="flex items-center justify-between pr-6">
                    <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full border', config.bg, config.color)}>{config.label}</span>
                    <button onClick={() => openEdit(detailTask)} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <DialogTitle className="text-xl font-bold">{detailTask.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  {/* Description */}
                  {detailTask.description && (
                    <div className="bg-muted/30 rounded-2xl p-4 text-sm text-foreground/90 leading-relaxed">
                      {detailTask.description}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-3">
                    {dueDateInfo && (
                      <div className="bg-muted/50 rounded-2xl p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Due</p>
                        <p className={cn('text-sm font-semibold', dueDateInfo.class)}>{dueDateInfo.text} {detailTask.due_date && format(new Date(detailTask.due_date), '· h:mm a')}</p>
                      </div>
                    )}
                    {detailTask.tags?.length > 0 && (
                      <div className="bg-muted/50 rounded-2xl p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Tags</p>
                        <p className="text-sm font-medium">{detailTask.tags.join(', ')}</p>
                      </div>
                    )}
                  </div>

                  {/* Subtasks */}
                  {detailTask.subtasks?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Subtasks</p>
                      <div className="space-y-0.5 bg-muted/40 rounded-2xl p-3">
                        {detailTask.subtasks.map((s, idx) => (
                          <SubtaskItem key={idx} subtask={s} onToggle={() => toggleSubtask(detailTask, idx)} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => openEdit(detailTask)} className="flex-1 h-12 rounded-full gap-2 text-sm font-semibold border-primary/20 hover:bg-primary/5 hover:text-primary">
                        <Pencil className="w-4 h-4" /> Edit
                      </Button>
                      <Button
                        onClick={() => toggleStatus(detailTask)}
                        className={cn('flex-1 h-12 rounded-full gap-2 text-sm font-semibold shadow-lg', detailTask.status === 'completed' ? 'bg-muted text-foreground hover:bg-muted/80 shadow-none' : 'bg-success hover:bg-success/90 text-success-foreground shadow-success/20')}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {detailTask.status === 'completed' ? 'Undo' : 'Done'}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => { if (confirm('Delete this task permanently?')) { deleteMutation.mutate(detailTask.id); } }}
                      className="w-full h-12 rounded-full gap-2 text-sm font-semibold text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Task
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Add / Edit Task Dialog */}
      <Dialog open={showAdd} onOpenChange={(o) => { if (!o) { setShowAdd(false); setEditTask(null); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-[36px] border-border/50 p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              {editTask?.id ? <><Pencil className="w-5 h-5 text-primary" /> Edit task</> : <><Plus className="w-5 h-5 text-primary" /> New task</>}
            </DialogTitle>
          </DialogHeader>
          {editTask && (
            <div className="space-y-5 mt-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wider">Task name</label>
                <Input
                  placeholder="Write your task here..."
                  value={editTask.title}
                  onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                  className="rounded-2xl bg-muted/40 border-0 h-12 px-4 text-base"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wider">Description</label>
                <Textarea
                  placeholder="Add more details or notes"
                  value={editTask.description || ''}
                  onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                  className="resize-none rounded-2xl bg-muted/40 border-0 min-h-[100px] p-4 text-base"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Due date
                </label>
                <Input
                  type="date"
                  value={editTask.due_date || ''}
                  onChange={(e) => setEditTask({ ...editTask, due_date: e.target.value })}
                  className="rounded-2xl bg-muted/40 border-0 h-12 px-4"
                />
              </div>

              {/* Subtasks */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wider">Subtasks</label>
                <div className="space-y-1.5 mb-3">
                  {(editTask.subtasks || []).map((s, i) => (
                    <div key={i} className="flex items-center gap-2 bg-muted/40 rounded-2xl px-4 py-3">
                      <Circle className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                      <span className="text-sm flex-1">{s.title}</span>
                      <button onClick={() => setEditTask({ ...editTask, subtasks: editTask.subtasks.filter((_, j) => j !== i) })} className="p-1 hover:bg-destructive/10 rounded-full transition-colors">
                        <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Subtask title" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSubtask()} className="rounded-2xl bg-muted/40 border-0 h-11 text-sm px-4" />
                  <Button variant="secondary" onClick={addSubtask} className="rounded-2xl h-11 px-4 hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wider">Priority</label>
                  <Select value={editTask.priority} onValueChange={(v) => setEditTask({ ...editTask, priority: v })}>
                    <SelectTrigger className="rounded-2xl bg-muted/40 border-0 h-11 px-4"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/50">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wider">Tags</label>
                  <div className="flex gap-1">
                    <Input placeholder="Add tag..." value={newTag} onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTag()} className="rounded-2xl bg-muted/40 border-0 h-11 text-sm px-3" />
                    <Button variant="secondary" onClick={addTag} className="rounded-2xl h-11 px-3 hover:bg-primary hover:text-primary-foreground transition-colors">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-1.5 flex-wrap mt-2">
                    {(editTask.tags || []).map(tag => (
                      <span key={tag} className="text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                        {tag}
                        <button onClick={() => setEditTask({ ...editTask, tags: editTask.tags.filter(t => t !== tag) })}>
                          <X className="w-3 h-3 hover:text-destructive transition-colors" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <Button onClick={saveTask} className="w-full rounded-full h-12 text-sm font-semibold shadow-lg shadow-primary/20">
                  {editTask.id ? 'Save changes' : 'Create task'}
                </Button>
                {editTask.id && (
                  <Button
                    variant="outline"
                    onClick={() => { if (confirm('Delete this task permanently?')) { deleteMutation.mutate(editTask.id); setShowAdd(false); setEditTask(null); } }}
                    className="w-full h-12 rounded-full gap-2 text-sm font-semibold text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Task
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
