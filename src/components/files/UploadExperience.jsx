import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatBytes = (bytes = 0) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

const formatDuration = seconds => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;
};

export function UploadExperience({ uploads, onDismiss }) {
  useEffect(() => {
    // Auto-dismiss successful uploads after 4 seconds
    const timers = [];
    uploads.forEach(upload => {
      if (upload.status === 'success') {
        const timer = setTimeout(() => onDismiss(upload.id), 4000);
        timers.push(timer);
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [uploads, onDismiss]);

  return (
    <AnimatePresence>
      {uploads.length > 0 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 relative z-10">
          {uploads.map(upload => (
            <motion.div layout key={upload.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-xl p-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                  {upload.status === 'success' ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 10 }}>
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    </motion.div>
                  ) : upload.status === 'error' ? (
                    <XCircle className="w-5 h-5 text-destructive" />
                  ) : (
                    <>
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
                        <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" className="text-muted" strokeWidth="3" />
                        <motion.circle
                          cx="16" cy="16" r="14" fill="none"
                          stroke="currentColor" className="text-primary" strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray="88"
                          animate={{ strokeDashoffset: 88 - (upload.percent / 100) * 88 }}
                        />
                      </svg>
                    </>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3 text-xs"><span className="truncate font-medium">{upload.name}</span><span className="font-semibold">{Math.round(upload.percent)}%</span></div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted relative">
                    <motion.div className={cn('absolute inset-y-0 left-0 rounded-full', upload.status === 'error' ? 'bg-destructive' : 'bg-gradient-to-r from-primary/80 to-primary')} animate={{ width: `${upload.percent}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1.5">
                    {upload.status === 'uploading' ? (
                      <>
                        <span className="text-foreground/80 font-medium">{formatBytes(upload.speed)}/s</span>
                        <span>•</span>
                        <span>{formatDuration(upload.remainingSeconds)} remaining</span>
                      </>
                    ) : upload.status === 'success' ? (
                      <span className="text-success font-medium">Upload successful</span>
                    ) : upload.status === 'error' ? (
                      <span className="text-destructive">{upload.error}</span>
                    ) : 'Waiting'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
