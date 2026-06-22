const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles, Send, Plus, MessageSquare, Search,
  Trash2, Edit3, Pin, ArrowLeft, Brain, CheckSquare,
  StickyNote, Calendar, Wallet, Target, Zap,
  ImagePlus, ChevronUp, Cpu, RotateCcw, WifiOff, Copy, Check,
  Camera, FileText, ScanLine, File
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { invokeAI } from '@/api/aiClient';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// ─── Storage helpers ────────────────────────────────────────────────────────
const STORAGE_KEY = 'oras_ai_conversations_v2';
const MEMORY_KEY = 'oras_ai_memory_v2';
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } };
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

function mkConv() {
  return { id: Date.now().toString(), title: 'New Chat', messages: [], pinned: false, createdAt: new Date().toISOString() };
}

// ─── Streaming text hook ────────────────────────────────────────────────────
function useStreamText(target, active) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!active) { setText(target); return; }
    setText('');
    let i = 0;
    const delay = Math.max(5, Math.min(15, 1800 / Math.max(target?.length || 1, 1)));
    const id = setInterval(() => {
      i++;
      setText(target.slice(0, i));
      if (i >= target.length) clearInterval(id);
    }, delay);
    return () => clearInterval(id);
  }, [target, active]);
  return text;
}

// ─── Message bubble ─────────────────────────────────────────────────────────
function Bubble({ msg, isLatest, isStreaming, onRegenerate }) {
  const isUser = msg.role === 'user';
  const streamed = useStreamText(msg.content, isLatest && isStreaming && !isUser);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={cn('flex gap-3 group', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-primary/20">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={cn(
        'max-w-[80%] rounded-[22px] px-4 py-3 relative',
        isUser
          ? 'bg-primary text-primary-foreground rounded-br-[6px] shadow-lg shadow-primary/20'
          : msg.isError
            ? 'bg-destructive/10 border border-destructive/30 rounded-bl-[6px] shadow-md shadow-destructive/20 text-destructive-foreground'
            : 'bg-card border border-border/50 rounded-bl-[6px] shadow-sm'
      )}>
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        ) : msg.isError ? (
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <WifiOff className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm font-semibold">{msg.content}</p>
            </div>
            {onRegenerate && (
              <div className="mt-1">
                <button onClick={onRegenerate} className="flex items-center gap-1.5 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95">
                  <RotateCcw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <ReactMarkdown className="text-sm prose prose-sm prose-slate dark:prose-invert max-w-none leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:bg-muted/80 [&_code]:text-primary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:text-[13px] [&_pre]:bg-zinc-950 [&_pre]:text-zinc-50 [&_pre]:p-4 [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-white/10 [&_pre_code]:bg-transparent [&_pre_code]:text-zinc-50 [&_pre]:shadow-xl [&_pre]:overflow-x-auto [&_p]:my-1.5">
              {streamed || ''}
            </ReactMarkdown>

            {/* Hover Actions */}
            {!isStreaming && (
              <div className="absolute -bottom-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button onClick={handleCopy} className="p-1.5 bg-card border border-border/50 rounded-xl hover:bg-muted text-muted-foreground transition-colors shadow-sm" title="Copy">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {onRegenerate && (
                  <button onClick={onRegenerate} className="p-1.5 bg-card border border-border/50 rounded-xl hover:bg-muted text-muted-foreground transition-colors shadow-sm" title="Regenerate">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Typing indicator ────────────────────────────────────────────────────────
function Typing() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
      <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/20">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-[22px] rounded-bl-[6px] px-4 py-3 shadow-sm flex items-center gap-2 h-10">
        <LoadingSpinner label="" size="sm" />
        <span className="text-xs text-muted-foreground">Thinking...</span>
      </div>
    </motion.div>
  );
}

// ─── Sidebar conv item ───────────────────────────────────────────────────────
function ConvItem({ conv, active, onSelect, onRename, onDelete, onPin }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(conv.title);
  const confirm = () => { if (title.trim()) onRename(conv.id, title.trim()); setEditing(false); };

  return (
    <div
      onClick={() => onSelect(conv.id)}
      className={cn(
        'group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150',
        active ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60 text-foreground'
      )}
    >
      {conv.pinned ? <Pin className="w-3 h-3 flex-shrink-0 opacity-50" /> : <MessageSquare className="w-3 h-3 flex-shrink-0 opacity-40" />}
      {editing ? (
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)} onBlur={confirm}
          onKeyDown={e => e.key === 'Enter' && confirm()}
          className="flex-1 text-xs bg-transparent outline-none border-b border-primary" onClick={e => e.stopPropagation()} />
      ) : (
        <span className="flex-1 text-xs truncate font-medium">{conv.title}</span>
      )}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={() => onPin(conv.id)} className="p-1 rounded hover:bg-primary/10"><Pin className="w-2.5 h-2.5" /></button>
        <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-primary/10"><Edit3 className="w-2.5 h-2.5" /></button>
        <button onClick={() => onDelete(conv.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-2.5 h-2.5" /></button>
      </div>
    </div>
  );
}

// ─── Prompt chips ─────────────────────────────────────────────────────────
const CHIPS = [
  { icon: CheckSquare, label: 'What tasks are due today?', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: Wallet, label: 'Analyze my spending', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: Target, label: 'How are my habits going?', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { icon: Calendar, label: "What's on my calendar?", color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { icon: StickyNote, label: 'Search my notes', color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { icon: Zap, label: 'Create a daily plan', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
];

// ─── Main ────────────────────────────────────────────────────────────────────
export default function Assistant() {
  const [conversations, setConversations] = useState(() => load(STORAGE_KEY, []));
  const [activeId, setActiveId] = useState(() => { const s = load(STORAGE_KEY, []); return s[0]?.id || null; });
  const [selectedModel, setSelectedModel] = useState('auto-free');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [memory, setMemory] = useState(() => load(MEMORY_KEY, ''));
  const [focused, setFocused] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const bottomRef = useRef(null);
  const activeRequestRef = useRef(null);
  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const AVAILABLE_MODELS = [
    { id: 'auto-free', label: 'Auto Fallback', desc: 'OpenRouter → NVIDIA → AQ', badge: 'Default' },
  ];

  // Data queries
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => db.entities.Task.list('-created_date', 50) });
  const { data: notes = [] } = useQuery({ queryKey: ['notes'], queryFn: () => db.entities.Note.list('-updated_date', 30) });
  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => db.entities.CalendarEvent.list('-start_date', 30) });
  const { data: transactions = [] } = useQuery({ queryKey: ['transactions'], queryFn: () => db.entities.Transaction.list('-date', 50) });
  const { data: habits = [] } = useQuery({ queryKey: ['habits'], queryFn: () => db.entities.Habit.list() });

  const activeConv = conversations.find(c => c.id === activeId);
  const messages = activeConv?.messages || [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, loading]);
  useEffect(() => { save(STORAGE_KEY, conversations); }, [conversations]);

  const updateConv = useCallback((id, fn) => setConversations(p => p.map(c => c.id === id ? fn(c) : c)), []);

  const switchChat = (id) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setLoading(false);
    setStreaming(false);
    activeRequestRef.current = null;
    setActiveId(id);
    setSidebarOpen(false);
  };

  const newChat = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setLoading(false);
    setStreaming(false);
    activeRequestRef.current = null;
    const c = mkConv();
    setConversations(p => [c, ...p]);
    setActiveId(c.id);
    setInput('');
    setAttachments([]);
    setSidebarOpen(false);
  };

  const deleteConv = (id) => {
    setConversations(p => p.filter(c => c.id !== id));
    if (activeId === id) {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      setLoading(false);
      setStreaming(false);
      activeRequestRef.current = null;
      setActiveId(conversations.filter(c => c.id !== id)[0]?.id || null);
    }
  };

  const pinConv = (id) => {
    setConversations(p => {
      const updated = p.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c);
      return [...updated.filter(c => c.pinned), ...updated.filter(c => !c.pinned)];
    });
  };

  const buildContext = () => {
    const pending = tasks.filter(t => t.status !== 'completed');
    const completed = tasks.filter(t => t.status === 'completed');
    const urgent = pending.filter(t => t.priority === 'urgent' || t.priority === 'high');
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = events.filter(e => e.start_date?.startsWith(today));
    const activeHabits = habits.filter(h => h.active !== false);
    const todayHabitDone = activeHabits.filter(h => h.completions?.some(c => c.date === today));

    return `=== ORAs APP LIVE DATA ===

TASKS (${tasks.length} total):
• Pending (${pending.length}): ${pending.slice(0, 10).map(t => `"${t.title}" [${t.priority}${t.due_date ? ', due ' + t.due_date : ''}]`).join(', ')}
• Urgent/High (${urgent.length}): ${urgent.slice(0, 5).map(t => `"${t.title}"`).join(', ')}
• Completed (${completed.length}): ${completed.slice(0, 5).map(t => `"${t.title}"`).join(', ')}

NOTES (${notes.length} total):
${notes.slice(0, 8).map(n => `• "${n.title}"${n.folder ? ' [' + n.folder + ']' : ''}${n.pinned ? ' [pinned]' : ''}`).join('\n')}

CALENDAR:
• Today's events (${todayEvents.length}): ${todayEvents.map(e => `"${e.title}" at ${e.start_date?.split('T')[1]?.slice(0,5) || 'all day'}`).join(', ')}
• Upcoming (${events.length} total): ${events.slice(0, 8).map(e => `"${e.title}" on ${e.start_date?.split('T')[0]}`).join(', ')}

FINANCE:
• Total income: $${income.toFixed(2)}
• Total expenses: $${expense.toFixed(2)}
• Balance: $${(income - expense).toFixed(2)}
• Recent transactions: ${transactions.slice(0, 6).map(t => `${t.title} ($${t.amount}, ${t.type})`).join(', ')}

HABITS (${activeHabits.length} active):
${activeHabits.map(h => `• ${h.name} — streak: ${h.current_streak || 0} days${todayHabitDone.find(d => d.id === h.id) ? ' ✓ done today' : ' ○ pending today'}`).join('\n')}

MEMORY ABOUT USER: ${memory || 'Nothing stored yet'}
TODAY: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
  };

  const execActions = async (content) => {
    const patterns = [
      { tag: 'CREATE_TASK', entity: 'Task', key: 'tasks', successMsg: 'Task created!' },
      { tag: 'CREATE_NOTE', entity: 'Note', key: 'notes', successMsg: 'Note created!' },
      { tag: 'CREATE_EVENT', entity: 'CalendarEvent', key: 'events', successMsg: 'Event scheduled!' },
      { tag: 'CREATE_TRANSACTION', entity: 'Transaction', key: 'transactions', successMsg: 'Transaction recorded!' },
      { tag: 'CREATE_HABIT', entity: 'Habit', key: 'habits', successMsg: 'Habit created!' },
    ];

    for (const p of patterns) {
      const matches = content.match(new RegExp(`\\[ACTION:${p.tag}:([^\\]]+)\\]`, 'g'));
      if (matches) {
        for (const m of matches) {
          try {
            const jsonStr = m.replace(`[ACTION:${p.tag}:`, '').slice(0, -1);
            const data = JSON.parse(jsonStr);
            await db.entities[p.entity].create(data);
            qc.invalidateQueries({ queryKey: [p.key] });
            toast.success(p.successMsg);
          } catch {}
        }
      }
    }

    // Handle UPDATE actions
    const updateMatches = content.match(/\[ACTION:UPDATE_([A-Z_]+):([^\]]+)\]/g);
    if (updateMatches) {
      for (const m of updateMatches) {
        const typeMatch = m.match(/\[ACTION:UPDATE_([A-Z_]+):([^\]]+)\]/);
        if (typeMatch) {
          const entityType = typeMatch[1];
          try {
            const data = JSON.parse(typeMatch[2]);
            const { id, ...updates } = data;
            const entityMap = { TASK: ['Task', 'tasks', tasks], NOTE: ['Note', 'notes', notes], EVENT: ['CalendarEvent', 'events', events], HABIT: ['Habit', 'habits', habits], TRANSACTION: ['Transaction', 'transactions', transactions] };
            const [entityName, queryKey, list] = entityMap[entityType] || [];
            if (entityName && list) {
              const item = list.find(t => t.id === id || (t.title && t.title.toLowerCase().includes(id?.toLowerCase())) || (t.name && t.name.toLowerCase().includes(id?.toLowerCase())));
              if (item) {
                await db.entities[entityName].update(item.id, updates);
                qc.invalidateQueries({ queryKey: [queryKey] });
                toast.success(`${entityType.charAt(0) + entityType.slice(1).toLowerCase().replace('_', ' ')} updated!`);
              }
            }
          } catch {}
        }
      }
    }

    // Handle DELETE actions — require confirmation
    const deleteMatches = content.match(/\[ACTION:DELETE_([A-Z]+):([^\]]+)\]/g);
    if (deleteMatches) {
      for (const m of deleteMatches) {
        const typeMatch = m.match(/\[ACTION:DELETE_([A-Z]+):([^\]]+)\]/);
        if (typeMatch) {
          const entityType = typeMatch[1];
          try {
            const data = JSON.parse(typeMatch[2]);
            setPendingDelete({ entity: entityType, id: data.id, title: data.title || data.name });
          } catch {}
        }
      }
    }

    return content
      .replace(/\[ACTION:CREATE_[A-Z_]+:[^\]]+\]/g, '')
      .replace(/\[ACTION:UPDATE_[A-Z_]+:[^\]]+\]/g, '')
      .replace(/\[ACTION:DELETE_[A-Z_]+:[^\]]+\]/g, '')
      .trim();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { entity, id } = pendingDelete;
    const entityMap = { TASK: ['Task', 'tasks'], NOTE: ['Note', 'notes'], EVENT: ['CalendarEvent', 'events'], HABIT: ['Habit', 'habits'], TRANSACTION: ['Transaction', 'transactions'] };
    const [entityName, queryKey] = entityMap[entity] || [];
    if (entityName) {
      try {
        await db.entities[entityName].delete(id);
        qc.invalidateQueries({ queryKey: [queryKey] });
        toast.success(`${entity.toLowerCase()} deleted`);
      } catch { toast.error('Delete failed'); }
    }
    setPendingDelete(null);
  };

  const send = async (text, isRetry = false) => {
    const msgText = (text || input).trim();
    if ((!msgText && attachments.length === 0) || loading) return;

    const attachmentContent = attachments.length > 0 ? `\n\n[Attachments: ${attachments.map(a => `${a.name} (${a.url})`).join(', ')}]` : '';
    const msg = msgText + attachmentContent;

    let cid = activeId;
    if (!cid) {
      const c = mkConv();
      setConversations(p => [c, ...p]);
      setActiveId(c.id);
      cid = c.id;
    }

    if (!navigator.onLine) {
      setConversations(p => p.map(c => c.id === cid ? {
        ...c,
        messages: [...c.messages, { role: 'user', content: msg }, { role: 'assistant', content: 'You appear to be offline. Please reconnect to the internet and try again.', isError: true }]
      } : c));
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setConversations(p => p.map(c => {
      if (c.id !== cid) return c;
      let newMsgs = [...c.messages];
      if (isRetry && newMsgs.length >= 2 && newMsgs[newMsgs.length - 1].isError) {
        newMsgs = newMsgs.slice(0, -2);
      } else if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].isError) {
        newMsgs = newMsgs.slice(0, -1);
      }
      return {
        ...c,
        messages: [...newMsgs, { role: 'user', content: msg }],
        title: newMsgs.length === 0 ? msg.slice(0, 44) : c.title,
      };
    }));
    
    setInput('');
    setAttachments([]);
    setLoading(true);
    setStreaming(false);
    const requestId = crypto.randomUUID?.() || `${Date.now()}`;
    activeRequestRef.current = requestId;

    const conv = conversations.find(c => c.id === cid);

    // Build OpenAI-format messages array
    const systemContent = `You are ORAs Intelligence, an incredibly powerful AI operating system embedded within the ORAs personal productivity app. You are not just a chatbot — you are an intelligent agent that can READ, UNDERSTAND, and ACT on all of the user's data.

IDENTITY: You are ORAs Intelligence. Warm, smart, proactive, and deeply integrated with ORAs.

YOUR CAPABILITIES (30+ actions):

DATA READING:
1. READ & SUMMARIZE all tasks, notes, events, finance, habits
2. SEARCH across any module by keyword
3. ANALYZE patterns (productivity, spending, habit streaks)
4. EXPLAIN any stored data in detail
5. CALCULATE finance totals, averages, trends

TASK MANAGEMENT:
6. CREATE: [ACTION:CREATE_TASK:{"title":"...","priority":"medium","status":"pending","due_date":"YYYY-MM-DD","description":"..."}]
7. COMPLETE TASK (tell user which task ID to mark done by referencing its title)
8. PRIORITIZE task suggestions based on urgency/due dates
9. GROUP tasks by project, priority, or date
10. SUGGEST daily task plan

NOTE MANAGEMENT:
11. CREATE: [ACTION:CREATE_NOTE:{"title":"...","content":"...","color":"default","folder":"","pinned":false}]
12. SEARCH notes by topic
13. SUMMARIZE note contents
14. DRAFT meeting notes, journals, brainstorms
15. SUGGEST note organization

CALENDAR & SCHEDULING:
16. CREATE EVENT: [ACTION:CREATE_EVENT:{"title":"...","start_date":"YYYY-MM-DDTHH:MM:SS","end_date":"YYYY-MM-DDTHH:MM:SS","color":"blue","location":"","all_day":false}]
17. VIEW schedule for any date
18. DETECT scheduling conflicts
19. SUGGEST optimal meeting times
20. CREATE recurring reminders

FINANCE:
21. LOG: [ACTION:CREATE_TRANSACTION:{"title":"...","amount":0,"type":"expense","category":"food","date":"YYYY-MM-DD","notes":""}]
22. ANALYZE spending by category
23. TRACK income vs expenses
24. BUDGET suggestions
25. IDENTIFY unusual spending

HABITS:
26. REVIEW habit streaks and gaps
27. SUGGEST habit improvements
28. CALCULATE habit completion rates
29. IDENTIFY best performing habits
30. CREATE HABIT: [ACTION:CREATE_HABIT:{"name":"...","color":"blue","frequency":"daily","target_count":1}]

DELETION (requires user confirmation — always ask first):
31. DELETE TASK: [ACTION:DELETE_TASK:{"id":"...","title":"..."}]
32. DELETE NOTE: [ACTION:DELETE_NOTE:{"id":"...","title":"..."}]
33. DELETE HABIT: [ACTION:DELETE_HABIT:{"id":"...","name":"...","title":"..."}]
34. DELETE EVENT: [ACTION:DELETE_EVENT:{"id":"...","title":"..."}]
35. UPDATE TASK STATUS: [ACTION:UPDATE_TASK:{"id":"...","status":"completed"}]
36. UPDATE OTHER ITEMS: [ACTION:UPDATE_NOTE:{"id":"...","title":"..."}], [ACTION:UPDATE_EVENT:{"id":"..."}], [ACTION:UPDATE_HABIT:{"id":"..."}], [ACTION:UPDATE_TRANSACTION:{"id":"..."}]

PLANNING & PRODUCTIVITY:
36. CREATE daily/weekly plans
37. MORNING briefing (tasks + events + habits for today)
38. WEEKLY review summary
39. GOAL setting advice
40. TIME BLOCKING suggestions

IMPORTANT: When you perform an action (create task/note/event/transaction), include the action tag in your response. It will be processed automatically and hidden from the user display. Then acknowledge what you did conversationally.

${buildContext()}

Respond in a warm, helpful, concise tone. Be specific about the user's actual data. When creating items, confirm what you created. If you learn something important about the user's preferences or life, end with [MEMORY:fact to remember].`;

    // Take last 10 non-error messages for context
    const historyMessages = (conv?.messages || [])
      .filter(m => !m.isError)
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    const aiMessages = [
      { role: 'system', content: systemContent },
      ...historyMessages,
      { role: 'user', content: msg },
    ];

    try {
      const aiResult = await invokeAI({
        messages: aiMessages,
        signal: abortControllerRef.current.signal,
      });
      const raw = aiResult.text;
      if (aiResult.provider) {
        toast.info(`Response generated by ${aiResult.provider}`);
      }

      if (activeRequestRef.current !== requestId) return;

      // Extract memory
      let content = raw;
      const memMatch = content.match(/\[MEMORY:([^\]]+)\]/);
      if (memMatch) {
        const fact = memMatch[1].trim();
        let updated = memory ? `${memory}; ${fact}` : fact;
        
        // Deduplicate and cap memory size
        const facts = Array.from(new Set(updated.split(';').map(s => s.trim()).filter(Boolean)));
        if (facts.length > 20) facts.splice(0, facts.length - 20); // Keep last 20 facts
        updated = facts.join('; ');
        
        setMemory(updated);
        save(MEMORY_KEY, updated);
        content = content.replace(/\[MEMORY:[^\]]+\]/g, '').trim();
      }

      // Execute actions
      const clean = await execActions(content);

      setStreaming(true);
      setConversations(p => p.map(c => c.id === cid ? {
        ...c, messages: [...c.messages, { role: 'assistant', content: clean }]
      } : c));
      
      // Use timeout and abort controllers to prevent getting stuck in loading state
      const streamDuration = clean.length * 9 + 300;
      const streamTimeout = setTimeout(() => {
        if (activeRequestRef.current === requestId) {
          setStreaming(false);
        }
      }, streamDuration);
      
      // Clear timeout if aborted
      abortControllerRef.current.signal.addEventListener('abort', () => {
        clearTimeout(streamTimeout);
        setStreaming(false);
      });
      
    } catch (err) {
      if (activeRequestRef.current !== requestId || err.name === 'AbortError') return;
      const message = err.message && !/failed to fetch/i.test(err.message)
        ? err.message
        : 'Could not reach any AI provider. Check your internet connection and API keys, then try again.';
      
      setConversations(p => p.map(c => c.id === cid ? {
        ...c, messages: [...c.messages, {
          role: 'assistant',
          content: message,
          isError: true
        }]
      } : c));
    } finally {
      if (activeRequestRef.current === requestId) {
        activeRequestRef.current = null;
        setLoading(false);
        if (abortControllerRef.current?.signal.aborted) {
          setStreaming(false);
        }
        // Do not setStreaming(false) here, as it's handled by the timeout above to allow the text stream effect
      }
    }
  };

  const filtered = conversations.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.messages.some(m => m.content.toLowerCase().includes(search.toLowerCase()))
  );
  const sorted = [...filtered.filter(c => c.pinned), ...filtered.filter(c => !c.pinned)];

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">

      {/* ─── Top bar ─── */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border/40 bg-background/80 backdrop-blur-xl flex-shrink-0 z-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="p-2 rounded-2xl hover:bg-muted transition-colors text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>

        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md shadow-primary/25 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight truncate">ORAs Intelligence</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{tasks.length} tasks · {notes.length} notes</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Model selector */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-2xl hover:bg-muted transition-colors text-muted-foreground border border-border/50"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium hidden sm:block">
                {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.label || 'Model'}
              </span>
              <ChevronUp className={cn('w-3 h-3 transition-transform', showModelPicker && 'rotate-180')} />
            </motion.button>
            <AnimatePresence>
              {showModelPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1.5 w-64 bg-card/95 backdrop-blur-2xl border border-border/60 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto pb-2"
                >
                  <div className="p-2 space-y-2">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1.5 bg-muted/30 rounded-lg mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Free Server Fallback</p>
                      {AVAILABLE_MODELS.map(m => (
                        <button key={m.id} onClick={() => { setSelectedModel(m.id); setShowModelPicker(false); toast.success(`Switched to ${m.label}`); }}
                          className={cn('w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors mb-0.5', selectedModel === m.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60')}>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">{m.label}</span>
                            <span className="text-xs text-muted-foreground">{m.desc}</span>
                          </div>
                          {m.badge && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">{m.badge}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={newChat}
            className="p-2.5 rounded-2xl hover:bg-muted transition-colors text-muted-foreground"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ─── Sidebar ─── */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="absolute inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden"
              />
              <motion.aside
                initial={{ x: -280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                className="absolute lg:relative z-30 w-64 h-full flex flex-col bg-card/95 backdrop-blur-2xl border-r border-border/50 shadow-2xl"
              >
                <div className="p-3 border-b border-border/40">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={newChat}
                    className="w-full flex items-center justify-center gap-2 h-9 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Chat
                  </motion.button>
                  <div className="relative mt-2.5">
                    <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats…" className="pl-7 h-7 text-[11px] rounded-xl bg-background/60" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                  {sorted.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-10">No conversations yet</p>}
                  {sorted.map(conv => (
                    <ConvItem key={conv.id} conv={conv} active={conv.id === activeId}
                      onSelect={(id) => switchChat(id)}
                      onRename={(id, t) => updateConv(id, c => ({ ...c, title: t }))}
                      onDelete={deleteConv} onPin={pinConv} />
                  ))}
                </div>
                {memory && (
                  <div className="p-3 border-t border-border/40">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Brain className="w-3 h-3 text-primary flex-shrink-0" />
                      <span className="truncate">AI remembers your preferences</span>
                    </div>
                  </div>
                )}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ─── Chat area ─── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center min-h-full pb-8 gap-8 text-center"
              >
                {/* Animated orb */}
                <motion.div
                  animate={{ scale: [1, 1.06, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="relative"
                >
                  <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary/30 via-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20 shadow-2xl shadow-primary/10">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent animate-pulse" />
                </motion.div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Hi, I'm ORAs Intelligence</h1>
                  <p className="text-muted-foreground text-sm mt-2 max-w-xs leading-relaxed">
                    Your ORAs AI — I can read, create, and manage your tasks, notes, calendar, finances, and habits.
                  </p>
                </div>

                {/* Prompt chips */}
                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                  {CHIPS.map((c, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.07, type: 'spring', stiffness: 300 }}
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => send(c.label)}
                      className="flex items-center gap-2.5 p-3 bg-card hover:bg-muted/60 border border-border/50 rounded-2xl text-left text-xs font-medium transition-all shadow-sm hover:shadow-md"
                    >
                      <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0', c.bg)}>
                        <c.icon className={cn('w-3.5 h-3.5', c.color)} />
                      </div>
                      <span className="leading-snug">{c.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <Bubble key={idx} msg={msg} isLatest={idx === messages.length - 1} isStreaming={streaming} 
                  onRegenerate={idx === messages.length - 1 && msg.role === 'assistant' ? () => send(messages[idx-1]?.content, true) : undefined} 
                />
              ))}
            </AnimatePresence>

            {loading && !streaming && <Typing />}
            <div ref={bottomRef} className="h-1" />
          </div>

          {/* ─── Floating Composer ─── */}
          <div className="flex-shrink-0 px-3 pb-4 pt-2">
            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt" className="hidden" onChange={async e => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  toast.loading(`Uploading ${file.name}...`, { id: 'upload' });
                  const res = await db.integrations.Core.UploadFile(file);
                  setAttachments(p => [...p, { name: file.name, url: res.file_url }]);
                  toast.success('File attached', { id: 'upload' });
                } catch(e) {
                  toast.error('Upload failed', { id: 'upload' });
                }
              }
              e.target.value = '';
            }} />
            
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 max-w-4xl mx-auto mb-2 px-1">
                {attachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-xl text-xs font-medium animate-in slide-in-from-bottom-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[120px]">{a.name}</span>
                    <button onClick={() => setAttachments(p => p.filter((_, idx) => idx !== i))} className="hover:bg-primary/20 p-0.5 rounded-full ml-1 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-end gap-2 max-w-4xl mx-auto">
              {/* Plus menu - Detached Floating Element */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    animate={focused ? { y: -4, scale: 1.01, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' } : { y: 0, scale: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
                    whileTap={{ scale: 0.85 }}
                    className="w-12 h-12 rounded-full backdrop-blur-xl bg-white/[0.04] border border-border/60 flex items-center justify-center hover:bg-primary/10 transition-all text-muted-foreground hover:text-primary flex-shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={12} className="w-48 rounded-2xl p-2 shadow-2xl border-border/50 bg-card/95 backdrop-blur-xl origin-bottom-left animate-in zoom-in-95 duration-200">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="rounded-xl py-2 cursor-pointer"><Camera className="w-4 h-4 mr-2" /> Camera</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="rounded-xl py-2 cursor-pointer"><ImagePlus className="w-4 h-4 mr-2" /> Images</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="rounded-xl py-2 cursor-pointer"><File className="w-4 h-4 mr-2" /> Files</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="rounded-xl py-2 cursor-pointer"><FileText className="w-4 h-4 mr-2" /> PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/scanner')} className="rounded-xl py-2 cursor-pointer"><ScanLine className="w-4 h-4 mr-2" /> Scanner</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Message Bar - Detached Floating Element */}
              <motion.div
                animate={focused ? { y: -4, scale: 1.01, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' } : { y: 0, scale: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
                className={cn(
                  'flex-1 backdrop-blur-xl bg-white/[0.04] border rounded-3xl px-4 py-3 transition-colors duration-300 flex items-center min-h-[48px]',
                  focused ? 'border-primary/50' : 'border-border/60'
                )}
              >
                <Textarea
                  ref={textareaRef}
                  placeholder="Ask ORAs Intelligence anything…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  className="min-h-[24px] max-h-[100px] resize-none bg-transparent border-0 focus-visible:ring-0 shadow-none text-sm flex-1 p-0 placeholder:text-muted-foreground/50"
                  rows={1}
                />
              </motion.div>

              {/* Send button - Detached Floating Element */}
              <motion.button
                animate={focused ? { y: -4, scale: 1.01, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' } : { y: 0, scale: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
                whileTap={{ scale: 0.85 }}
                whileHover={input.trim() && !loading ? { scale: 1.08 } : {}}
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0',
                  input.trim() && !loading
                    ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30'
                    : 'bg-muted/50 border border-border/60 backdrop-blur-xl text-muted-foreground cursor-not-allowed'
                )}
              >
                {loading ? <LoadingSpinner label="" size="sm" /> : <Send className="w-5 h-5 ml-0.5" />}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-base font-bold text-center mb-2">Delete {pendingDelete.entity?.toLowerCase()}?</h3>
              <p className="text-sm text-muted-foreground text-center mb-5">
                "{pendingDelete.title}" will be permanently deleted. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setPendingDelete(null)}
                  className="flex-1 h-10 rounded-2xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button onClick={confirmDelete}
                  className="flex-1 h-10 rounded-2xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
