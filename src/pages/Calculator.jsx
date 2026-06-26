import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, History, Trash2, Delete, Sparkles, X, 
  ChevronDown, ChevronUp, Equal, Plus, Minus, X as MultiplyIcon, Divide, Percent
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ==========================================================================================
 * ORAs CALCULATOR ULTRA — VISION OS FLAGSHIP EDITION
 * ==========================================================================================
 */

// Synthesize subtle UI click sound using Web Audio API
const playClickAudio = (freq = 400, type = 'sine') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {}
};

const triggerHaptic = () => {
  if (navigator.vibrate) navigator.vibrate(8);
};

export default function Calculator() {
  const navigate = useNavigate();
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('0');
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('oras_calc_history')) || []; } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [scientific, setScientific] = useState(false);

  // Auto calculate expression safely
  useEffect(() => {
    if (!expression.trim()) {
      setResult('0');
      return;
    }
    try {
      // Replace symbols for JS evaluation
      let sanitized = expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/√\(/g, 'Math.sqrt(')
        .replace(/log\(/g, 'Math.log10(');

      // Evaluate safe subset
      if (/^[0-9+\-*/().\sMathPIE]+$/.test(sanitized)) {
        const evaluated = Function(`"use strict"; return (${sanitized})`)();
        if (typeof evaluated === 'number' && !isNaN(evaluated) && isFinite(evaluated)) {
          setResult(Number.isInteger(evaluated) ? String(evaluated) : Number(evaluated.toFixed(8)).toString());
        }
      }
    } catch {}
  }, [expression]);

  const handlePress = (val) => {
    triggerHaptic();
    playClickAudio(val === '=' ? 600 : (isNaN(val) ? 480 : 360));

    if (val === 'AC') {
      setExpression('');
      setResult('0');
      return;
    }
    if (val === 'DEL') {
      setExpression(p => p.slice(0, -1));
      return;
    }
    if (val === '=') {
      if (result !== '0' && expression) {
        const entry = { exp: expression, res: result, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        const nextHist = [entry, ...history].slice(0, 30);
        setHistory(nextHist);
        localStorage.setItem('oras_calc_history', JSON.stringify(nextHist));
        setExpression(result);
      }
      return;
    }
    setExpression(p => p + val);
  };

  const clearHistory = () => {
    triggerHaptic();
    setHistory([]);
    localStorage.removeItem('oras_calc_history');
  };

  const buttons = [
    { label: 'AC', type: 'func', accent: 'text-rose-400 bg-rose-500/15 border-rose-500/30' },
    { label: 'DEL', type: 'func', accent: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
    { label: '%', type: 'func', accent: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' },
    { label: '÷', type: 'op', accent: 'text-violet-300 bg-violet-600/35 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.35)] font-black' },

    { label: '7', type: 'num' },
    { label: '8', type: 'num' },
    { label: '9', type: 'num' },
    { label: '×', type: 'op', accent: 'text-violet-300 bg-violet-600/35 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.35)] font-black' },

    { label: '4', type: 'num' },
    { label: '5', type: 'num' },
    { label: '6', type: 'num' },
    { label: '-', type: 'op', accent: 'text-violet-300 bg-violet-600/35 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.35)] font-black' },

    { label: '1', type: 'num' },
    { label: '2', type: 'num' },
    { label: '3', type: 'num' },
    { label: '+', type: 'op', accent: 'text-violet-300 bg-violet-600/35 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.35)] font-black' },

    { label: '0', type: 'num', span: 'col-span-2 aspect-auto rounded-full' },
    { label: '.', type: 'num' },
    { label: '=', type: 'op', accent: 'text-slate-950 bg-gradient-to-tr from-cyan-400 to-emerald-400 border-cyan-300 font-black shadow-[0_0_25px_rgba(52,211,153,0.6)]' }
  ];

  const sciButtons = ['(', ')', 'sin(', 'cos(', 'tan(', '√(', 'π', 'e'];

  return (
    <div className="min-h-screen bg-[#05070f] text-white flex flex-col justify-between font-sans relative overflow-x-hidden selection:bg-violet-500/30 p-4 sm:p-6 pb-12">
      {/* Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Controls */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between relative z-20 pt-2 sm:pt-4">
        <button 
          onClick={() => navigate(-1)} 
          className="w-11 h-11 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white hover:bg-white/15 active:scale-95 transition-all shadow-xl"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => { triggerHaptic(); setScientific(!scientific); }}
            className={cn("px-4 py-2 rounded-full border text-xs font-bold transition-all shadow-lg backdrop-blur-xl", scientific ? "bg-violet-500 text-white border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.5)]" : "bg-white/5 border-white/10 text-white/70 hover:text-white")}
          >
            <Sparkles size={13} className="inline mr-1.5 text-violet-300" />
            <span>Sci</span>
          </button>

          <button 
            onClick={() => { triggerHaptic(); setShowHistory(!showHistory); }}
            className={cn("w-11 h-11 rounded-full border flex items-center justify-center transition-all shadow-lg backdrop-blur-xl", showHistory ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]" : "bg-white/5 border-white/10 text-white/70 hover:text-white")}
          >
            <History size={18} />
          </button>
        </div>
      </div>

      {/* Main Calculator Centerpiece */}
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-end space-y-6 relative z-10 my-4">
        
        {/* Floating Glass Calculation Screen */}
        <motion.div 
          layout
          className="bg-gradient-to-b from-white/[0.08] to-white/[0.03] backdrop-blur-3xl rounded-[2.5rem] border border-white/15 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col justify-end items-end min-h-[160px] relative overflow-hidden group"
        >
          <div className="text-sm sm:text-base font-mono font-medium text-cyan-300/80 tracking-wider h-6 overflow-x-auto whitespace-nowrap scrollbar-none mb-2 w-full text-right select-all">
            {expression || '0'}
          </div>

          <motion.div 
            key={result}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl sm:text-6xl font-black tracking-tight text-white font-sans truncate w-full text-right select-all drop-shadow-lg"
          >
            {result}
          </motion.div>
        </motion.div>

        {/* Scientific Keypad Drawer */}
        <AnimatePresence>
          {scientific && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="grid grid-cols-4 gap-2.5 overflow-hidden"
            >
              {sciButtons.map(btn => (
                <motion.button
                  key={btn}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handlePress(btn)}
                  className="py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 font-mono text-xs font-bold text-violet-300 backdrop-blur-xl shadow-lg transition-colors"
                >
                  {btn}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Circular Keypad Grid */}
        <div className="grid grid-cols-4 gap-3.5 pt-2">
          {buttons.map((btn, i) => (
            <motion.button
              key={btn.label || i}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handlePress(btn.label)}
              className={cn(
                "flex items-center justify-center rounded-full text-xl sm:text-2xl font-bold backdrop-blur-2xl border transition-all duration-200 select-none shadow-xl transform-gpu",
                btn.span ? btn.span : "aspect-square",
                btn.accent 
                  ? btn.accent 
                  : "bg-gradient-to-b from-white/[0.09] to-white/[0.03] border-white/15 text-white/90 hover:bg-white/[0.15] hover:text-white"
              )}
            >
              {btn.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* History Drawer Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-slate-950/90 border border-white/15 rounded-[2.5rem] w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <History size={20} className="text-cyan-400" />
                  <h3 className="font-bold text-lg text-white">Calculation History</h3>
                </div>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <button onClick={clearHistory} className="p-2 rounded-full hover:bg-rose-500/20 text-rose-400 transition-colors" title="Clear History">
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button onClick={() => setShowHistory(false)} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3 divide-y divide-white/5 scrollbar-thin">
                {history.length === 0 ? (
                  <div className="text-center py-12 text-white/40 font-medium">No calculation history yet</div>
                ) : (
                  history.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setExpression(item.exp); setResult(item.res); setShowHistory(false); }}
                      className="w-full pt-3 text-right hover:bg-white/5 p-3 rounded-2xl transition-colors block group"
                    >
                      <div className="text-xs text-white/50 font-mono flex justify-between">
                        <span>{item.time}</span>
                        <span className="group-hover:text-cyan-300">{item.exp}</span>
                      </div>
                      <div className="text-2xl font-bold text-white mt-1 font-mono">{item.res}</div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
