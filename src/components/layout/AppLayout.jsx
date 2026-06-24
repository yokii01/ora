import React, { Suspense, useEffect, useState, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
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

  // Pages that participate in swipe navigation (in order)
  const SWIPE_PAGES = ['/', '/notes', '/tasks', '/calendar', '/finance', '/habits'];

  const getPageIndex = (pathname) => {
    const idx = SWIPE_PAGES.findIndex(p => pathname === p || pathname.startsWith(p + '/'));
    return idx;
  };

  const currentIndex = getPageIndex(location.pathname);

  const goToIndex = (idx) => {
    if (idx < 0 || idx >= SWIPE_PAGES.length) return;
    const target = SWIPE_PAGES[idx];
    navigate(target);
  };

  const handleDragStart = (event) => {
    dragStartX.current = event?.clientX || 0;
    isDragging.current = true;
  };

  const handleDragEnd = (event, info) => {
    isDragging.current = false;
    const dx = info.offset.x;
    const vx = info.velocity.x || 0;
    const absDx = Math.abs(dx);
    const minDistance = 100; // px
    const minVelocity = 600; // px/s
    const edgeMargin = 28; // px to ignore edge swipes

    const startX = dragStartX.current;
    const width = window.innerWidth || 1;
    if (startX <= edgeMargin || startX >= width - edgeMargin) return; // ignore edge swipes

    // Determine current index
    const idx = getPageIndex(location.pathname);
    if (idx === -1) return;

    // Left swipe (dx < 0) -> next page
    if (dx < -minDistance || (dx < 0 && Math.abs(vx) > minVelocity)) {
      goToIndex(idx + 1);
      if (navigator.vibrate) navigator.vibrate(8);
      return;
    }
    // Right swipe (dx > 0) -> previous page
    if (dx > minDistance || (dx > 0 && Math.abs(vx) > minVelocity)) {
      goToIndex(idx - 1);
      if (navigator.vibrate) navigator.vibrate(8);
      return;
    }
    // Otherwise let framer-motion snap back
  };

  return (
    <div className="min-h-screen bg-background">
      {!hideChrome && <Sidebar />}
      <div className={!hideChrome ? 'lg:pl-[240px] flex flex-col min-h-screen' : 'flex flex-col min-h-screen'}>
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
        <main className={`flex-1 overflow-hidden relative ${hideChrome ? '' : 'pb-[calc(env(safe-area-inset-bottom,16px)+80px)] lg:pb-6'}`}>
          {isAssistant ? (
            <Outlet context={{ editModeOpen, setEditModeOpen }} />
          ) : (
            <>
              {/* For persistent tabs, we do NOT use AnimatePresence with location key, 
                  because that forces a full remount. PersistentTabs handles its own internal visibility. */}
              {currentIndex !== -1 ? (
                <motion.div
                  className="p-4 lg:p-6 max-w-7xl mx-auto w-full h-full gpu-accelerated absolute inset-0"
                  drag={fullscreenOverlayOpen ? false : 'x'}
                  dragDirectionLock
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.15}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  style={{ touchAction: 'pan-y', backfaceVisibility: 'hidden' }}
                >
                  <PersistentTabs context={{ editModeOpen, setEditModeOpen }} />
                </motion.div>
              ) : (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeInOut' }}
                    className={isClimora || isRouto ? 'w-full h-full gpu-accelerated absolute inset-0 bg-background' : 'p-4 lg:p-6 max-w-7xl mx-auto w-full h-full gpu-accelerated absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar bg-background'}
                    drag={isClimora || isRouto || fullscreenOverlayOpen ? false : 'x'}
                    dragDirectionLock
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.15}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    style={{ touchAction: 'pan-y', backfaceVisibility: 'hidden' }}
                  >
                    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
                      <Outlet context={{ editModeOpen, setEditModeOpen }} />
                    </Suspense>
                  </motion.div>
                </AnimatePresence>
              )}
            </>
          )}
        </main>
      </div>
      {!hideChrome && <BottomNav hidden={editModeOpen} />}
      {/* Page indicator above bottom nav */}
      {!hideChrome && currentIndex !== -1 && (
        <div className="fixed left-0 right-0 bottom-20 flex items-center justify-center pointer-events-none z-50">
          <div className="flex items-center gap-2 bg-transparent px-2 py-1 rounded-full">
            {SWIPE_PAGES.map((p, i) => (
              <motion.div
                key={p}
                animate={currentIndex === i ? { scale: 1.15, opacity: 1 } : { scale: 1, opacity: 0.45 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="w-2 h-2 rounded-full"
                style={{ background: currentIndex === i ? 'var(--primary)' : 'rgba(255,255,255,0.12)' }}
              />
            ))}
          </div>
        </div>
      )}
      {!hideChrome && <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />}
    </div>
  );
}
