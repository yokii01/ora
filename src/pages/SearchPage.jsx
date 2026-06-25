const db = globalThis.__B44_DB__ || { 
  entities: new Proxy({}, { 
    get: () => ({ list: async () => [], filter: async () => [], get: async () => null }) 
  }) 
};

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, X, Mic, CheckSquare, FileText, Calendar, Wallet, Lock, ArrowRight, ArrowLeft
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const SEARCH_MODULES = [
  { label: 'Tasks', icon: CheckSquare, color: 'text-blue-500', bg: 'bg-blue-500/10', path: '/tasks', entity: 'Task', field: 'title' },
  { label: 'Notes', icon: FileText, color: 'text-yellow-500', bg: 'bg-yellow-500/10', path: '/notes', entity: 'Note', field: 'title' },
  { label: 'Events', icon: Calendar, color: 'text-green-500', bg: 'bg-green-500/10', path: '/calendar', entity: 'CalendarEvent', field: 'title' },
  { label: 'Finance', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10', path: '/finance', entity: 'Transaction', field: 'title' },
  { label: 'Vault', icon: Lock, color: 'text-purple-500', bg: 'bg-purple-500/10', path: '/vault', entity: 'PasswordEntry', field: 'site_name' },
];

const QUICK_SUGGESTIONS = [
  { label: 'My tasks today', icon: CheckSquare, color: 'text-blue-500', path: '/tasks' },
  { label: 'Recent notes', icon: FileText, color: 'text-yellow-500', path: '/notes' },
  { label: 'Upcoming events', icon: Calendar, color: 'text-green-500', path: '/calendar' },
  { label: 'Finance overview', icon: Wallet, color: 'text-emerald-500', path: '/finance' },
  { label: 'Vault passwords', icon: Lock, color: 'text-purple-500', path: '/vault' },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Autofocus on mount
    if (inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, []);

  useEffect(() => {
    if (!query.trim()) { 
      setResults([]); 
      return; 
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const q = query.toLowerCase();
      const all = [];
      await Promise.all(SEARCH_MODULES.map(async (mod) => {
        try {
          const items = await db.entities[mod.entity].list('-updated_date', 20);
          const matched = items.filter(item => {
            const fields = [item[mod.field], item.title, item.content, item.description, item.notes, ...(item.tags || [])];
            return fields.some(f => typeof f === 'string' && f.toLowerCase().includes(q));
          });
          // Score: exact match > starts-with > contains
          const scored = matched.map(item => {
            const name = (item[mod.field] || item.title || '').toLowerCase();
            const score = name === q ? 3 : name.startsWith(q) ? 2 : 1;
            return { ...item, _module: mod, _score: score };
          });
          scored.forEach(item => all.push(item));
        } catch {}
      }));
      // Sort by score descending, limit to 20
      all.sort((a, b) => b._score - a._score);
      setResults(all.slice(0, 20));
      setLoading(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (path) => {
    navigate(path);
  };

  const ResultItem = ({ item, index }) => {
    const Icon = item._module.icon;
    return (
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, duration: 0.2 }}
        onClick={() => handleSelect(item._module.path)}
        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-card/60 active:bg-card transition-colors border border-transparent hover:border-border/50 text-left group"
      >
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105", item._module.bg)}>
          <Icon className={cn("w-6 h-6", item._module.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-foreground truncate">
            {item[item._module.field] || item.title || 'Untitled'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full bg-background border border-border/50", item._module.color)}>
              {item._module.label}
            </span>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
      </motion.button>
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-sans selection:bg-primary/30 flex flex-col">
      {/* Background Ambience */}
      <div className="absolute top-0 inset-x-0 h-[500px] pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute top-20 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 pt-12 pb-24">
        
        {/* Header / Search Input */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="sticky top-6 z-20"
        >
          <div className="flex items-center gap-3 mb-8">
            <button 
              onClick={() => navigate(-1)} 
              className="w-10 h-10 rounded-full bg-card/80 backdrop-blur-xl border border-border/50 shadow-sm flex items-center justify-center text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight">Search</h1>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-primary/5 rounded-[24px] blur-xl transition-all duration-500 group-focus-within:bg-primary/20 opacity-100" />
            <div className="relative flex items-center bg-card/80 backdrop-blur-2xl border border-border/60 rounded-[24px] overflow-hidden transition-all duration-300 group-focus-within:border-primary/50 group-focus-within:shadow-[0_0_0_4px_hsl(var(--primary)/0.1)] shadow-xl">
              <Search className="w-6 h-6 text-muted-foreground ml-5 group-focus-within:text-primary transition-colors shrink-0" />
              <Input 
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks, notes, files, vault..." 
                className="w-full h-16 bg-transparent border-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground text-lg px-4"
              />
              {query && (
                <button onClick={() => setQuery('')} className="mr-2 p-2 hover:bg-muted rounded-full transition-colors shrink-0">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
              <div className="flex items-center gap-1 pr-3 shrink-0">
                <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                  <Mic className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results Area */}
        <div className="flex-1 mt-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 flex flex-col items-center justify-center gap-4 text-muted-foreground"
              >
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm font-medium">Searching across modules...</p>
              </motion.div>
            ) : query && results.length === 0 ? (
              <motion.div 
                key="no-results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="py-20 flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No results found</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  We couldn't find anything matching "{query}". Try checking your spelling or using different keywords.
                </p>
              </motion.div>
            ) : query && results.length > 0 ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-1"
              >
                <div className="flex items-center justify-between px-2 mb-2">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top Results</h2>
                  <span className="text-xs text-muted-foreground font-medium">{results.length} found</span>
                </div>
                <div className="space-y-1">
                  {results.map((r, i) => (
                    <ResultItem key={`${r._module.entity}-${r.id || i}`} item={r} index={i} />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="suggestions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-3">Categories</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {SEARCH_MODULES.map((mod, i) => (
                      <button 
                        key={mod.label} 
                        onClick={() => handleSelect(mod.path)}
                        className="flex flex-col gap-3 p-4 rounded-2xl bg-card/40 border border-border/40 hover:bg-card hover:border-border/80 transition-all text-left"
                      >
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", mod.bg)}>
                          <mod.icon className={cn("w-5 h-5", mod.color)} />
                        </div>
                        <span className="font-medium text-sm text-foreground">{mod.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-3 mt-4">Quick Actions</h2>
                  <div className="space-y-1">
                    {QUICK_SUGGESTIONS.map((s, i) => {
                      const Icon = s.icon;
                      const mod = SEARCH_MODULES.find(m => m.path === s.path);
                      return (
                        <button
                          key={s.label}
                          onClick={() => handleSelect(s.path)}
                          className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-card/60 transition-colors text-left group"
                        >
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", mod?.bg)}>
                            <Icon className={cn("w-5 h-5", s.color)} />
                          </div>
                          <span className="text-base font-medium text-foreground/90 flex-1">{s.label}</span>
                          <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
