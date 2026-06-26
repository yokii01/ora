import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, StickyNote, CheckSquare, Calendar, Wallet,
  FolderOpen, ScanLine, Lock, Target, Sparkles,
  ChevronLeft, ChevronRight, Settings, CloudSun, FileText, Map } from
'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
{ path: '/', icon: Home, label: 'Home' },
{ path: '/notes', icon: StickyNote, label: 'Notes' },
{ path: '/tasks', icon: CheckSquare, label: 'Tasks' },
{ path: '/calendar', icon: Calendar, label: 'Calendar' },
{ path: '/finance', icon: Wallet, label: 'Finance' },
{ path: '/files', icon: FolderOpen, label: 'Files' },
{ path: '/scanner', icon: ScanLine, label: 'Scanner' },
{ path: '/oradocs', icon: FileText, label: 'ORADOCS' },
{ path: '/routo', icon: Map, label: 'ROUTO' },
{ path: '/weather', icon: CloudSun, label: 'Weather' },
{ path: '/vault', icon: Lock, label: 'Vault' },
{ path: '/habits', icon: Target, label: 'Habits' }];

const bottomItems = [
{ path: '/assistant', icon: Sparkles, label: 'AI Assistant' },
{ path: '/settings', icon: Settings, label: 'Settings' }];

const Sidebar = React.memo(function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="hidden lg:flex flex-col h-screen bg-card border-r border-border fixed left-0 top-0 z-40">
      
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-border">
        <AnimatePresence mode="wait">
          {!collapsed &&
          <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shadow-primary/30 flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">ORAs</span>
          </motion.div>
          }
        </AnimatePresence>
        {collapsed &&
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto shadow-sm shadow-primary/30">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
        }
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 bg-card border shadow-sm p-1.5 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors z-20 touch-target-safe"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive ?
                "bg-primary/10 text-primary font-medium" :
                "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
              
              {isActive &&
              <motion.div
                layoutId="sidebar-active"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full"
                transition={{ type: "spring", stiffness: 380, damping: 30 }} />

              }
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {!collapsed &&
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm whitespace-nowrap overflow-hidden">
                  
                    {item.label}
                  </motion.span>
                }
              </AnimatePresence>
            </Link>);

        })}
      </nav>

      {/* Bottom Items */}
      <div className="py-3 px-2 border-t border-border space-y-1">
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive ?
                "bg-primary/10 text-primary font-medium" :
                "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
              
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {!collapsed &&
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm whitespace-nowrap">
                  
                    {item.label}
                  </motion.span>
                }
              </AnimatePresence>
            </Link>);

        })}
      </div>
    </motion.aside>
  );
});

export default Sidebar;
