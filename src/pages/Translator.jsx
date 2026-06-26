import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRightLeft, Volume2, Mic, MicOff, Copy, Check, 
  Sparkles, Languages, RefreshCw, Loader2, Wand2, Share2, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { invokeAI } from '@/api/aiClient';

/**
 * ==========================================================================================
 * ORAs TRANSLATOR ULTRA — SPEAKASY LUXURY FLAGSHIP EDITION
 * ==========================================================================================
 */

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
  { code: 'ru', label: 'Russian', flag: '🇷🇺' },
  { code: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
];

const TONES = [
  { id: 'formal', label: 'Formal Executive', icon: '👔' },
  { id: 'casual', label: 'Friendly Casual', icon: '☕' },
  { id: 'travel', label: 'Travel Survival', icon: '✈️' },
  { id: 'business', label: 'Concise Business', icon: '💼' }
];

export default function Translator() {
  const navigate = useNavigate();
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [listening, setListening] = useState(false);
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [selectedTone, setSelectedTone] = useState(null);

  const recognitionRef = useRef(null);

  // Trigger web haptic
  const haptic = () => { if (navigator.vibrate) navigator.vibrate(8); };

  // Free HTTPS Public Translation Engine (MyMemory API)
  const executeTranslation = async (text, src, tgt) => {
    if (!text.trim()) { setTranslatedText(''); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${src}|${tgt}`);
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        setTranslatedText(data.responseData.translatedText);
      } else {
        setTranslatedText("Translation temporarily unavailable.");
      }
    } catch {
      setTranslatedText("Network connection error.");
    } finally {
      setLoading(false);
    }
  };

  // Debounced translation trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputText.trim()) executeTranslation(inputText, sourceLang, targetLang);
      else setTranslatedText('');
    }, 600);
    return () => clearTimeout(handler);
  }, [inputText, sourceLang, targetLang]);

  // Swap languages with animation
  const handleSwap = () => {
    haptic();
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  // Speech-to-text input
  const toggleDictation = () => {
    haptic();
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    const rec = new SpeechRec();
    rec.lang = sourceLang === 'en' ? 'en-US' : sourceLang;
    rec.continuous = false;
    rec.interimResults = true;

    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setInputText(transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    rec.start();
  };

  // Text-to-speech audio
  const speakText = (txt, lang) => {
    haptic();
    if (!window.speechSynthesis || !txt) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(txt);
    utterance.lang = lang === 'en' ? 'en-US' : lang;
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  // Copy to clipboard
  const copyOutput = () => {
    haptic();
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // AI Tone Enhancement
  const enhanceTone = async (tone) => {
    haptic();
    if (!translatedText || aiEnhancing) return;
    setSelectedTone(tone.id);
    setAiEnhancing(true);
    try {
      const prompt = `Rewrite the following translated text (${translatedText}) to sound like a ${tone.label}. Keep it natural, idiomatic, and culturally accurate in target language ${targetLang}. Return ONLY the refined translation text without quotes or explanations.`;
      const response = await invokeAI({
        messages: [{ role: 'user', content: prompt }]
      });
      if (response && typeof response === 'string') {
        setTranslatedText(response.trim());
      }
    } catch {}
    finally {
      setAiEnhancing(false);
    }
  };

  const srcObj = LANGUAGES.find(l => l.code === sourceLang) || LANGUAGES[0];
  const tgtObj = LANGUAGES.find(l => l.code === targetLang) || LANGUAGES[1];

  return (
    <div className="min-h-screen bg-[#030612] text-white flex flex-col justify-between font-sans relative overflow-x-hidden selection:bg-cyan-500/30 p-4 sm:p-8 pb-16">
      {/* Luxury Ambient Lighting Orbs */}
      <div className="absolute top-10 left-1/4 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-10 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Header Navigation */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between relative z-20 pt-2">
        <button 
          onClick={() => navigate(-1)} 
          className="w-11 h-11 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white hover:bg-white/15 active:scale-95 transition-all shadow-xl"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/25 text-xs font-bold text-cyan-300">
            <Languages size={15} className="animate-pulse" />
            <span>Speakasy AI</span>
          </div>
        </div>
      </div>

      {/* Main Translator Centerpiece Grid */}
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center space-y-6 relative z-10 my-6">
        
        {/* Animated Language Selector Chip Bar */}
        <div className="flex items-center justify-between gap-3 glass-panel rounded-full p-2 bg-white/[0.04] border border-white/10 shadow-2xl">
          <select 
            value={sourceLang} 
            onChange={e => { haptic(); setSourceLang(e.target.value); }}
            className="flex-1 bg-transparent px-5 py-3 rounded-full text-sm font-extrabold text-white outline-none cursor-pointer hover:bg-white/5 transition-colors appearance-none text-center"
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code} className="bg-slate-900 text-white">{l.flag} {l.label}</option>
            ))}
          </select>

          <motion.button
            whileTap={{ rotate: 180, scale: 0.9 }}
            onClick={handleSwap}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)] shrink-0 transition-transform"
            title="Swap Languages"
          >
            <ArrowRightLeft size={18} className="text-white font-black" />
          </motion.button>

          <select 
            value={targetLang} 
            onChange={e => { haptic(); setTargetLang(e.target.value); }}
            className="flex-1 bg-transparent px-5 py-3 rounded-full text-sm font-extrabold text-white outline-none cursor-pointer hover:bg-white/5 transition-colors appearance-none text-center"
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code} className="bg-slate-900 text-white">{l.flag} {l.label}</option>
            ))}
          </select>
        </div>

        {/* Translation Panels Dual Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Source Input Card */}
          <div className="glass-panel rounded-[2.5rem] bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/15 p-7 flex flex-col justify-between min-h-[280px] shadow-2xl relative group focus-within:border-cyan-400/50 transition-all">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-white/50">{srcObj.flag} Source ({srcObj.label})</span>
              {inputText && (
                <button onClick={() => setInputText('')} className="text-xs font-semibold text-white/40 hover:text-rose-400 transition-colors">Clear</button>
              )}
            </div>

            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Type or paste text to translate..."
              className="w-full flex-1 bg-transparent text-lg sm:text-xl font-medium text-white placeholder:text-white/30 outline-none resize-none scrollbar-thin scrollbar-thumb-white/10"
            />

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
              <span className="text-[11px] font-mono text-white/30">{inputText.length} chars</span>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => speakText(inputText, sourceLang)}
                  className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-cyan-300 transition-colors"
                  title="Listen to input"
                >
                  <Volume2 size={18} />
                </button>

                <button 
                  onClick={toggleDictation}
                  className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all", listening ? "bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.6)]" : "hover:bg-white/10 text-white/70 hover:text-cyan-300")}
                  title="Voice dictation"
                >
                  {listening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Target Translation Card */}
          <div className="glass-panel rounded-[2.5rem] bg-gradient-to-b from-cyan-950/[0.25] to-blue-950/[0.15] border border-cyan-500/25 p-7 flex flex-col justify-between min-h-[280px] shadow-2xl relative group">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">{tgtObj.flag} Translated ({tgtObj.label})</span>
              {loading && <Loader2 size={16} className="text-cyan-400 animate-spin" />}
            </div>

            <div className="flex-1 text-lg sm:text-xl font-semibold text-white/95 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-2 select-all leading-relaxed">
              {translatedText || <span className="text-white/20 font-normal select-none">Translation output will appear here...</span>}
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-xs text-cyan-300/80 font-mono font-medium">
                <Sparkles size={13} />
                <span>Neural Translate</span>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => speakText(translatedText, targetLang)}
                  className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-cyan-300 transition-colors"
                  title="Listen to translation"
                >
                  <Volume2 size={18} />
                </button>

                <button 
                  onClick={copyOutput}
                  className="w-10 h-10 rounded-full bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/30 flex items-center justify-center text-cyan-300 transition-all active:scale-95"
                  title="Copy Translation"
                >
                  {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Tone Enhancement Footer Grid */}
        {translatedText && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-[2rem] p-6 bg-white/[0.03] border border-white/10 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <Wand2 size={16} className="text-cyan-400 animate-bounce" />
              <span className="text-xs font-bold tracking-wider uppercase text-white/80">AI Tone Refinement</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TONES.map(tone => {
                const isSelected = selectedTone === tone.id;
                return (
                  <button
                    key={tone.id}
                    disabled={aiEnhancing}
                    onClick={() => enhanceTone(tone)}
                    className={cn(
                      "px-4 py-3 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between group",
                      isSelected && aiEnhancing ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]" : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15 text-white/80 hover:text-white"
                    )}
                  >
                    <span>{tone.icon} {tone.label}</span>
                    {isSelected && aiEnhancing && <Loader2 size={14} className="animate-spin text-slate-950 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
