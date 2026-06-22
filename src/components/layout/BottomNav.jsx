import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, StickyNote, CheckSquare, Calendar, MoreHorizontal, Wallet, Target, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function BottomNav({ hidden = false }) {
  const location = useLocation();
  const [navItems, setNavItems] = React.useState(getNavItems);

  React.useEffect(() => {
    const handler = () => setNavItems(getNavItems());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <motion.nav
      className="lg:hidden fixed bottom-4 left-4 right-4"
      initial={false}
      animate={hidden ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 50 }}
      style={{ pointerEvents: hidden ? 'none' : 'auto', zIndex: 40 }}
    >
      <div
        className="relative flex items-center justify-around px-2 py-3 rounded-full shadow-2xl"
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(32px) saturate(2)',
          WebkitBackdropFilter: 'blur(32px) saturate(2)',
          border: '1px solid rgba(255,255,255,0.1)',
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
              className="relative flex items-center justify-center"
            >
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                className={cn(
                  'relative flex items-center justify-center rounded-full overflow-hidden transition-all duration-300',
                  isActive ? 'px-5 py-3 gap-2 shadow-[0_0_20px_rgba(var(--primary-rgb,99,102,241),0.4)]' : 'p-3 hover:bg-white/5'
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
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'rgba(var(--primary-rgb, 99 102 241) / 0.2)',
                      border: '1px solid rgba(var(--primary-rgb, 99 102 241) / 0.4)',
                      boxShadow: 'inset 0 0 10px rgba(var(--primary-rgb, 99 102 241) / 0.3)'
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}

                {/* Icon */}
                <motion.div
                  animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  className="relative z-10 flex-shrink-0"
                >
                  <Icon
                    className={cn(
                      'transition-colors duration-200',
                      isActive ? 'text-primary w-5 h-5 drop-shadow-[0_0_5px_rgba(var(--primary-rgb,99,102,241),0.8)]' : 'text-muted-foreground w-[22px] h-[22px]'
                    )}
                  />
                </motion.div>

                {/* Label — only when active */}
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0, width: 0, x: -6 }}
                      animate={{ opacity: 1, width: 'auto', x: 0 }}
                      exit={{ opacity: 0, width: 0, x: -6 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                      className="relative z-10 text-xs font-bold tracking-wide text-primary whitespace-nowrap overflow-hidden drop-shadow-[0_0_5px_rgba(var(--primary-rgb,99,102,241),0.6)]"
                    >
                      {item.label}
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
}
