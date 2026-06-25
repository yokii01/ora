import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet, FolderOpen, ScanLine, Lock, Target, Sparkles, Settings, FileText, Calendar, CheckSquare,
  PartyPopper, CloudSun, Map
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  {
    title: "Productivity",
    items: [
      { path: '/notes', icon: FileText, label: 'Notes', desc: 'Capture ideas', color: 'bg-yellow-500/10 text-yellow-500' },
      { path: '/tasks', icon: CheckSquare, label: 'Tasks', desc: 'Manage todos', color: 'bg-blue-500/10 text-blue-500' },
      { path: '/calendar', icon: Calendar, label: 'Calendar', desc: 'Schedule time', color: 'bg-purple-500/10 text-purple-500' },
      { path: '/habits', icon: Target, label: 'Habito', desc: 'Build routines', color: 'bg-destructive/10 text-destructive' },
    ]
  },
  {
    title: "Tools",
    items: [
      { path: '/finance', icon: Wallet, label: 'Finance', desc: 'Track spending', color: 'bg-emerald-500/10 text-emerald-600' },
      { path: '/files', icon: FolderOpen, label: 'File Holder', desc: 'Cloud files', color: 'bg-info/10 text-info' },
      { path: '/oradocs', icon: FileText, label: 'ORADOCS', desc: 'Convert documents', color: 'bg-cyan-500/10 text-cyan-500' },
      { path: '/routo', icon: Map, label: 'ROUTO', desc: 'Live maps', color: 'bg-blue-500/10 text-blue-500' },
      { path: '/vault', icon: Lock, label: 'Vault', desc: 'Passwords', color: 'bg-warning/10 text-warning' },
      { path: '/scanner', icon: ScanLine, label: 'Scanner', desc: 'Scan documents', color: 'bg-cyan-500/10 text-cyan-500' },
    ]
  },
  {
    title: "AI & Media",
    items: [
      { path: '/assistant', icon: Sparkles, label: 'AI Assistant', desc: 'Smart helper', color: 'bg-violet-500/10 text-violet-600' },
      { path: '/climora', icon: CloudSun, label: 'Climora', desc: 'Live weather hub', color: 'bg-blue-500/10 text-blue-400' },
      { path: '/festo', icon: PartyPopper, label: 'FESTO', desc: 'FESTO info', color: 'bg-amber-500/10 text-amber-500' },
      { path: '/news', icon: FileText, label: 'NEORA', desc: 'Editorial digest', color: 'bg-rose-500/10 text-rose-500' },
    ]
  },
  {
    title: "System",
    items: [
      { path: '/settings', icon: Settings, label: 'Settings', desc: 'Preferences', color: 'bg-muted text-muted-foreground' },
    ]
  }
];

export default function More() {
  return (
    <div className="space-y-6 pb-24">
      <div className="px-1">
        <h1 className="text-2xl font-bold tracking-tight">More</h1>
        <p className="text-sm text-muted-foreground mt-1">All modules and apps</p>
      </div>
      
      <div className="space-y-8">
        {CATEGORIES.map((category, catIndex) => (
          <div key={category.title} className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">{category.title}</h2>
            <div className="grid grid-cols-2 gap-3">
              {category.items.map((item, i) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: (catIndex * 0.1) + (i * 0.05), type: 'spring', stiffness: 300, damping: 24 }}
                  className="h-full"
                >
                  <Link
                    to={item.path}
                    className="group flex flex-col gap-3 p-4 h-full rounded-[1.5rem] bg-card/60 backdrop-blur-md border border-border/50 hover:bg-card hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110", item.color)}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{item.desc}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
