const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Pencil, X, FileText, CheckSquare, Calendar, Wallet, Lock, ArrowRight, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import NotificationCenter from '@/components/shared/NotificationCenter';
import AIButton from '@/components/shared/AIButton';

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

export default React.memo(function TopBar({ onSearchOpen, onEditMode }) {
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [desktopFocused, setDesktopFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(3);
  const mobileInputRef = useRef(null);
  const desktopInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    if (searchActive) {
      setTimeout(() => mobileInputRef.current?.focus(), 150);
    }
  }, [searchActive]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const q = query.toLowerCase();
      const all = [];
      await Promise.all(SEARCH_MODULES.map(async (mod) => {
        try {
          const items = await db.entities[mod.entity].list('-updated_date', 20);
          const matched = items.filter(item => {
            const fields = [item[mod.field], item.title, item.content, item.description, item.notes, ...(item.tags || [])];
            return fields.some(f => f?.toLowerCase().includes(q));
          });
          // Score: exact title match > starts-with > contains
          const scored = matched.map(item => {
            const name = (item[mod.field] || item.title || '').toLowerCase();
            const score = name === q ? 3 : name.startsWith(q) ? 2 : 1;
            return { ...item, _module: mod, _score: score };
          });
          scored.forEach(item => all.push(item));
        } catch {}
      }));
      // Sort by score descending, limit to 10
      all.sort((a, b) => b._score - a._score);
      setResults(all.slice(0, 10));
      setLoading(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (path) => {
    navigate(path);
    setQuery('');
    setSearchActive(false);
    setDesktopFocused(false);
    setResults([]);
  };

  const closeSearch = () => {
    setSearchActive(false);
    setQuery('');
    setResults([]);
  };

  const showDropdown = desktopFocused && (query || loading || !query);

  return (
    <>
      <header className="bg-background/70 backdrop-blur-2xl border-b border-border/40 w-full relative z-30">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6 gap-2">

          {/* Mobile: logo or expanded search */}
          <div className="lg:hidden flex items-center flex-1 gap-2 min-w-0">
            <AnimatePresence mode="wait">
              {!searchActive ? (
                <motion.div
                  key="logo"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2"
                >
                  <span className="font-bold text-base tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">ORAs</span>
                </motion.div>
              ) : (
                <motion.div
                  key="search-bar"
                  initial={{ opacity: 0, scaleX: 0.7, x: 20 }}
                  animate={{ opacity: 1, scaleX: 1, x: 0 }}
                  exit={{ opacity: 0, scaleX: 0.7, x: 20 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="flex-1 flex items-center gap-2 bg-card/90 backdrop-blur-xl border border-primary/30 rounded-2xl px-3 py-2 shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]"
                >
                  <Search className="w-4 h-4 text-primary flex-shrink-0" />
                  <input
                    ref={mobileInputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search everything..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="p-0.5 rounded-full hover:bg-muted">
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop search */}
          <div className="hidden lg:flex items-center flex-1 max-w-lg relative">
            <motion.div animate={{ width: desktopFocused ? '100%' : '100%' }} className="relative w-full">
              <div className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl transition-all duration-300 ${
                desktopFocused
                  ? 'bg-card/90 backdrop-blur-xl border border-primary/30 shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]'
                  : 'bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 hover:border-primary/20'
              }`}>
                <Search className={`w-4 h-4 flex-shrink-0 transition-colors ${desktopFocused ? 'text-primary' : 'text-muted-foreground'}`} />
                <input
                  ref={desktopInputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onFocus={() => setDesktopFocused(true)}
                  onBlur={() => setTimeout(() => { setDesktopFocused(false); if (!query) setResults([]); }, 200)}
                  placeholder="Search tasks, notes, files, vault..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                />
                {query
                  ? <button onClick={() => { setQuery(''); setResults([]); }} className="p-0.5 rounded-md hover:bg-muted"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  : <kbd className="text-[10px] bg-background/60 px-1.5 py-0.5 rounded border border-border/50 font-mono text-muted-foreground">⌘K</kbd>
                }
              </div>

              {/* Desktop dropdown */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 left-0 right-0 bg-card/95 backdrop-blur-2xl border border-border/60 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[40vh] overflow-y-auto"
                  >
                    {loading && <div className="p-3 text-center text-xs text-muted-foreground">Searching...</div>}
                    {!loading && results.length === 0 && query && <div className="p-4 text-center text-sm text-muted-foreground">No results for "{query}"</div>}
                    {!loading && results.length > 0 && (
                      <div className="py-1">
                        {results.map((r, i) => {
                          const Icon = r._module.icon;
                          return (
                            <button key={i} onClick={() => handleSelect(r._module.path)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left">
                              <div className={`w-7 h-7 rounded-lg ${r._module.bg} flex items-center justify-center flex-shrink-0`}>
                                <Icon className={`w-3.5 h-3.5 ${r._module.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{r[r._module.field] || r.title || 'Untitled'}</p>
                                <p className="text-[10px] text-muted-foreground">{r._module.label}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {!query && !loading && (
                      <div className="p-3 space-y-1">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Quick access</p>
                        {QUICK_SUGGESTIONS.map(s => {
                          const Icon = s.icon;
                          return (
                            <button key={s.label} onClick={() => handleSelect(s.path)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/60 transition-colors text-left">
                              <div className={`w-7 h-7 rounded-lg ${SEARCH_MODULES.find(m => m.path === s.path)?.bg} flex items-center justify-center flex-shrink-0`}>
                                <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                              </div>
                              <span className="text-sm text-foreground/80">{s.label}</span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground ml-auto" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {isHome && (
              <motion.button
                onClick={onEditMode}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Customize Home"
                className="ml-2 w-12 h-12 flex flex-shrink-0 items-center justify-center rounded-full bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 hover:border-primary/30 hover:bg-primary/5 active:scale-95 transition-all text-muted-foreground hover:text-primary overflow-hidden relative"
              >
                <Pencil className="w-[22px] h-[22px]" />
              </motion.button>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Mobile search / Done toggle */}
            <AnimatePresence mode="wait">
              {!searchActive ? (
                <motion.button
                  key="search-btn"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchActive(true)}
                  whileTap={{ scale: 0.95 }}
                  className="lg:hidden w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted/80 active:bg-muted transition-colors relative overflow-hidden flex-shrink-0"
                >
                  <Search className="w-[22px] h-[22px] text-muted-foreground" />
                </motion.button>
              ) : (
                <motion.button
                  key="close-btn"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={closeSearch}
                  whileTap={{ scale: 0.95 }}
                  className="lg:hidden w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted/80 active:bg-muted transition-colors relative overflow-hidden flex-shrink-0"
                >
                  <X className="w-[22px] h-[22px] text-muted-foreground" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Mobile edit button on home */}
            {isHome && !searchActive && (
              <motion.button
                onClick={onEditMode}
                whileTap={{ scale: 0.95 }}
                className="lg:hidden w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted/80 active:bg-muted transition-colors text-muted-foreground relative overflow-hidden flex-shrink-0"
                title="Customize"
              >
                <Pencil className="w-[22px] h-[22px]" />
              </motion.button>
            )}

            <AIButton />

            <div className="relative">
              <motion.button
                onClick={() => setNotifOpen(!notifOpen)}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted/80 active:bg-muted transition-colors relative overflow-hidden flex-shrink-0"
              >
                <Bell className="w-[22px] h-[22px] text-muted-foreground" />
                <AnimatePresence>
                  {notifCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      className="absolute top-[8px] right-[8px] min-w-[17px] h-[17px] bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none"
                    >
                      {notifCount > 8 ? '8+' : notifCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
              <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} onCountChange={setNotifCount} />
            </div>

            <motion.button
              onClick={() => navigate('/settings')}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted/80 active:bg-muted transition-colors relative overflow-hidden flex-shrink-0"
            >
              <Settings className="w-[22px] h-[22px] text-muted-foreground" />
            </motion.button>
          </div>
        </div>

        {/* Mobile search dropdown panel */}
        <AnimatePresence>
          {searchActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className="overflow-hidden border-t border-border/30"
            >
              <div className="max-h-[28vh] overflow-y-auto bg-background/95 backdrop-blur-2xl">
                {loading && <div className="p-3 text-center text-xs text-muted-foreground">Searching...</div>}
                {!loading && results.length === 0 && query && (
                  <div className="p-4 text-center text-sm text-muted-foreground">No results for "{query}"</div>
                )}
                {!loading && results.length > 0 && (
                  <div className="py-1.5 px-2">
                    {results.map((r, i) => {
                      const Icon = r._module.icon;
                      return (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => handleSelect(r._module.path)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors text-left"
                        >
                          <div className={`w-7 h-7 rounded-lg ${r._module.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-3.5 h-3.5 ${r._module.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{r[r._module.field] || r.title || 'Untitled'}</p>
                            <p className="text-[10px] text-muted-foreground">{r._module.label}</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
                {!query && !loading && (
                  <div className="py-2 px-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">Quick access</p>
                    {QUICK_SUGGESTIONS.map((s, i) => {
                      const Icon = s.icon;
                      const mod = SEARCH_MODULES.find(m => m.path === s.path);
                      return (
                        <motion.button
                          key={s.label}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => handleSelect(s.path)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors text-left"
                        >
                          <div className={`w-7 h-7 rounded-lg ${mod?.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                          </div>
                          <span className="text-sm text-foreground/80 flex-1">{s.label}</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
});