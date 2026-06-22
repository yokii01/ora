import React from 'react';
import { motion } from 'framer-motion';
import { PenLine, Sparkles } from 'lucide-react';

export default function QuickNotesWidget({ notes = [], delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="h-full relative rounded-3xl p-6 bg-card border border-border shadow-sm flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-yellow-500/20 text-yellow-500 rounded-xl">
            <PenLine className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg">Quick Notes</h3>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full">
          <Sparkles className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 flex flex-col gap-3">
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl flex-shrink-0 cursor-pointer hover:bg-yellow-500/20 transition-colors">
            <h4 className="font-semibold text-sm mb-1 text-foreground">Idea for ORAs v8</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">Need to implement a smooth gallery picker for widgets with motion layout.</p>
          </div>
          <div className="bg-muted p-4 rounded-2xl flex-shrink-0 cursor-pointer hover:bg-muted/80 transition-colors">
            <h4 className="font-semibold text-sm mb-1 text-foreground">Grocery List</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">Milk, eggs, bread, and some fresh veggies for dinner.</p>
          </div>
        </div>
        {/* Fading bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent pointer-events-none" />
      </div>

      <button className="mt-4 w-full py-3 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground text-sm font-semibold rounded-xl transition-colors border border-dashed border-border">
        + Tap to add note
      </button>
    </motion.div>
  );
}
