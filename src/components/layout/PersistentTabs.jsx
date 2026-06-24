import React from 'react';
import { useLocation } from 'react-router-dom';
import Home from '@/pages/Home';
import Notes from '@/pages/Notes';
import Tasks from '@/pages/Tasks';
import CalendarPage from '@/pages/CalendarPage';
import Finance from '@/pages/Finance';
import Habito from '@/pages/Habito';

const TABS = [
  { path: '/', component: Home },
  { path: '/notes', component: Notes },
  { path: '/tasks', component: Tasks },
  { path: '/calendar', component: CalendarPage },
  { path: '/finance', component: Finance },
  { path: '/habits', component: Habito },
];

export default function PersistentTabs({ context }) {
  const location = useLocation();

  return (
    <div className="relative w-full h-full">
      {TABS.map((tab) => {
        // Strict match for Home, loose for others if needed
        const isActuallyActive = tab.path === '/' 
          ? location.pathname === '/' 
          : (location.pathname === tab.path || location.pathname.startsWith(tab.path + '/'));
        
        return (
          <div
            key={tab.path}
            className={`absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar transition-opacity duration-200 ${
              isActuallyActive ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none -z-10'
            }`}
            style={{
              visibility: isActuallyActive ? 'visible' : 'hidden',
              transform: isActuallyActive ? 'translate3d(0, 0, 0)' : 'translate3d(100vw, 0, 0)', // Keeps it completely offscreen when inactive for maximum GPU optimization
              transitionProperty: 'opacity, transform',
            }}
          >
            <tab.component context={context} />
          </div>
        );
      })}
    </div>
  );
}
