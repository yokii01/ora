import React from 'react';
import { cn } from '@/lib/utils';

export default function LoadingSpinner({ label, className = '', size = 'md', inline = false }) {
  const sizes = {
    xs: 'h-4 w-4 border-2',
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4',
  };

  const spinner = (
    <div 
      className={cn(
        "rounded-full border-muted/30 border-t-primary animate-spin", 
        !inline && sizes[size] ? sizes[size] : sizes.md,
        inline && className ? className : ''
      )}
    />
  );

  if (inline) {
    return spinner;
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 text-center', className)}>
      {spinner}
      {label && <p className="text-sm font-medium text-muted-foreground animate-pulse">{label}</p>}
    </div>
  );
}

