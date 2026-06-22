import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Edit3, Trash2, Check, Plus, X, Calendar,
  DollarSign, MapPin, Flag, CheckSquare, Star, MoreVertical,
  Copy, Download, Share, Archive
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { PLAN_TYPES, STATUS_CONFIG, getCoverImage } from './planUtils';

const PRIORITY_COLORS = {
  low: 'text-blue-500', medium: 'text-amber-500', high: 'text-orange-500', urgent: 'text-red-500'
};

export default function PlanDetail({ plan, onBack, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(plan);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newMilestone, setNewMilestone] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editNotes, setEditNotes] = useState(false);

  const typeInfo = PLAN_TYPES.find(t => t.type === plan.plan_type) || PLAN_TYPES[0];
  const statusInfo = STATUS_CONFIG[plan.status] || STATUS_CONFIG.active;
  const coverImage = plan.cover_image || getCoverImage(plan.plan_type, plan.title);
  const checklist = plan.checklist || [];
  const milestones = plan.milestones || [];
  const doneCount = checklist.filter(c => c.done).length;

  const save = (data) => onUpdate(data);

  const toggleCheck = (id) => {
    const updated = checklist.map(c => c.id === id ? { ...c, done: !c.done } : c);
    const progress = updated.length > 0 ? Math.round((updated.filter(c => c.done).length / updated.length) * 100) : plan.progress;
    save({ checklist: updated, progress });
  };

  const addCheck = () => {
    if (!newCheckItem.trim()) return;
    const updated = [...checklist, { id: Date.now().toString(), text: newCheckItem.trim(), done: false }];
    save({ checklist: updated });
    setNewCheckItem('');
  };

  const removeCheck = (id) => save({ checklist: checklist.filter(c => c.id !== id) });

  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    const updated = [...milestones, { id: Date.now().toString(), title: newMilestone.trim(), completed: false, date: '' }];
    save({ milestones: updated });
    setNewMilestone('');
  };

  const toggleMilestone = (id) => {
    save({ milestones: milestones.map(m => m.id === id ? { ...m, completed: !m.completed } : m) });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: plan.title,
          text: `Check out my ${typeInfo.label}: ${plan.title}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.log('Error sharing', err);
    }
  };

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'checklist', label: `Tasks (${checklist.length})` },
    { key: 'milestones', label: `Milestones (${milestones.length})` },
    { key: 'notes', label: 'Master Plan' },
  ];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="min-h-screen bg-background pb-32">
      {/* Cover Area */}
      <div className="relative h-[35vh] min-h-[280px] w-full group">
        <img src={coverImage} alt={plan.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />

        {/* Back button */}
        <button onClick={onBack}
          className="absolute top-6 left-5 p-3 rounded-2xl bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all z-10 shadow-lg border border-white/10">
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Actions */}
        <div className="absolute top-6 right-5 flex gap-2.5 z-10">
          <button onClick={() => save({ favorite: !plan.favorite })}
            className="p-3 rounded-2xl bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all shadow-lg border border-white/10">
            <Star className={cn('w-5 h-5 transition-transform duration-300', plan.favorite && 'fill-amber-400 text-amber-400 scale-110')} />
          </button>
          
          <div className="relative">
            <button className="peer p-3 rounded-2xl bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all shadow-lg border border-white/10">
              <MoreVertical className="w-5 h-5" />
            </button>
            <div className="absolute right-0 mt-2 w-52 bg-popover/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl opacity-0 invisible peer-focus:opacity-100 peer-focus:visible hover:opacity-100 hover:visible transition-all z-50 overflow-hidden transform origin-top-right">
              <button onClick={() => {}} className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium hover:bg-muted/80 transition-colors"><Copy className="w-4 h-4 text-muted-foreground" /> Duplicate</button>
              <button onClick={() => window.print()} className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium hover:bg-muted/80 transition-colors"><Download className="w-4 h-4 text-muted-foreground" /> Export PDF</button>
              <button onClick={handleShare} className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium hover:bg-muted/80 transition-colors"><Share className="w-4 h-4 text-muted-foreground" /> Share</button>
              <button onClick={() => save({ status: 'paused' })} className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium hover:bg-muted/80 transition-colors"><Archive className="w-4 h-4 text-muted-foreground" /> Archive</button>
              <div className="h-px bg-border/50 my-1 mx-2"></div>
              <button onClick={() => setConfirmDelete(true)} className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold hover:bg-destructive/10 text-destructive transition-colors"><Trash2 className="w-4 h-4" /> Delete Plan</button>
            </div>
          </div>
        </div>

        {/* Title and Info */}
        <div className="absolute bottom-6 left-5 right-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl drop-shadow-md">{typeInfo.emoji}</span>
            <span className="text-white/90 text-sm font-semibold tracking-wide drop-shadow-md">{typeInfo.label}</span>
            <span className={cn('ml-auto text-[11px] font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-md border border-white/10', statusInfo.bg, statusInfo.text.replace('text-','text-white/90 drop-shadow-md bg-'))}>
              {statusInfo.label}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-md leading-tight tracking-tight">{plan.title}</h1>
          {plan.location && (
            <div className="flex items-center gap-1.5 mt-2">
              <MapPin className="w-4 h-4 text-white/80" />
              <span className="text-white/80 text-sm font-medium drop-shadow-sm">{plan.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${plan.progress || 0}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-primary"
        />
      </div>

      {/* Stats strip */}
      <div className="flex items-center justify-around px-4 py-5 border-b border-border/40 bg-card/50 backdrop-blur-md">
        <StatItem icon={<Flag className="w-4 h-4" />} label="Progress" value={`${plan.progress || 0}%`} />
        {plan.budget > 0 && <StatItem icon={<DollarSign className="w-4 h-4" />} label="Budget" value={`$${plan.budget.toLocaleString()}`} />}
        {plan.start_date && <StatItem icon={<Calendar className="w-4 h-4" />} label="Start" value={plan.start_date} />}
        {plan.end_date && <StatItem icon={<Calendar className="w-4 h-4" />} label="End" value={plan.end_date} />}
        <StatItem icon={<CheckSquare className="w-4 h-4" />} label="Tasks" value={`${doneCount}/${checklist.length}`} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/30 overflow-x-auto px-4 pt-4 hide-scrollbar">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn('flex-shrink-0 px-5 py-2.5 text-sm font-bold rounded-t-2xl transition-all',
              activeTab === tab.key ? 'bg-muted/50 text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground')}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4 py-5 pb-32">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4">
              {plan.description && (
                <div className="p-4 rounded-2xl bg-muted/40">
                  <p className="text-sm text-foreground/80 leading-relaxed">{plan.description}</p>
                </div>
              )}

              {/* Quick edit fields */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Update</h3>

                {/* Progress slider */}
                <div className="p-4 rounded-2xl bg-card border border-border/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold">Progress</span>
                    <span className="text-xs font-bold text-primary">{editData.progress || plan.progress || 0}%</span>
                  </div>
                  <input type="range" min="0" max="100"
                    value={editData.progress ?? plan.progress ?? 0}
                    onChange={e => setEditData(p => ({ ...p, progress: parseInt(e.target.value) }))}
                    onMouseUp={() => save({ progress: editData.progress })}
                    onTouchEnd={() => save({ progress: editData.progress })}
                    className="w-full accent-primary" />
                </div>

                {/* Status */}
                <div className="p-4 rounded-2xl bg-card border border-border/40">
                  <span className="text-xs font-semibold block mb-2">Status</span>
                  <div className="flex gap-2 flex-wrap">
                    {['active', 'upcoming', 'paused', 'completed', 'draft'].map(s => (
                      <button key={s} onClick={() => save({ status: s })}
                        className={cn('px-3 py-1.5 rounded-full text-xs font-semibold transition-all border',
                          plan.status === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted-foreground hover:border-primary/30')}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes quick view */}
                {plan.notes && (
                  <div className="p-4 rounded-2xl bg-card border border-border/40">
                    <span className="text-xs font-semibold block mb-2">Plan Notes</span>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-6">{plan.notes}</p>
                    <button onClick={() => setActiveTab('notes')} className="text-xs text-primary font-semibold mt-2">View all →</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'checklist' && (
            <motion.div key="checklist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-3">
              <div className="flex gap-2">
                <input value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCheck()}
                  placeholder="Add task..." className="flex-1 bg-muted/50 border border-border/40 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
                <button onClick={addCheck} className="p-2.5 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {checklist.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No tasks yet. Add your first task above.</p>
              ) : (
                <div className="space-y-2">
                  {checklist.map(item => (
                    <motion.div key={item.id} layout
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/40 group">
                      <button onClick={() => toggleCheck(item.id)}
                        className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                          item.done ? 'bg-primary border-primary' : 'border-border/60 hover:border-primary/50')}>
                        {item.done && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <span className={cn('flex-1 text-sm', item.done && 'line-through text-muted-foreground')}>{item.text}</span>
                      <button onClick={() => removeCheck(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'milestones' && (
            <motion.div key="milestones" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-3">
              <div className="flex gap-2">
                <input value={newMilestone} onChange={e => setNewMilestone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addMilestone()}
                  placeholder="Add milestone..." className="flex-1 bg-muted/50 border border-border/40 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
                <button onClick={addMilestone} className="p-2.5 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {milestones.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No milestones yet. Add key milestones above.</p>
              ) : (
                <div className="relative space-y-0">
                  {milestones.map((m, i) => (
                    <div key={m.id} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <button onClick={() => toggleMilestone(m.id)}
                          className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-3 transition-all z-10',
                            m.completed ? 'bg-primary border-primary' : 'bg-card border-border/60 hover:border-primary/50')}>
                          {m.completed && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                        {i < milestones.length - 1 && <div className="w-0.5 flex-1 bg-border/40 mt-1" />}
                      </div>
                      <div className="flex-1 py-3">
                        <div className="flex items-center justify-between">
                          <span className={cn('text-sm font-medium', m.completed && 'line-through text-muted-foreground')}>{m.title}</span>
                          <button onClick={() => save({ milestones: milestones.filter(x => x.id !== m.id) })}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {m.date && <p className="text-xs text-muted-foreground mt-0.5">{m.date}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'notes' && (
            <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex justify-end mb-3">
                <button onClick={() => setEditNotes(!editNotes)} className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-muted rounded-xl hover:bg-muted/80">
                  {editNotes ? <Check className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                  {editNotes ? 'Done' : 'Edit'}
                </button>
              </div>
              {editNotes ? (
                <textarea
                  defaultValue={plan.notes || ''}
                  onBlur={e => save({ notes: e.target.value })}
                  placeholder="Write your notes, plans, ideas..."
                  rows={20}
                  className="w-full bg-muted/20 border border-border/40 rounded-2xl p-4 outline-none text-sm leading-relaxed resize-y text-foreground placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30"
                />
              ) : (
                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none bg-card p-5 rounded-2xl border border-border/40 shadow-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:bg-muted/80 [&_code]:text-primary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:text-[13px] [&_pre]:bg-zinc-950 [&_pre]:text-zinc-50 [&_pre]:p-4 [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-white/10 [&_pre_code]:bg-transparent [&_pre_code]:text-zinc-50 [&_pre]:shadow-xl [&_pre]:overflow-x-auto [&_p]:my-1.5">
                  <ReactMarkdown>{plan.notes || '*No notes yet.*'}</ReactMarkdown>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-bold text-center mb-2">Delete Plan?</h3>
              <p className="text-sm text-muted-foreground text-center mb-5">"{plan.title}" will be permanently deleted.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 h-11 rounded-2xl border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button onClick={onDelete} className="flex-1 h-11 rounded-2xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatItem({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <span className="text-xs font-bold">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}