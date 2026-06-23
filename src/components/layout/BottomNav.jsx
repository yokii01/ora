import React, { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, StickyNote, CheckSquare, Calendar, MoreHorizontal, Wallet, Target, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeyboardViewport } from '@/hooks/useKeyboardViewport';

const ICON_MAP = { Home, StickyNote, CheckSquare, Calendar, MoreHorizontal, Wallet, Target, Sparkles };
const NAV_KEY = 'oras_bottom_nav_items';
const ALL_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/notes', icon: StickyNote, label: 'Notes' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/finance', icon: Wallet, label: 'Finance' },
  { path: '/habits', icon: Target, label: 'Habito' },
  { path: '/assistant', icon: Sparkles, label: 'AI' },
  { path: '/more', icon: MoreHorizontal, label: 'More' },
];

function getNavItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(NAV_KEY) || 'null');
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved.map(path => ALL_ITEMS.find(i => i.path === path)).filter(Boolean);
    }
  } catch {}
  return ALL_ITEMS.filter(i => ['/', '/notes', '/tasks', '/calendar', '/more'].includes(i.path));
}

const BottomNav = memo(({ hidden = false }) => {
  const location = useLocation();
  const [navItems, setNavItems] = React.useState(getNavItems);
  const isKeyboardOpen = useKeyboardViewport();

  React.useEffect(() => {
    const handler = () => setNavItems(getNavItems());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const shouldHide = hidden || isKeyboardOpen;

  return (
    <motion.nav
      className="lg:hidden fixed left-4 right-4 z-40"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)',
        pointerEvents: shouldHide ? 'none' : 'auto'
      }}
      initial={false}
      animate={shouldHide ? { opacity: 0, y: 32 } : { opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
    >
      <div
        className="relative flex items-center justify-between px-2 h-[68px] rounded-full shadow-2xl gpu-accelerated overflow-hidden"
        style={{
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(32px) saturate(2)',
          WebkitBackdropFilter: 'blur(32px) saturate(2)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path === '/more' && ['/finance', '/files', '/scanner', '/vault', '/habits', '/assistant', '/settings', '/climora', '/oradocs', '/routo', '/festo', '/news'].includes(location.pathname));

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex-1 flex items-center justify-center h-full min-w-[48px]"
              style={{ touchAction: 'manipulation' }}
            >
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                className={cn(
                  'relative flex items-center justify-center rounded-full transition-all duration-300',
                  isActive ? 'px-4 h-[44px] gap-1.5 shadow-[0_0_20px_rgba(var(--primary-rgb,99,102,241),0.4)]' : 'w-[44px] h-[44px] hover:bg-white/5'
                )}
                style={isActive ? {
                  background: 'rgba(var(--primary-rgb, 99 102 241) / 0.15)',
                  border: '1px solid rgba(var(--primary-rgb, 99 102 241) / 0.3)',
                } : {}}
              >
                {/* Active pill bg */}
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 rounded-full gpu-accelerated"
                    style={{
                      background: 'rgba(var(--primary-rgb, 99 102 241) / 0.2)',
                      border: '1px solid rgba(var(--primary-rgb, 99 102 241) / 0.4)',
                      boxShadow: 'inset 0 0 10px rgba(var(--primary-rgb, 99 102 241) / 0.3)'
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}

                {/* Icon */}
                <motion.div
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="relative z-10 flex-shrink-0 flex items-center justify-center w-[24px] h-[24px]"
                >
                  <Icon
                    className={cn(
                      'transition-colors duration-200',
                      isActive ? 'text-primary drop-shadow-[0_0_5px_rgba(var(--primary-rgb,99,102,241),0.8)]' : 'text-muted-foreground'
                    )}
                    size={22}
                  />
                </motion.div>

                {/* Label — only when active */}
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      className="relative z-10 text-[11px] font-bold tracking-wide text-primary whitespace-nowrap overflow-hidden drop-shadow-[0_0_5px_rgba(var(--primary-rgb,99,102,241),0.6)]"
                    >
                      <span className="pl-0.5">{item.label}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
});

export default BottomNav;
