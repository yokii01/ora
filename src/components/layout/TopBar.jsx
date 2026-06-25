import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Pencil, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import NotificationCenter from '@/components/shared/NotificationCenter';
import AIButton from '@/components/shared/AIButton';

export default React.memo(function TopBar({ onSearchOpen, onEditMode }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(3);
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="bg-background/70 backdrop-blur-2xl border-b border-border/40 w-full relative z-30">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6 gap-2">

        {/* Mobile: logo */}
        <div className="lg:hidden flex items-center flex-1 gap-2 min-w-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <span className="font-bold text-base tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">ORAs</span>
          </motion.div>
        </div>

        {/* Desktop search (fake input that navigates to /search) */}
        <div className="hidden lg:flex items-center flex-1 max-w-lg relative">
          <div 
            onClick={() => navigate('/search')}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl transition-all duration-300 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 hover:border-primary/30 cursor-pointer"
          >
            <Search className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            <div className="flex-1 bg-transparent text-sm text-muted-foreground/70 select-none">
              Search tasks, notes, files, vault...
            </div>
            <kbd className="text-[10px] bg-background/60 px-1.5 py-0.5 rounded border border-border/50 font-mono text-muted-foreground">⌘K</kbd>
          </div>

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
          {/* Mobile search icon */}
          <motion.button
            onClick={() => navigate('/search')}
            whileTap={{ scale: 0.95 }}
            className="lg:hidden w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted/80 active:bg-muted transition-colors relative overflow-hidden flex-shrink-0"
          >
            <Search className="w-[22px] h-[22px] text-muted-foreground" />
          </motion.button>

          {/* Mobile edit button on home */}
          {isHome && (
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
    </header>
  );
});