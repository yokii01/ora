import React, { Suspense, useEffect, useState, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import CommandPalette from '@/components/shared/CommandPalette';
import { useReminders } from '@/hooks/useReminders';
import PersistentTabs from './PersistentTabs';

export default function AppLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [editModeOpen, setEditModeOpen] = useState(false);
  const [fullscreenOverlayOpen, setFullscreenOverlayOpen] = useState(false);
  useReminders();
  const location = useLocation();
  const navigate = useNavigate();
  const dragStartX = useRef(0);
  const isDragging = useRef(false);
  const isHome = location.pathname === '/';
  const isAssistant = location.pathname === '/assistant';
  const isClimora = location.pathname.startsWith('/climora');
  const isRouto = location.pathname.startsWith('/routo');
  const hideChrome = isAssistant || isClimora || isRouto || fullscreenOverlayOpen;

  useEffect(() => {
    const handler = (event) => setFullscreenOverlayOpen(Boolean(event.detail?.open));
    window.addEventListener('oras-fullscreen-overlay', handler);
    return () => window.removeEventListener('oras-fullscreen-overlay', handler);
  }, []);

  const currentIndex = location.pathname === '/' ? 0 : -1;

  return (
    <div className="min-h-screen bg-background">
      {!hideChrome && <Sidebar />}
      <div className={!hideChrome ? 'lg:pl-[240px] flex flex-col min-h-screen' : 'flex flex-col min-h-screen'}>
        {!hideChrome && !isHome && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="fixed top-4 left-4 z-[90] w-10 h-10 rounded-full bg-card/80 backdrop-blur-xl border border-border/50 shadow-lg flex items-center justify-center text-foreground hover:bg-muted transition-colors lg:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left w-6 h-6"><path d="m15 18-6-6 6-6"/></svg>
          </motion.button>
        )}
        <AnimatePresence>
          {!hideChrome && isHome && (
            <motion.div
              key="topbar"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed top-0 left-0 right-0 z-40 lg:pl-[240px] transform-gpu will-change-transform pointer-events-auto"
            >
              <TopBar
                onSearchOpen={() => setSearchOpen(true)}
                onEditMode={() => setEditModeOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <main className={`flex-1 overflow-hidden relative ${hideChrome ? '' : 'pb-[env(safe-area-inset-bottom,16px)] lg:pb-6'}`}>
          {isAssistant ? (
            <Outlet context={{ editModeOpen, setEditModeOpen }} />
          ) : (
            <>
              {currentIndex !== -1 ? (
                <div className="p-4 lg:p-6 max-w-7xl mx-auto w-full h-full gpu-accelerated absolute inset-0">
                  <PersistentTabs context={{ editModeOpen, setEditModeOpen }} />
                </div>
              ) : (
                <div className={isClimora || isRouto ? 'w-full h-full gpu-accelerated absolute inset-0 bg-background' : 'p-4 lg:p-6 max-w-7xl mx-auto w-full h-full gpu-accelerated absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar bg-background'}>
                  <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
                    <Outlet context={{ editModeOpen, setEditModeOpen }} />
                  </Suspense>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      {!hideChrome && <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />}
    </div>
  );
}
