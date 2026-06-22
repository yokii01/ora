import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function CompactWidget({ icon: Icon, label }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
      className={cn('w-full h-full bg-card flex items-center justify-center rounded-[24px]')}
      style={{ border: 'none' }}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-muted/10">
          {Icon ? <Icon className="w-8 h-8 text-primary" /> : null}
        </div>
        <div className="text-xs text-muted-foreground text-center font-medium">{label}</div>
      </div>
    </motion.div>
  );
}
