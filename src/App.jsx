import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import React, { Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { StartupValidator } from '@/components/shared/StartupValidator';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
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

function App() {
  React.useEffect(() => {
    // Quickly fade out static splash screen
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.style.opacity = '0';
      splash.style.transition = 'opacity 0.3s ease';
      setTimeout(() => splash.remove(), 300);
    }
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router basename={import.meta.env.BASE_URL}>
          <StartupValidator>
            <AuthenticatedApp />
          </StartupValidator>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
