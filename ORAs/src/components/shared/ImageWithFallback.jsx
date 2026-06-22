import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A safe image component that falls back to a placeholder icon if the source fails to load.
 */
export function ImageWithFallback({ src, alt, className, fallbackIconSize = 24, ...props }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || error) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted/30 rounded-lg border border-border/50",
          className
        )}
        {...props}
      >
        <ImageOff size={fallbackIconSize} className="text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)} {...props}>
      {!loaded && (
        <div className="absolute inset-0 bg-muted/20 animate-pulse rounded-inherit" />
      )}
      <img
        src={src}
        alt={alt || "Image"}
        onError={() => setError(true)}
        onLoad={() => setLoaded(true)}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
