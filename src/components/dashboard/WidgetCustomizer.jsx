import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { Eye, EyeOff, Check, X, GripVertical, Maximize2, Minimize2, Grid, List, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import CompactWidget from '@/components/dashboard/CompactWidget';

function WidgetEditCard({ widget, onToggle, onCycleSize, isDragging }) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={widget}
      dragListener={false}
      dragControls={controls}
      className="select-none"
    >
      <motion.div
        layout
        animate={{
          scale: isDragging ? 1.03 : 1,
          boxShadow: isDragging ? '0 16px 48px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.06)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={cn(
          'flex items-center gap-3 p-3.5 rounded-2xl border transition-colors mb-2',
          widget.visible ? 'bg-card border-border/60' : 'bg-muted/30 border-dashed border-border/40'
        )}
      >
        <div
          onPointerDown={e => controls.start(e)}
          className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground/50 hover:text-muted-foreground transition-colors flex-shrink-0 p-1 -m-1"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', widget.color)}>
          <widget.icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-semibold transition-colors', !widget.visible && 'text-muted-foreground')}>{widget.label}</p>
          <p className="text-[10px] text-muted-foreground capitalize">{widget.size || 'normal'}</p>
        </div>

        <div className="flex items-center gap-1.5">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => onCycleSize(widget.id)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Resize"
          >
            {widget.size === 'wide' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => onToggle(widget.id)}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              widget.visible ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
            title="Toggle visibility"
          >
            {widget.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </motion.button>
        </div>
      </motion.div>
    </Reorder.Item>
  );
}

const SIZE_OPTIONS = ['compact', 'normal', 'wide'];

export default function WidgetCustomizer({ widgets, setWidgets, components, getWidgetProps, onClose }) {
  const [localWidgets, setLocalWidgets] = useState(widgets);
  const [viewMode, setViewMode] = useState('gallery'); // 'gallery' | 'manage'

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const toggleVisible = (id) => {
    setLocalWidgets(prev => {
      const next = prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
      setWidgets(next);
      return next;
    });
  };

  const cycleSize = (id) => {
    setLocalWidgets(prev => {
      const next = prev.map(w => {
        if (w.id !== id) return w;
        const idx = SIZE_OPTIONS.indexOf(w.size || 'normal');
        return { ...w, size: SIZE_OPTIONS[(idx + 1) % SIZE_OPTIONS.length] };
      });
      setWidgets(next);
      return next;
    });
  };

  const handleDone = () => {
    setWidgets(localWidgets);
    onClose();
  };

  const handleReorder = (next) => {
    setLocalWidgets(next);
    setWidgets(next);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-card/95 backdrop-blur-3xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/40">
          <div>
            <h2 className="font-bold text-xl tracking-tight">Widget Gallery</h2>
            <p className="text-sm text-muted-foreground mt-1">Select and arrange your home screen widgets</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-muted/50 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('gallery')}
                className={cn('p-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all', viewMode === 'gallery' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                <Grid className="w-4 h-4" /> <span className="hidden sm:inline">Gallery</span>
              </button>
              <button
                onClick={() => setViewMode('manage')}
                className={cn('p-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all', viewMode === 'manage' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                <List className="w-4 h-4" /> <span className="hidden sm:inline">Manage</span>
              </button>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {viewMode === 'gallery' ? (
              <motion.div
                key="gallery"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 custom-scrollbar"
              >
                {localWidgets.map((w, i) => {
                  const Component = components[w.id];
                  if (!Component) return null;
                  const props = getWidgetProps ? getWidgetProps(w.id) : {};
                  
                  return (
                    <motion.div
                      key={w.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "relative group rounded-3xl border transition-all duration-300",
                        w.visible ? "border-primary shadow-[0_0_20px_rgba(var(--primary),0.15)] ring-2 ring-primary/20" : "border-border/50 hover:border-border"
                      )}
                    >
                      <div className="absolute top-4 right-4 z-20">
                        <button
                          onClick={() => toggleVisible(w.id)}
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg backdrop-blur-md",
                            w.visible ? "bg-primary text-primary-foreground" : "bg-black/50 text-white/70 hover:bg-black/70 hover:text-white"
                          )}
                        >
                          {w.visible ? <CheckCircle2 className="w-5 h-5" /> : <Grid className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      {/* Widget Preview Wrapper */}
                      <div className="h-48 overflow-hidden rounded-[22px] m-1 pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity">
                        <div className="w-full h-full scale-[0.8] origin-top-left w-[125%] h-[125%]">
                          {w.size === 'compact' ? (
                             <CompactWidget icon={w.icon} label={w.label} />
                          ) : (
                             <Component {...props} delay={0} />
                          )}
                        </div>
                      </div>

                      <div className="p-4 pt-2 flex items-center justify-between border-t border-border/10 bg-muted/20 rounded-b-[22px]">
                        <div>
                          <p className="font-semibold text-sm">{w.label}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{w.size}</p>
                        </div>
                        <button
                          onClick={() => cycleSize(w.id)}
                          className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-semibold hover:bg-muted transition-colors"
                        >
                          Resize
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="manage"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full overflow-y-auto p-6 max-w-2xl mx-auto custom-scrollbar"
              >
                <div className="mb-6 text-center">
                  <h3 className="font-semibold text-lg">Reorder Widgets</h3>
                  <p className="text-sm text-muted-foreground">Drag to rearrange your active widgets on the home screen.</p>
                </div>
                <Reorder.Group
                  axis="y"
                  values={localWidgets}
                  onReorder={handleReorder}
                  className="space-y-0"
                  layoutScroll
                >
                  <AnimatePresence>
                    {localWidgets.map(w => (
                      <WidgetEditCard
                        key={w.id}
                        widget={w}
                        onToggle={toggleVisible}
                        onCycleSize={cycleSize}
                        isDragging={false}
                      />
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border/40 bg-muted/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleDone}
            className="px-8 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg hover:shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Apply Changes
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}