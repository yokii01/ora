import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function WidgetCard({ children, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
      className={cn(
        "bg-card rounded-2xl border border-border/60 p-5 transition-shadow h-full flex flex-col",
        className
      )}
    >
      {children}
    </motion.div>
  );
}