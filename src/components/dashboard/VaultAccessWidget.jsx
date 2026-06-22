import React from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Key, Fingerprint } from 'lucide-react';

export default function VaultAccessWidget({ delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="h-full rounded-3xl p-6 bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col relative overflow-hidden group cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex justify-between items-start relative z-10 mb-6">
        <div className="p-3 bg-zinc-800 rounded-2xl text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
          <Lock className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1 text-emerald-500 text-xs font-semibold bg-emerald-500/10 px-2 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" /> Secure
        </div>
      </div>

      <div className="relative z-10 mt-auto">
        <h3 className="text-zinc-100 font-bold text-lg mb-1">Secure Vault</h3>
        <p className="text-zinc-400 text-sm mb-4">12 Passwords • 4 Secure Notes</p>
        
        <div className="flex gap-2">
          <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2">
            <Key className="w-4 h-4" /> Passwords
          </button>
          <button className="w-10 h-10 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 rounded-xl flex items-center justify-center transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Fingerprint className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Decorative background grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
    </motion.div>
  );
}
