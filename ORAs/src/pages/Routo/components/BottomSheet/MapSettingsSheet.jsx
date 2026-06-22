import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, CloudSun, Map as MapIcon, Compass, Share, Download, Settings, Navigation, Ruler, Car, Bus, Bike, Bookmark, AlertTriangle, Maximize } from 'lucide-react';
import { useRouto } from '../../context/RoutoContext';
import { cn } from '@/lib/utils';

export const MapSettingsSheet = ({ isOpen, onClose }) => {
  const { mapTheme, setMapTheme, mapStyle, setMapStyle } = useRouto();

  const styles = [
    { id: 'default', label: 'Default', icon: MapIcon },
    { id: 'satellite', label: 'Satellite', icon: CloudSun },
    { id: 'terrain', label: 'Terrain', icon: Layers },
    { id: 'hybrid', label: 'Hybrid', icon: Navigation },
  ];

  const tools = [
    { label: 'Traffic', icon: Car },
    { label: 'Locate Me', icon: Navigation },
    { label: 'Compass', icon: Compass },
    { label: 'Save Place', icon: Bookmark },
    { label: 'Share', icon: Share },
    { label: 'Layers', icon: Layers },
    { label: 'Recenter', icon: MapIcon },
    { label: 'Fullscreen', icon: Maximize },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 pointer-events-auto"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "absolute top-0 bottom-0 right-0 w-full sm:w-[400px] z-50 pointer-events-auto overflow-y-auto custom-scrollbar border-l",
              mapTheme === 'dark' ? "bg-black/70 border-white/10 text-white" : "bg-white/80 border-black/5 text-gray-900"
            )}
            style={{ backdropFilter: 'blur(30px) saturate(2)' }}
          >

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Map Settings</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Map Styles */}
              <div className="mb-8">
                <h3 className={cn("text-sm font-semibold mb-4 opacity-70 uppercase tracking-wider")}>Map Type</h3>
                <div className="grid grid-cols-4 gap-3">
                  {styles.map(style => {
                    const Icon = style.icon;
                    const isActive = mapStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        onClick={() => setMapStyle(style.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all active:scale-95",
                          isActive 
                            ? "bg-primary/20 border-primary/50 text-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                            : mapTheme === 'dark' ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-black/5 border-black/5 hover:bg-black/10"
                        )}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-xs font-medium">{style.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Dark/Light Toggle */}
              <div className="mb-8">
                 <h3 className={cn("text-sm font-semibold mb-4 opacity-70 uppercase tracking-wider")}>Appearance</h3>
                 <div className="flex bg-black/10 rounded-2xl p-1 border border-white/5">
                    <button 
                      onClick={() => setMapTheme('light')}
                      className={cn("flex-1 py-2 rounded-xl text-sm font-medium transition-all", mapTheme === 'light' ? "bg-white text-black shadow-md" : "text-gray-500 hover:text-white")}
                    >Light</button>
                    <button 
                      onClick={() => setMapTheme('dark')}
                      className={cn("flex-1 py-2 rounded-xl text-sm font-medium transition-all", mapTheme === 'dark' ? "bg-gray-800 text-white shadow-md border border-white/10" : "text-gray-500 hover:text-black")}
                    >Dark</button>
                 </div>
              </div>

              {/* Tools */}
              <div>
                <h3 className={cn("text-sm font-semibold mb-4 opacity-70 uppercase tracking-wider")}>Tools</h3>
                <div className="grid grid-cols-3 gap-3">
                  {tools.map(tool => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.label}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-xl border transition-all active:scale-95",
                          mapTheme === 'dark' ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-black/5 border-black/5 hover:bg-black/10"
                        )}
                      >
                        <Icon className="w-4 h-4 opacity-70" />
                        <span className="text-sm font-medium">{tool.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
