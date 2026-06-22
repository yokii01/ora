import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export function StartupValidator({ children }) {
  const [isValidating, setIsValidating] = useState(true);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    const validateEnvironment = async () => {
      const issues = [];

      // AI secrets are validated by the server-side /api/ai proxy.
      window.__FALLBACK_MODE__ = false;

      // Check external APIs (Example: Google Drive / Storage)
      const gDriveAuth = import.meta.env.VITE_GOOGLE_DRIVE_AUTH_URL;
      if (!gDriveAuth) {
        // Not a critical error, just missing integration
        console.warn("Google Drive Integration missing. Storage will fallback to Local Only.");
      }

      if (issues.length > 0) {
        setWarnings(issues);
        // Show toasts after a tiny delay so the UI is ready
        setTimeout(() => {
          issues.forEach(issue => {
            toast.warning("Environment Warning", {
              description: issue,
              duration: 8000,
            });
          });
        }, 1500);
      }

      // Simulate brief validation delay for smooth UX
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsValidating(false);
    };

    validateEnvironment();
  }, []);

  return (
    <>
      <AnimatePresence>
        {isValidating && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
          >
            <div className="flex flex-col items-center gap-4">
              <LoadingSpinner inline className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground animate-pulse">
                Validating environment...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Once validated, render the app. We don't block render on warnings, just gracefully degrade. */}
      {!isValidating && children}
    </>
  );
}
