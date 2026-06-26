import React, { Suspense, useEffect, useState, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import CommandPalette from '@/components/shared/CommandPalette';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { useReminders } from '@/hooks/useReminders';
import PersistentTabs from './PersistentTabs';

export default function AppLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [editModeOpen, setEditModeOpen] = useState(false);
  const [fullscreenOverlayOpen, setFullscreenOverlayOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
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

  const TABS_PATHS = ['/', '/notes', '/tasks', '/calendar', '/finance', '/habits'];
  const isTab = TABS_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  useEffect(() => {
    const handler = (event) => setFullscreenOverlayOpen(Boolean(event.detail?.open));
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('oras-fullscreen-overlay', handler);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('oras-fullscreen-overlay', handler);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const currentIndex = isTab ? 0 : -1;

  return (
    <div className="min-h-screen bg-background">
      {!hideChrome && <Sidebar />}
      <div className={!hideChrome ? 'lg:pl-[240px] flex flex-col min-h-screen' : 'flex flex-col min-h-screen'}>
        <AnimatePresence>
          {isOffline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500/90 text-white text-xs font-medium py-1.5 px-4 text-center z-[100] relative flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.82"/></svg>
              You are currently offline. Viewing cached data.
            </motion.div>
          )}
        </AnimatePresence>
        {!isHome && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className={`fixed top-4 z-[90] w-10 h-10 rounded-full bg-card/80 backdrop-blur-xl border border-border/50 shadow-lg flex items-center justify-center text-foreground hover:bg-muted transition-colors ${!hideChrome ? 'left-4 lg:left-[256px]' : 'left-4'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left w-6 h-6"><path d="m15 18-6-6 6-6"/></svg>
          </motion.button>
        )}

        <main className={`flex-1 overflow-hidden relative ${hideChrome ? '' : 'pb-[env(safe-area-inset-bottom,16px)] lg:pb-6'}`}>
          {isAssistant ? (
            <ErrorBoundary>
              <Outlet context={{ editModeOpen, setEditModeOpen }} />
            </ErrorBoundary>
          ) : (
            <>
              {/* Always render PersistentTabs to prevent unmount crashes, just hide it if not on a tab route */}
              <div 
                className={`p-4 lg:p-6 ${!isHome ? 'pt-16 sm:pt-20' : ''} max-w-7xl mx-auto w-full h-full gpu-accelerated absolute inset-0 transition-opacity duration-300`} 
                style={{ 
                  visibility: isTab ? 'visible' : 'hidden', 
                  opacity: isTab ? 1 : 0, 
                  pointerEvents: isTab ? 'auto' : 'none' 
                }}
              >
                <ErrorBoundary>
                  <PersistentTabs context={{ editModeOpen, setEditModeOpen }} />
                </ErrorBoundary>
              </div>
              
              {/* Render Outlet for non-tab routes */}
              {!isTab && (
                <div className={isClimora || isRouto ? 'w-full h-full gpu-accelerated absolute inset-0 bg-background z-20' : `p-4 lg:p-6 ${!isHome ? 'pt-16 sm:pt-20' : ''} max-w-7xl mx-auto w-full h-full gpu-accelerated absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar bg-background z-20`}>
                  <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
                    <ErrorBoundary>
                      <Outlet context={{ editModeOpen, setEditModeOpen }} />
                    </ErrorBoundary>
                  </Suspense>
                </div>
              )}
            </>
          )}
        </main>
        {!hideChrome && <BottomNav />}
      </div>
      {!hideChrome && <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />}
    </div>
  );
}
