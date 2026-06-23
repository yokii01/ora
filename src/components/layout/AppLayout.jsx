import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import TopBar from './TopBar';
import CommandPalette from '@/components/shared/CommandPalette';
import { useReminders } from '@/hooks/useReminders';

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
  const SWIPE_PAGES = ['/', '/notes', '/tasks', '/calendar', '/finance'];

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
        <AnimatePresence mode="popLayout">
          {!hideChrome && isHome && (
            <motion.div
              key="topbar"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="sticky top-0 z-40 transform-gpu will-change-transform"
            >
              <TopBar
                onSearchOpen={() => setSearchOpen(true)}
                onEditMode={() => setEditModeOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <main className={`flex-1 overflow-hidden ${hideChrome ? '' : 'pb-28 lg:pb-6'}`}>
          {isAssistant ? (
            <Outlet context={{ editModeOpen, setEditModeOpen }} />
          ) : (
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className={isClimora || isRouto ? 'w-full h-full gpu-accelerated' : 'p-4 lg:p-6 max-w-7xl mx-auto w-full h-full gpu-accelerated'}
              drag={isClimora || isRouto || fullscreenOverlayOpen ? false : 'x'}
              dragDirectionLock
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              whileTap={{ cursor: 'grabbing' }}
              style={{ touchAction: 'pan-y' }}
            >
              <Outlet context={{ editModeOpen, setEditModeOpen }} />
            </motion.div>
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
