import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function EmptyState({ icon, title, description, action, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col items-center justify-center p-8 text-center min-h-[50vh]", className)}
    >
      <div className="w-24 h-24 mb-6 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
        {React.cloneElement(icon, { size: 48, strokeWidth: 1.5 })}
      </div>
      <h3 className="text-2xl font-bold tracking-tight mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-8 text-lg">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} className="rounded-full px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-transform touch-target-safe" size="lg">
          {action.icon && <span className="mr-2">{action.icon}</span>}
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
