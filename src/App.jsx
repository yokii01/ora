import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import React, { Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { StartupValidator } from '@/components/shared/StartupValidator';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import Home from '@/pages/Home';
import Notes from '@/pages/Notes';
import Tasks from '@/pages/Tasks';
import CalendarPage from '@/pages/CalendarPage';
import Finance from '@/pages/Finance';
import Files from '@/pages/Files';
import Vault from '@/pages/Vault';
import Habito from '@/pages/Habito';
import Assistant from '@/pages/Assistant';
import More from '@/pages/More';
import Settings from '@/pages/Settings';
const ClimoraPage = React.lazy(() => import('@/pages/ClimoraUltra'));
const ORADOCS = React.lazy(() => import('@/pages/ORADOCS'));
const Scanner = React.lazy(() => import('@/pages/Scanner'));
const FestivalInfo = React.lazy(() => import('@/pages/FestivalInfo'));
const NEORA = React.lazy(() => import('@/pages/News'));
const ROUTO = React.lazy(() => import('@/pages/Routo'));

const AuthenticatedApp = () => {
  return (
    <Suspense fallback={<LoadingSpinner className="min-h-screen" label="Loading ORAs..." size="lg" />}>
      <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/files" element={<Files />} />
        <Route path="/vault" element={<Vault />} />
        <Route path="/habits" element={<Habito />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/more" element={<More />} />
        <Route path="/climora" element={<ClimoraPage />} />
        <Route path="/oradocs" element={<ORADOCS />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/festo" element={<FestivalInfo />} />
        <Route path="/news" element={<NEORA />} />
        <Route path="/routo" element={<ROUTO />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
      </Routes>
    </Suspense>
  );
};

import { motion, AnimatePresence } from 'framer-motion';

function AppSplashScreen({ onComplete }) {
  React.useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    // Hard safety timeout - if app takes too long, kill splash anyway
    const safety = setTimeout(onComplete, 5000);
    return () => { clearTimeout(timer); clearTimeout(safety); };
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}
    >
      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTU8_M7m9TFx-lH6k6ZHA_q1MZDa_t5zCXhKw&s" alt="ORAs Logo" style={{ width: 120, height: 120, borderRadius: 24, marginBottom: 24, boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }} />
      <h2 style={{ margin: 0, fontWeight: 800, letterSpacing: '2px', fontSize: '28px' }}>ORAs</h2>
    </motion.div>
  );
}

function App() {
  const [showSplash, setShowSplash] = React.useState(() => {
    if (sessionStorage.getItem('oras_splashed')) return false;
    return true;
  });

  const handleSplashComplete = React.useCallback(() => {
    setShowSplash(false);
    sessionStorage.setItem('oras_splashed', 'true');
  }, []);

  return (
    <ErrorBoundary>
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AnimatePresence>
            {showSplash && <AppSplashScreen key="splash" onComplete={handleSplashComplete} />}
          </AnimatePresence>
          <StartupValidator>
            <AuthenticatedApp />
          </StartupValidator>
        </Router>
        <Toaster />
        <SonnerToaster position="bottom-center" />
      </QueryClientProvider>
    </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
