import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Navigation, ChevronDown, ChevronUp, Map as MapIcon, Flame, Leaf, Fuel, Timer, Gauge } from 'lucide-react';
import { useRouto } from '../../context/RoutoContext';
import { useMapRouting } from '../../hooks/useMapRouting';
import { cn } from '@/lib/utils';

export const RouteInfoLayer = () => {
  const { routeData, mapTheme, routingMode, isNavigating, setIsNavigating } = useRouto();
  const { clearRoute } = useMapRouting();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!routeData) return null;

  const distanceKmVal = routeData.distance / 1000;
  const distanceKm = distanceKmVal.toFixed(1);
  const durationMins = Math.round(routeData.duration / 60);
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;
  const timeString = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;

  const now = new Date();
  now.setSeconds(now.getSeconds() + routeData.duration);
  const etaString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const avgSpeed = routeData.duration > 0 ? (distanceKmVal / (routeData.duration / 3600)).toFixed(1) : 0;

  let estimateLabel = '';
  let estimateValue = '';
  let EstimateIcon = null;
  let estimateColor = '';

  if (routingMode === 'driving') {
    estimateLabel = 'Est. Fuel';
    estimateValue = `${(distanceKmVal / 15).toFixed(1)} L`;
    EstimateIcon = Fuel;
    estimateColor = 'text-orange-500';
  } else if (routingMode === 'walking') {
    estimateLabel = 'Calories';
    estimateValue = `${Math.round(distanceKmVal * 50)} kcal`;
    EstimateIcon = Flame;
    estimateColor = 'text-red-500';
  } else if (routingMode === 'cycling') {
    estimateLabel = 'CO₂ Saved';
    estimateValue = `${Math.round(distanceKmVal * 150)} g`;
    EstimateIcon = Leaf;
    estimateColor = 'text-green-500';
  }

  const steps = routeData.legs?.[0]?.steps || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="absolute top-24 left-4 right-4 lg:left-1/2 lg:-translate-x-1/2 lg:w-[400px] z-40 pointer-events-auto"
      >
        <div className={cn(
          "flex flex-col overflow-hidden rounded-[1.5rem] shadow-2xl border transition-all duration-300",
          mapTheme === 'dark' ? "bg-black/60 border-white/10" : "bg-white/70 border-black/5"
        )}
        style={{ backdropFilter: 'blur(24px) saturate(1.5)' }}>
          <div 
            className="flex flex-col p-4 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Navigation className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-2xl font-bold", mapTheme === 'dark' ? "text-white" : "text-gray-900")}>
                      {timeString}
                    </span>
                    <span className={cn("text-sm font-medium", mapTheme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                      ({distanceKm} km)
                    </span>
                  </div>
                  <p className={cn("text-xs flex items-center gap-1 mt-0.5", mapTheme === 'dark' ? "text-green-400" : "text-green-600")}>
                    <Clock className="w-3 h-3" />
                    Fastest route via current mode
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <div className={cn("p-2 rounded-full transition-colors", mapTheme === 'dark' ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-black")}>
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); clearRoute(); }}
                  className={cn("p-2 rounded-full transition-colors", mapTheme === 'dark' ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-black")}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Extra Estimates */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  className="grid grid-cols-3 gap-2 overflow-hidden"
                >
                  <div className={cn("p-3 rounded-xl flex flex-col items-center justify-center text-center", mapTheme === 'dark' ? "bg-white/5" : "bg-black/5")}>
                    <Timer className="w-5 h-5 mb-1 text-blue-500" />
                    <span className={cn("text-xs font-semibold", mapTheme === 'dark' ? "text-white" : "text-gray-900")}>{etaString}</span>
                    <span className={cn("text-[10px] uppercase tracking-wider", mapTheme === 'dark' ? "text-gray-400" : "text-gray-500")}>ETA</span>
                  </div>
                  
                  <div className={cn("p-3 rounded-xl flex flex-col items-center justify-center text-center", mapTheme === 'dark' ? "bg-white/5" : "bg-black/5")}>
                    {EstimateIcon && <EstimateIcon className={cn("w-5 h-5 mb-1", estimateColor)} />}
                    <span className={cn("text-xs font-semibold", mapTheme === 'dark' ? "text-white" : "text-gray-900")}>{estimateValue}</span>
                    <span className={cn("text-[10px] uppercase tracking-wider", mapTheme === 'dark' ? "text-gray-400" : "text-gray-500")}>{estimateLabel}</span>
                  </div>

                  <div className={cn("p-3 rounded-xl flex flex-col items-center justify-center text-center", mapTheme === 'dark' ? "bg-white/5" : "bg-black/5")}>
                    <Gauge className="w-5 h-5 mb-1 text-purple-500" />
                    <span className={cn("text-xs font-semibold", mapTheme === 'dark' ? "text-white" : "text-gray-900")}>{avgSpeed} km/h</span>
                    <span className={cn("text-[10px] uppercase tracking-wider", mapTheme === 'dark' ? "text-gray-400" : "text-gray-500")}>Avg Speed</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 px-4 pb-4">
            {!isNavigating ? (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsNavigating(true); setIsExpanded(true); }}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                <Navigation className="w-5 h-5 fill-current" />
                Start
              </button>
            ) : (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsNavigating(false); }}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                >
                  <X className="w-5 h-5" />
                  End
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); alert('Add Stop feature logic would go here. (waypoints update)'); }}
                  className={cn("flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors", mapTheme === 'dark' ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-black")}
                >
                  + Add Stop
                </button>
              </>
            )}
          </div>

          {/* Expanded State for Turn-by-turn Navigation */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/10 max-h-[40vh] overflow-y-auto custom-scrollbar"
              >
                <div className="p-4 space-y-4">
                  <h3 className={cn("text-sm font-semibold uppercase tracking-wider", mapTheme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                    {isNavigating ? "Live Navigation" : "Turn-by-turn Instructions"}
                  </h3>
                  {steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", isNavigating && idx === 0 ? "bg-green-500/20 text-green-500" : "bg-primary/10 text-primary")}>
                          <MapIcon className="w-4 h-4" />
                        </div>
                        {idx !== steps.length - 1 && (
                          <div className={cn("w-0.5 h-full mt-2", mapTheme === 'dark' ? "bg-white/10" : "bg-black/5")} />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className={cn("font-medium text-sm", mapTheme === 'dark' ? "text-white" : "text-gray-900")}>
                          {step.maneuver.modifier ? `${step.maneuver.type} ${step.maneuver.modifier}` : step.maneuver.type}
                        </p>
                        {step.name && (
                          <p className={cn("text-xs mt-1", mapTheme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                            onto {step.name}
                          </p>
                        )}
                        <p className={cn("text-xs font-mono mt-1", mapTheme === 'dark' ? "text-gray-500" : "text-gray-400")}>
                          {Math.round(step.distance)}m
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
