import React from 'react';
import { motion } from 'framer-motion';
import { Globe, ArrowUpRight } from 'lucide-react';

export default function NewsSpotlightWidget({ delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="h-full group cursor-pointer rounded-3xl overflow-hidden bg-card border border-border shadow-sm flex flex-col relative"
    >
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000" 
          alt="Tech news" 
          className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>

      <div className="relative z-10 p-5 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start">
          <div className="bg-red-500/20 text-red-400 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5" /> Spotlight
          </div>
          <button className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all -translate-y-2 group-hover:translate-y-0">
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-auto">
          <p className="text-white/70 text-xs font-semibold mb-2">TECH TRENDS • 2h ago</p>
          <h3 className="text-white text-lg font-bold leading-tight line-clamp-3">
            The Future of AI Agents: How Autonomous Systems Are Reshaping Productivity
          </h3>
        </div>
      </div>
    </motion.div>
  );
}
