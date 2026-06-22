import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderOpen, ScanLine, Lock, Sparkles } from 'lucide-react';

const actions = [
  { path: '/files', icon: FolderOpen, label: 'Files', color: 'from-blue-500/20 to-blue-600/10', iconColor: 'text-blue-500', border: 'border-blue-200/60 dark:border-blue-800/40' },
  { path: '/scanner', icon: ScanLine, label: 'Scanner', color: 'from-emerald-500/20 to-emerald-600/10', iconColor: 'text-emerald-500', border: 'border-emerald-200/60 dark:border-emerald-800/40' },
  { path: '/vault', icon: Lock, label: 'Vault', color: 'from-amber-500/20 to-amber-600/10', iconColor: 'text-amber-500', border: 'border-amber-200/60 dark:border-amber-800/40' },
  { path: '/assistant', icon: Sparkles, label: 'AI', color: 'from-primary/20 to-primary/10', iconColor: 'text-primary', border: 'border-primary/20 dark:border-primary/30' },
];

export default function QuickActions({ delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex gap-3 justify-center"
    >
      {actions.map((action, i) => (
        <motion.div
          key={action.path}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + i * 0.07, duration: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
        >
          <Link
            to={action.path}
            title={action.label}
            className={`flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br ${action.color} border ${action.border} backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-200`}
          >
            <action.icon className={`w-6 h-6 ${action.iconColor}`} />
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}