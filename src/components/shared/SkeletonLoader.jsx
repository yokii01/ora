import React from 'react';
import { cn } from '@/lib/utils';

export function SkeletonLoader({ type = 'list', count = 3, className }) {
  const items = Array.from({ length: count });

  if (type === 'card') {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4", className)}>
        {items.map((_, i) => (
          <div key={i} className="p-5 rounded-3xl border border-border/40 bg-card/40 space-y-3 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="w-10 h-10 rounded-2xl bg-muted/60" />
              <div className="w-16 h-4 rounded-lg bg-muted/60" />
            </div>
            <div className="w-3/4 h-5 rounded-lg bg-muted/60 pt-2" />
            <div className="w-1/2 h-4 rounded-lg bg-muted/40" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'grid') {
    return (
      <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3", className)}>
        {items.map((_, i) => (
          <div key={i} className="h-28 rounded-3xl border border-border/40 bg-card/40 p-4 flex flex-col justify-between animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-muted/60" />
            <div className="w-20 h-4 rounded-lg bg-muted/60" />
          </div>
        ))}
      </div>
    );
  }

  // Default 'list'
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((_, i) => (
        <div key={i} className="p-4 rounded-2xl border border-border/40 bg-card/40 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-muted/60 flex-shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="w-1/3 h-4 rounded-lg bg-muted/60" />
              <div className="w-2/3 h-3 rounded-lg bg-muted/40" />
            </div>
          </div>
          <div className="w-16 h-6 rounded-xl bg-muted/60" />
        </div>
      ))}
    </div>
  );
}
