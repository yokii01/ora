import React from 'react';
import { RefreshCw, AlertTriangle, WifiOff, FileBox } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FeatureState({ state, onRetry, children, loadingComponent: LoadingComponent }) {
  if (state === 'loading') {
    return LoadingComponent ? <LoadingComponent /> : (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (state === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileBox className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <p className="text-lg font-semibold">Nothing found</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">There is no data available here right now.</p>
      </div>
    );
  }

  if (state === 'offline') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <WifiOff className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <p className="text-lg font-semibold">You're offline</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs mb-4">Please check your internet connection and try again.</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="gap-2 rounded-full">
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        )}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-destructive/70" />
        </div>
        <p className="text-lg font-semibold">Something went wrong</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs mb-4">We couldn't load this content. Please try again.</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="gap-2 rounded-full border-destructive/20 text-destructive hover:bg-destructive/10">
            <RefreshCw className="w-4 h-4" /> Try Again
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
