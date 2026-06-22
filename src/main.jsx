import React from 'react'
import ReactDOM from 'react-dom/client'
import db from '@/api/base44Client'

// Expose mock DB globally so legacy inline fallbacks use it
globalThis.__B44_DB__ = db;

// Handle PWA installation globally
window.deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
});

// Dynamically import CSS and the app after the global DB is set so
// any modules that read `globalThis.__B44_DB__` use the mock DB.
(async () => {
  await import('@/index.css');
  const { default: App } = await import('@/App.jsx');
  const { ErrorBoundary } = await import('@/components/shared/ErrorBoundary.jsx');
  
  // FAILSAFE: Remove the old HTML splash screen if the PWA service worker served a cached index.html
  const oldSplash = document.getElementById('splash-screen');
  if (oldSplash) {
    oldSplash.style.opacity = '0';
    oldSplash.style.transition = 'opacity 0.3s ease';
    setTimeout(() => oldSplash.remove(), 300);
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
})();
