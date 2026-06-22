import React from 'react';
import { RoutoProvider, useRouto } from './context/RoutoContext';
import { MapViewer } from './components/Map/MapViewer';
import { FloatingSearchBar } from './components/Search/FloatingSearchBar';
import { FloatingActions } from './components/Controls/FloatingActions';
import { PlaceDetails } from './components/BottomSheet/PlaceDetails';
import { RouteInfoLayer } from './components/Routing/RouteInfoLayer';
import { MapSettingsSheet } from './components/BottomSheet/MapSettingsSheet';
import { motion } from 'framer-motion';

const RoutoApp = () => {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-[100dvh] overflow-hidden"
    >
      <MapViewer />
      
      {/* UI Overlays */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col">
        <FloatingSearchBar onOpenSettings={() => setIsSettingsOpen(true)} />
        <RouteInfoLayer />
        <FloatingActions />
        <PlaceDetails />
        <MapSettingsSheet isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </motion.div>
  );
};

export default function Routo() {
  return (
    <RoutoProvider>
      <RoutoApp />
    </RoutoProvider>
  );
}
