import React from 'react'
import ReactDOM from 'react-dom/client'
import db from '@/api/base44Client'

// Expose mock DB globally so legacy inline fallbacks use it
globalThis.__B44_DB__ = db;

// Dynamically import CSS and the app after the global DB is set so
// any modules that read `globalThis.__B44_DB__` use the mock DB.
(async () => {
  await import('@/index.css');
  const { default: App } = await import('@/App.jsx');
  const { ErrorBoundary } = await import('@/components/shared/ErrorBoundary.jsx');
  ReactDOM.createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
})();
