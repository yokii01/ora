const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pin, Trash2, X, Folder, Hash, FileText, Pencil, Image, Mic, CheckSquare, Palette, Play, Pause, Square, Volume2, ZoomIn, PenTool, Heart, Type, Share, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import DOMPurify from 'dompurify';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import { cn } from '@/lib/utils';

// ─── Deferred Quill Wrapper (React 18 Concurrent Mode Failsafe) ────────
function DeferredQuill(props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 35);
    return () => clearTimeout(t);
  }, []);
  if (!mounted) return <div className="h-[250px] w-full animate-pulse bg-muted/20 rounded-xl flex items-center justify-center text-xs text-muted-foreground">Initializing Rich Text Editor...</div>;
  return <ReactQuill {...props} />;
}

const colorOptions = [
  { value: 'default', class: 'capsule-ui', dot: 'bg-muted-foreground/30' },
  { value: 'red', class: 'capsule-ui bg-red-900/20 border-red-500/20', dot: 'bg-red-400' },
  { value: 'orange', class: 'capsule-ui bg-orange-900/20 border-orange-500/20', dot: 'bg-orange-400' },
  { value: 'yellow', class: 'capsule-ui bg-yellow-900/20 border-yellow-500/20', dot: 'bg-yellow-400' },
  { value: 'green', class: 'capsule-ui bg-green-900/20 border-green-500/20', dot: 'bg-green-400' },
  { value: 'blue', class: 'capsule-ui bg-blue-900/20 border-blue-500/20', dot: 'bg-blue-400' },
  { value: 'purple', class: 'capsule-ui bg-purple-900/20 border-purple-500/20', dot: 'bg-purple-400' },
  { value: 'pink', class: 'capsule-ui bg-pink-900/20 border-pink-500/20', dot: 'bg-pink-400' },
];

const FOLDERS = ['Personal', 'Work', 'Ideas', 'Journal', 'Archive'];

const TEMPLATES = [
  { label: 'Meeting Notes', icon: '📋', content: '## Meeting Notes\n\n**Date:** \n**Attendees:** \n\n### Agenda\n1. \n\n### Action Items\n- [ ] \n' },
  { label: 'Daily Journal', icon: '📔', content: '## Daily Journal\n\n**Date:** \n\n### What went well\n\n### What to improve\n\n### Gratitude\n' },
  { label: 'Todo List', icon: '✅', content: '## To-Do List\n\n- [ ] \n- [ ] \n- [ ] \n' },
  { label: 'Brainstorm', icon: '💡', content: '## Brainstorm\n\n**Topic:** \n\n### Ideas\n- \n\n### Next Steps\n- [ ] \n' },
  { label: 'Project Plan', icon: '🚀', content: '## Project Plan\n\n**Project Name:** \n**Objective:** \n\n### Milestones\n1. \n\n### Tasks\n- [ ] \n' },
  { label: 'Reading Notes', icon: '📚', content: '## Reading Notes\n\n**Title:** \n**Author:** \n\n### Key Takeaways\n- \n\n### Summary\n\n' },
];

const THEME_BACKGROUNDS = [
  { value: 'none', label: 'None', url: '', textColor: '' },
  { value: 'theme1', label: 'Theme 1', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSh746ubpwYVFlrtd2GDFZC1uwkU_POllYPQN8CogODjqZsLpCwllq3PTg&s=10', textColor: '#ffffff' },
  { value: 'theme2', label: 'Theme 2', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2lnVXlvBn9W_qRrRmMV1z6JUHrpwNfEPkjMfKc8Duug&s=10', textColor: '#ffffff' },
  { value: 'theme3', label: 'Theme 3', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0bj6N2kaAfv10xEL3ixEhJNXV8B36oHUS8WzT2wAq-g&s=10', textColor: '#ffffff' },
  { value: 'theme4', label: 'Theme 4', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxxGr0IsP-VAEd-jf7bsXKfDaIxnx8TdoqO9tja25Q3Q&s=10', textColor: '#ffffff' },
  { value: 'theme5', label: 'Theme 5', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhyu_ITeSVuqS9Trxw59GnBMzJ2gNvM8V0W1kjXjBLHw&s=10', textColor: '#ffffff' },
  { value: 'theme6', label: 'Theme 6', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0V5HUWaihJNs7o7GAIcJvPGMzN2bUgMpxHju4pGEHeQ&s=10', textColor: '#ffffff' },
  { value: 'theme7', label: 'Theme 7', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjL7rV6NAYYHSfeI_kGIdH1upCtNFzsIC0DdTSJEiONQ&s=10', textColor: '#ffffff' },
];

function getBackgroundStyle(bgValue) {
  if (!bgValue || bgValue === 'none') return {};
  const bg = THEME_BACKGROUNDS.find(b => b.value === bgValue);
  return bg ? { backgroundImage: `url(${bg.url})`, backgroundSize: 'cover', backgroundPosition: 'center', color: bg.textColor } : {};
}

// ─── Audio Recorder Hook ───────────────────────────────────
function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [waveform, setWaveform] = useState(new Array(20).fill(4));
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    const bars = 20;
    const step = Math.floor(data.length / bars);
    const newWaveform = [];
    for (let i = 0; i < bars; i++) {
      const val = data[i * step] || 0;
      newWaveform.push(Math.max(4, (val / 255) * 32));
    }
    setWaveform(newWaveform);
    animFrameRef.current = requestAnimationFrame(updateWaveform);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      audioChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        setWaveform(new Array(20).fill(4));
      };

      recorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setAudioBlob(null);

      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      updateWaveform();
    } catch {
      console.error('Mic access denied');
    }
  }, [updateWaveform]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.pause();
      setIsPaused(true);
      clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'paused') {
      mediaRecorder.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      updateWaveform();
    }
  }, [updateWaveform]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
    clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  const resetRecording = useCallback(() => {
    setAudioBlob(null);
    setDuration(0);
    setWaveform(new Array(20).fill(4));
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  return { isRecording, isPaused, duration, audioBlob, waveform, startRecording, pauseRecording, resumeRecording, stopRecording, resetRecording };
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// ─── Waveform visualizer ───────────────────────────────────
function WaveformVisualizer({ waveform, isActive }) {
  return (
    <div className="flex items-center gap-[2px] h-8">
      {waveform.map((h, i) => (
        <motion.div
          key={i}
          className={cn('w-[3px] rounded-full', isActive ? 'bg-red-400' : 'bg-muted-foreground/30')}
          animate={{ height: h }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        />
      ))}
    </div>
  );
}

// ─── Custom Audio Player ───────────────────────────────────
function AudioPlayer({ src }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dur, setDur] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(!playing);
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setProgress(el.currentTime);
    const onMeta = () => setDur(el.duration || 0);
    const onEnd = () => { setPlaying(false); setProgress(0); };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('ended', onEnd);
    return () => { el.removeEventListener('timeupdate', onTime); el.removeEventListener('loadedmetadata', onMeta); el.removeEventListener('ended', onEnd); };
  }, [src]);

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (audioRef.current) audioRef.current.currentTime = pct * dur;
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/40">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button onClick={toggle} className="p-2 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors flex-shrink-0">
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <div className="flex-1 min-w-0 space-y-1">
        <div onClick={seek} className="w-full h-2 rounded-full bg-muted cursor-pointer relative overflow-hidden">
          <motion.div className="h-full rounded-full bg-primary" style={{ width: dur ? `${(progress / dur) * 100}%` : '0%' }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{formatTime(Math.floor(progress))}</span>
          <span>{formatTime(Math.floor(dur))}</span>
        </div>
      </div>
      <Volume2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
    </div>
  );
}

// ─── Image Crop Dialog ─────────────────────────────────────
function ImageCropOverlay({ src, onSave, onClose }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 200, h: 200 });
  const [dragging, setDragging] = useState(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  const onImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const scale = Math.min(400 / img.naturalWidth, 400 / img.naturalHeight, 1);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    setImgSize({ w, h });
    setCrop({ x: w * 0.1, y: h * 0.1, w: w * 0.8, h: h * 0.8 });
  };

  const handleMouseDown = (e, type) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startCrop = { ...crop };

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (type === 'move') {
        setCrop({
          ...startCrop,
          x: Math.max(0, Math.min(imgSize.w - startCrop.w, startCrop.x + dx)),
          y: Math.max(0, Math.min(imgSize.h - startCrop.h, startCrop.y + dy)),
        });
      } else {
        const newW = Math.max(40, Math.min(imgSize.w - startCrop.x, startCrop.w + dx));
        const newH = Math.max(40, Math.min(imgSize.h - startCrop.y, startCrop.h + dy));
        setCrop({ ...startCrop, w: newW, h: newH });
      }
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const saveCrop = () => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement('canvas');
    const scaleX = img.naturalWidth / imgSize.w;
    const scaleY = img.naturalHeight / imgSize.h;
    canvas.width = crop.w * scaleX;
    canvas.height = crop.h * scaleY;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, crop.x * scaleX, crop.y * scaleY, crop.w * scaleX, crop.h * scaleY, 0, 0, canvas.width, canvas.height);
    onSave(canvas.toDataURL('image/jpeg', 0.85));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-card rounded-2xl p-4 max-w-lg w-full space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Crop Image</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="relative inline-block mx-auto" style={{ width: imgSize.w || 'auto', height: imgSize.h || 'auto' }}>
          <img ref={imgRef} src={src} alt="crop" onLoad={onImgLoad} className="block max-w-full" style={{ width: imgSize.w || 'auto', height: imgSize.h || 'auto' }} crossOrigin="anonymous" />
          {/* Dark overlay outside crop */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to right, rgba(0,0,0,0.6) ${crop.x}px, transparent ${crop.x}px, transparent ${crop.x + crop.w}px, rgba(0,0,0,0.6) ${crop.x + crop.w}px)` }} />
          {/* Crop selection */}
          <div
            className="absolute border-2 border-primary cursor-move"
            style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }}
            onMouseDown={e => handleMouseDown(e, 'move')}
          >
            <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize" onMouseDown={e => { e.stopPropagation(); handleMouseDown(e, 'resize'); }} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button size="sm" onClick={saveCrop} className="rounded-xl">Apply Crop</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Photo Gallery in View Dialog ──────────────────────────
function PhotoGallery({ images }) {
  const [viewImg, setViewImg] = useState(null);
  if (!images?.length) return null;
  return (
    <>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Image className="w-3 h-3" /> Photos ({images.length})</p>
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <motion.button key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setViewImg(img)}
              className="w-16 h-16 rounded-lg overflow-hidden border border-border/40 hover:border-primary/40 transition-colors relative group">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {viewImg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4 cursor-pointer" onClick={() => setViewImg(null)}>
            <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} src={viewImg} alt="" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Background Picker ─────────────────────────────────────
function BackgroundPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} title="Background theme" className="p-1.5 rounded-md hover:bg-background transition-colors text-muted-foreground hover:text-foreground">
        <Palette className="w-3.5 h-3.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            className="absolute top-full right-0 mt-1 z-50 p-3 rounded-xl bg-card border border-border/60 shadow-xl w-72"
          >
            <p className="text-xs font-medium text-muted-foreground mb-2">Nature Background</p>
            <div className="grid grid-cols-4 gap-1.5">
              {THEME_BACKGROUNDS.map(bg => (
                <button
                  key={bg.value}
                  onClick={() => { onChange(bg.value); setOpen(false); }}
                  className={cn(
                    'aspect-square w-full bg-cover bg-center overflow-hidden rounded-lg border-2 transition-all text-[8px] font-medium flex items-end p-1 leading-tight',
                    value === bg.value ? 'border-primary ring-1 ring-primary/30' : 'border-border/30 hover:border-border/60'
                  )}
                  style={bg.url ? { backgroundImage: `url(${bg.url})`, backgroundSize: 'cover', backgroundPosition: 'center', color: '#fff' } : { background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                >
                  {bg.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Text Color Picker ─────────────────────────────────────
function TextColorPicker({ onColorSelect }) {
  const [open, setOpen] = useState(false);
  const colors = ['#ffffff', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899'];
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} title="Text Color" className="p-1.5 rounded-md hover:bg-background transition-colors text-muted-foreground hover:text-foreground">
        <div className="w-3.5 h-3.5 rounded-full border border-current" style={{ background: 'linear-gradient(135deg, #ef4444, #3b82f6)' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            className="absolute top-full left-0 mt-1 z-50 p-2 rounded-xl bg-card border border-border/60 shadow-xl flex gap-1.5"
          >
            {colors.map(c => (
              <button
                key={c}
                onClick={() => { onColorSelect(c); setOpen(false); }}
                className="w-5 h-5 rounded-full border border-border/40 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Drawing Canvas ─────────────────────────────────────────
function DrawingCanvas({ onSave, onCancel }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    draw(e);
  };
  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if(canvas) canvas.getContext('2d').beginPath();
  };
  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);
    const offsetX = x - rect.left;
    const offsetY = y - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;

    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if(canvas) onSave(canvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-black/80 flex flex-col items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-card w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl flex flex-col h-[80vh]">
        <div className="p-4 flex items-center justify-between border-b border-border/40 flex-wrap gap-2">
          <h3 className="font-semibold text-lg flex items-center gap-2"><PenTool className="w-5 h-5"/> Sketch</h3>
          <div className="flex items-center gap-4">
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
            <input type="range" min="1" max="20" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-24 accent-primary" />
            <Button variant="outline" size="sm" onClick={onCancel} className="rounded-xl">Cancel</Button>
            <Button size="sm" onClick={save} className="rounded-xl">Save</Button>
          </div>
        </div>
        <div className="flex-1 relative bg-black cursor-crosshair">
          <canvas
            ref={canvasRef}
            className="w-full h-full touch-none"
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onMouseMove={draw}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Speech To Text Hook ────────────────────────────────────
function useSpeechToText(onResult) {
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.onresult = (e) => {
        let text = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            text += e.results[i][0].transcript + ' ';
          }
        }
        if (text) onResult(text);
      };
      recognition.onerror = () => setIsDictating(false);
      recognition.onend = () => setIsDictating(false);
      recognitionRef.current = recognition;
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    }
  }, [onResult]);

  const toggleDictation = () => {
    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
    } else {
      recognitionRef.current?.start();
      setIsDictating(true);
    }
  };

  return { isDictating, toggleDictation, supported: !!(window.SpeechRecognition || window.webkitSpeechRecognition) };
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

// ═══ Brand New Note Preview Architecture ═══
function NotePreviewScreen({ viewNote, onClose, onShare, onEdit }) {
  const hasThemeBg = viewNote.background && viewNote.background !== 'none';
  const themeBgStyle = hasThemeBg ? getBackgroundStyle(viewNote.background) : {};
  const hasImages = Array.isArray(viewNote.images) && viewNote.images.length > 0;
  // If the first image exists, we treat it as the hero cover
  const coverImage = hasImages ? viewNote.images[0] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[999] overflow-y-auto no-scrollbar flex flex-col bg-background text-foreground"
    >
      {/* 1. Continuous Background Underlay */}
      {hasThemeBg && (
        <div 
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: themeBgStyle.backgroundImage,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        </div>
      )}

      {/* 2. Floating Header (Glassmorphism) */}
      <div className={cn(
        "sticky top-0 z-50 flex items-center justify-between p-4 sm:px-6 backdrop-blur-2xl border-b transition-colors",
        hasThemeBg ? "bg-black/40 border-white/10" : "bg-background/80 border-border/50"
      )}>
        <button 
          onClick={onClose} 
          className={cn(
            "p-2.5 rounded-full transition-colors flex items-center justify-center shadow-sm",
            hasThemeBg ? "bg-white/10 hover:bg-white/20 text-white" : "bg-muted hover:bg-muted/80 text-foreground border border-border/50"
          )}
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex gap-3">
          <button 
            onClick={onShare} 
            className={cn(
              "px-4 py-2.5 rounded-full transition-colors flex items-center gap-2 shadow-sm font-semibold text-sm",
              hasThemeBg ? "bg-white/10 hover:bg-white/20 text-white" : "bg-muted hover:bg-muted/80 text-foreground border border-border/50"
            )}
          >
            <Share className="w-4 h-4" /> <span className="hidden sm:inline">Share</span>
          </button>
          <button 
            onClick={onEdit} 
            className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all flex items-center gap-2 shadow-md font-bold text-sm hover:scale-105"
          >
            <Pencil className="w-4 h-4" /> <span>Edit</span>
          </button>
        </div>
      </div>

      {/* 3. Main Scrollable Content */}
      <div className="relative z-10 pb-32 flex flex-col flex-1">
        
        {/* Hero Area */}
        {coverImage ? (
          <div className="relative w-full h-[260px] sm:h-[320px] shrink-0">
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover rounded-b-[2rem]" />
            <div className="absolute inset-0 rounded-b-[2rem] bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
        ) : hasThemeBg ? (
          <div className="w-full h-[120px] sm:h-[160px] shrink-0" />
        ) : (
          <div className="w-full h-[200px] sm:h-[240px] shrink-0 rounded-b-[2rem] bg-gradient-to-br from-primary/20 via-background to-muted" />
        )}

        {/* Content Card */}
        <div className={cn(
          "max-w-4xl w-full mx-auto px-4 sm:px-8 shrink-0 flex-1",
          (coverImage || !hasThemeBg) ? "-mt-16 sm:-mt-24" : ""
        )}>
          <div className={cn(
            "rounded-[2rem] p-6 sm:p-10 shadow-2xl backdrop-blur-2xl border",
            hasThemeBg ? "bg-black/60 border-white/10 text-white" : "bg-card/90 border-border/50 text-foreground"
          )}>
            
            {/* Title & Metadata */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight break-words">
              {viewNote.title || 'Untitled Note'}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <span className={cn("flex items-center gap-1.5 text-sm font-medium", hasThemeBg ? "text-white/70" : "text-muted-foreground")}>
                <Calendar className="w-4 h-4" />
                {viewNote.updated_date ? new Date(viewNote.updated_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Just now'}
              </span>
              {viewNote.folder && (
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                  hasThemeBg ? "bg-white/10 border-white/20 text-white" : "bg-primary/10 border-primary/20 text-primary"
                )}>
                  <Folder className="w-3.5 h-3.5 inline mr-1" /> {viewNote.folder}
                </span>
              )}
              {viewNote.tags?.map(t => (
                <span key={t} className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold border shadow-sm",
                  hasThemeBg ? "bg-white/10 border-white/10 text-white/90" : "bg-background border-border/50 text-foreground"
                )}>
                  #{t}
                </span>
              ))}
            </div>

            {/* Note Body Render */}
            <div className="ql-snow">
              <div 
                className={cn(
                  "ql-editor prose prose-base sm:prose-lg max-w-none px-0 py-0 break-words",
                  hasThemeBg ? "prose-invert text-white/90" : "dark:prose-invert text-foreground"
                )}
                style={{ overflowY: 'visible', minHeight: 'auto' }}
              >
                {viewNote.content ? (
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(viewNote.content) }} />
                ) : (
                  <p className={cn("italic", hasThemeBg ? "text-white/40" : "text-muted-foreground")}>Empty note.</p>
                )}
              </div>
            </div>

            {/* Attachments (Gallery & Audio) */}
            {(hasImages || viewNote.audio) && (
              <div className={cn("mt-10 pt-8 border-t space-y-8", hasThemeBg ? "border-white/10" : "border-border/50")}>
                {hasImages && (
                  <PhotoGallery images={viewNote.images} />
                )}
                {viewNote.audio && (
                  <div>
                    <p className={cn("text-sm font-bold flex items-center gap-2 mb-3", hasThemeBg ? "text-white/80" : "text-muted-foreground")}>
                      <Mic className="w-4 h-4" /> Voice Note
                    </p>
                    <AudioPlayer src={viewNote.audio} />
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Notes() {

  const [search, setSearch] = useLocalStorageState('notes_search', '');
  const [editNote, setEditNote] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [viewNote, setViewNote] = useState(null);
  const [activeFolder, setActiveFolder] = useLocalStorageState('notes_folder', 'all');
  const [newTag, setNewTag] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropIndex, setCropIndex] = useState(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const queryClient = useQueryClient();
  const recorder = useAudioRecorder();
  
  const handleDictationResult = useCallback((text) => {
    setEditNote(prev => ({ ...prev, content: (prev.content || '') + text }));
  }, []);
  const speech = useSpeechToText(handleDictationResult);

  const { data: notes = [] } = useQuery({
    queryKey: ['notes'],
    queryFn: () => db.entities.Note.list('-updated_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Note.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notes'] }); closeEditor(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Note.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notes'] }); closeEditor(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Note.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  // Mutation just for toggling checkboxes in view mode without closing dialogs
  const silentUpdateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Note.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  const openNewNote = (template = null) => {
    setEditNote({
      title: template?.label || '',
      content: template?.content || '',
      color: 'default',
      pinned: false,
      favorite: false,
      tags: [],
      folder: activeFolder !== 'all' ? activeFolder : '',
      images: [],
      audio: '',
      background: 'none',
    });
    setShowEditor(true);
    setShowTemplates(false);
  };

  const openView = (note) => { setViewNote(note); };

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('oras-fullscreen-overlay', { detail: { open: Boolean(viewNote) } }));
    document.body.style.overflow = viewNote ? 'hidden' : '';
    return () => {
      window.dispatchEvent(new CustomEvent('oras-fullscreen-overlay', { detail: { open: false } }));
      document.body.style.overflow = '';
    };
  }, [viewNote]);
  const shareNote = async (note) => {
    const plainText = (note.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const payload = {
      title: note.title || 'ORAs Note',
      text: `${note.title || 'ORAs Note'}${plainText ? `\n\n${plainText.slice(0, 500)}` : ''}`,
    };
    try {
      if (navigator.share) await navigator.share(payload);
      else await navigator.clipboard.writeText(payload.text);
    } catch {}
  };
  const openEdit = (note) => {
    setEditNote({
      ...note,
      images: note.images || [],
      audio: note.audio || '',
      background: note.background || 'none',
    });
    setShowEditor(true);
    setViewNote(null);
  };
  const closeEditor = () => { setEditNote(null); setShowEditor(false); setShowRecorder(false); recorder.resetRecording(); };

  const saveNote = () => {
    if (!editNote.title.trim()) return;
    if (editNote.id) updateMutation.mutate({ id: editNote.id, data: editNote });
    else createMutation.mutate(editNote);
  };

  const togglePin = (note, e) => {
    e.stopPropagation();
    updateMutation.mutate({ id: note.id, data: { pinned: !note.pinned } });
  };

  const toggleFavorite = (note, e) => {
    e.stopPropagation();
    updateMutation.mutate({ id: note.id, data: { favorite: !note.favorite } });
  };

  const addTag = () => {
    if (!newTag.trim() || editNote.tags?.includes(newTag.trim())) return;
    setEditNote({ ...editNote, tags: [...(editNote.tags || []), newTag.trim()] });
    setNewTag('');
  };

  const removeTag = (tag) => {
    setEditNote({ ...editNote, tags: editNote.tags.filter(t => t !== tag) });
  };

  // Photo handling
  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newImages = [...(editNote.images || [])];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const base64 = await blobToBase64(file);
      newImages.push(base64);
    }
    setEditNote({ ...editNote, images: newImages });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index) => {
    const images = [...(editNote.images || [])];
    images.splice(index, 1);
    setEditNote({ ...editNote, images });
  };

  const openCropForImage = (index) => {
    setCropImage(editNote.images[index]);
    setCropIndex(index);
  };

  const handleCropSave = (croppedDataUrl) => {
    const images = [...(editNote.images || [])];
    images[cropIndex] = croppedDataUrl;
    setEditNote({ ...editNote, images });
    setCropImage(null);
    setCropIndex(null);
  };

  const handleCanvasSave = (dataUrl) => {
    const newImages = [...(editNote.images || []), dataUrl];
    setEditNote({ ...editNote, images: newImages });
    setShowCanvas(false);
  };

  // Audio handling
  const saveAudioToNote = async () => {
    if (recorder.audioBlob) {
      const base64 = await blobToBase64(recorder.audioBlob);
      setEditNote(prev => ({ ...prev, audio: base64 }));
      recorder.resetRecording();
      setShowRecorder(false);
    }
  };

  const removeAudio = () => {
    setEditNote({ ...editNote, audio: '' });
  };

  let filtered = notes.filter(n =>
    (n.title?.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase())) &&
    (activeFolder === 'all' || n.folder === activeFolder)
  );

  const pinned = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);

  const folders = [...new Set(notes.map(n => n.folder).filter(Boolean))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between gap-3">
        <motion.h1 initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} className="text-2xl font-bold tracking-tight">Notes</motion.h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowTemplates(true)} size="sm" variant="outline" className="gap-1.5 rounded-full text-xs">
            <FileText className="w-3.5 h-3.5" /> Templates
          </Button>
          <Button onClick={() => openNewNote()} size="sm" className="gap-1.5 rounded-full">
            <Plus className="w-4 h-4" /> New Note
          </Button>
        </div>
      </div>

      {/* Folder tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {['all', ...FOLDERS.filter(f => folders.includes(f) || activeFolder === f)].map(f => (
          <button
            key={f}
            onClick={() => setActiveFolder(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
              activeFolder === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {f === 'all' ? '📂 All Notes' : `📁 ${f}`}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search notes, tags, folders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-full bg-muted/50" />
      </div>

      {pinned.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Pin className="w-3 h-3" /> Pinned
          </p>
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4">
            {pinned.map((note, i) => (
              <NoteCard key={note.id} note={note} index={i} onClick={() => openView(note)} onPin={(e) => togglePin(note, e)} onFavorite={(e) => toggleFavorite(note, e)} onDelete={() => deleteMutation.mutate(note.id)} />
            ))}
          </div>
        </div>
      )}

      <div>
        {pinned.length > 0 && <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 mt-6">All Notes</p>}
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4">
          <AnimatePresence>
            {unpinned.map((note, i) => (
              <NoteCard key={note.id} note={note} index={i} onClick={() => openView(note)} onPin={(e) => togglePin(note, e)} onFavorite={(e) => toggleFavorite(note, e)} onDelete={() => deleteMutation.mutate(note.id)} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {filtered.length === 0 && (
        <EmptyState 
          icon={<FileText />} 
          title="Write your first note" 
          description="Capture your thoughts, ideas, and daily journaling instantly."
          action={{ label: "Add Note", icon: <Plus className="w-4 h-4" />, onClick: openAdd }}
        />
      )}

      {/* ═══ View-only Note Full-Page Preview ═══ */}
      <AnimatePresence>
        {viewNote && (
          <NotePreviewScreen 
            viewNote={viewNote} 
            onClose={() => setViewNote(null)} 
            onShare={() => shareNote(viewNote)} 
            onEdit={() => openEdit(viewNote)} 
          />
        )}
      </AnimatePresence>

      {/* ═══ Templates Dialog ═══ */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Choose a Template</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-1">
            {TEMPLATES.map(t => (
              <button key={t.label} onClick={() => openNewNote(t)} className="p-4 rounded-2xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group">
                <div className="text-2xl mb-2">{t.icon}</div>
                <p className="text-sm font-semibold">{t.label}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Editor Dialog ═══ */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editNote?.id ? 'Edit Note' : 'New Note'}
            </DialogTitle>
          </DialogHeader>
          {editNote && (
            <div className="space-y-4">
              <div className="sticky top-0 z-[60] bg-background pt-2 pb-3 flex flex-col gap-4 border-b border-border/10">
                <Input
                  placeholder="Note title"
                  value={editNote.title}
                  onChange={(e) => setEditNote({ ...editNote, title: e.target.value })}
                  className="text-4xl font-extrabold tracking-tight border-0 border-b-2 border-border/30 rounded-none px-0 pb-2 focus-visible:ring-0 focus-visible:border-primary shadow-none bg-transparent"
                />

                {/* Extras toolbar */}
                <div className="flex items-center gap-2 p-2 bg-muted/40 rounded-xl w-fit flex-wrap border border-border/40 shadow-sm">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Media & Extras</div>
                  <div className="w-px h-5 bg-border/60 mx-1" />
                  <button onClick={() => fileInputRef.current?.click()} title="Add Photo" className="p-2 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-foreground shadow-sm">
                    <Image className="w-4 h-4" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                  
                  <button onClick={() => setShowCanvas(true)} title="Draw Sketch" className="p-2 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-foreground shadow-sm">
                    <PenTool className="w-4 h-4" />
                  </button>
                  
                  <button onClick={() => setShowRecorder(!showRecorder)} title="Record Audio File"
                    className={cn('p-2 rounded-lg transition-colors shadow-sm', showRecorder || recorder.isRecording ? 'bg-red-500/20 text-red-500' : 'hover:bg-background text-muted-foreground hover:text-foreground')}>
                    <Mic className="w-4 h-4" />
                  </button>
                  
                  {speech.supported && (
                    <button onClick={speech.toggleDictation} title="Voice to Text"
                      className={cn('p-2 rounded-lg transition-colors shadow-sm', speech.isDictating ? 'bg-blue-500/20 text-blue-500 animate-pulse' : 'hover:bg-background text-muted-foreground hover:text-foreground')}>
                      <Type className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Audio Recorder Panel */}
              <AnimatePresence>
                {showRecorder && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 rounded-xl border border-border/40 bg-muted/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-2 h-2 rounded-full', recorder.isRecording && !recorder.isPaused ? 'bg-red-500 animate-pulse' : 'bg-muted-foreground/30')} />
                          <span className="text-xs font-mono font-medium">{formatTime(recorder.duration)}</span>
                        </div>
                        <WaveformVisualizer waveform={recorder.waveform} isActive={recorder.isRecording && !recorder.isPaused} />
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        {!recorder.isRecording && !recorder.audioBlob && (
                          <Button size="sm" onClick={recorder.startRecording} className="rounded-xl gap-1.5 bg-red-600 hover:bg-red-700 text-white">
                            <Mic className="w-3.5 h-3.5" /> Start Recording
                          </Button>
                        )}
                        {recorder.isRecording && (
                          <>
                            <Button size="sm" variant="outline" onClick={recorder.isPaused ? recorder.resumeRecording : recorder.pauseRecording} className="rounded-xl gap-1.5">
                              {recorder.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                              {recorder.isPaused ? 'Resume' : 'Pause'}
                            </Button>
                            <Button size="sm" onClick={recorder.stopRecording} className="rounded-xl gap-1.5 bg-red-600 hover:bg-red-700 text-white">
                              <Square className="w-3 h-3 fill-current" /> Stop
                            </Button>
                          </>
                        )}
                        {recorder.audioBlob && !recorder.isRecording && (
                          <>
                            <Button size="sm" onClick={saveAudioToNote} className="rounded-xl gap-1.5">
                              <Volume2 className="w-3.5 h-3.5" /> Attach to Note
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { recorder.resetRecording(); }} className="rounded-xl gap-1.5">
                              <Trash2 className="w-3.5 h-3.5" /> Discard
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Existing audio indicator */}
              {editNote.audio && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/30">
                  <Volume2 className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground flex-1">Voice note attached</span>
                  <button onClick={removeAudio} className="p-1 rounded-md hover:bg-destructive/20 text-destructive transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Background preview */}
              {editNote.background && editNote.background !== 'none' && (
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-xl border border-border/30 w-fit">
                  <div className="w-8 h-5 rounded-md border border-border/30" style={getBackgroundStyle(editNote.background)} />
                  <span className="text-xs font-medium text-muted-foreground pr-2">
                    {THEME_BACKGROUNDS.find(b => b.value === editNote.background)?.label}
                  </span>
                  <button onClick={() => setEditNote({ ...editNote, background: 'none' })} className="ml-auto p-1 rounded-md hover:bg-destructive/20 text-destructive transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="quill-editor-container border border-border/40 rounded-xl overflow-visible shadow-sm focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all bg-background">
                <style>{`
                  .quill-editor-container .ql-toolbar {
                    border: none;
                    border-bottom: 1px solid hsl(var(--border) / 0.4);
                    background: hsl(var(--muted) / 0.3);
                    padding: 8px 12px;
                    border-top-left-radius: 0.75rem;
                    border-top-right-radius: 0.75rem;
                  }
                  .quill-editor-container .ql-container {
                    border: none;
                    font-size: 1rem;
                    font-family: inherit;
                    min-height: 250px;
                    border-bottom-left-radius: 0.75rem;
                    border-bottom-right-radius: 0.75rem;
                  }
                  .quill-editor-container .ql-editor {
                    min-height: 250px;
                    padding: 1rem;
                  }
                  .quill-editor-container .ql-stroke {
                    stroke: hsl(var(--foreground));
                  }
                  .quill-editor-container .ql-fill {
                    fill: hsl(var(--foreground));
                  }
                  .quill-editor-container .ql-picker {
                    color: hsl(var(--foreground));
                  }
                  .quill-editor-container .ql-picker-options {
                    background-color: hsl(var(--card));
                    border-color: hsl(var(--border));
                  }
                  .quill-editor-container .ql-tooltip {
                    background-color: hsl(var(--card));
                    border-color: hsl(var(--border));
                    color: hsl(var(--foreground));
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                  }
                  .quill-editor-container .ql-tooltip input[type=text] {
                    background-color: hsl(var(--background));
                    border-color: hsl(var(--border));
                    color: hsl(var(--foreground));
                  }
                `}</style>
                <div id="editor-toolbar" className="ql-toolbar flex items-center flex-wrap gap-1 border-b border-border/40 bg-muted/30 px-3 py-2 rounded-t-xl overflow-x-auto no-scrollbar">
                  <span className="ql-formats">
                    <select className="ql-header" defaultValue="">
                      <option value="1"></option>
                      <option value="2"></option>
                      <option value="3"></option>
                      <option value=""></option>
                    </select>
                    <select className="ql-font" defaultValue="">
                      <option value=""></option>
                      <option value="serif"></option>
                      <option value="monospace"></option>
                    </select>
                    <select className="ql-size" defaultValue="">
                      <option value="small"></option>
                      <option value=""></option>
                      <option value="large"></option>
                      <option value="huge"></option>
                    </select>
                  </span>
                  <span className="ql-formats">
                    <button className="ql-bold"></button>
                    <button className="ql-italic"></button>
                    <button className="ql-underline"></button>
                    <button className="ql-strike"></button>
                  </span>
                  <span className="ql-formats">
                    <select className="ql-color"></select>
                    <select className="ql-background"></select>
                  </span>
                  <span className="ql-formats">
                    <button className="ql-script" value="sub"></button>
                    <button className="ql-script" value="super"></button>
                  </span>
                  <span className="ql-formats">
                    <button className="ql-list" value="ordered"></button>
                    <button className="ql-list" value="bullet"></button>
                    <button className="ql-list" value="check"></button>
                    <select className="ql-align"></select>
                  </span>
                  <span className="ql-formats">
                    <button className="ql-link"></button>
                    <button className="ql-image"></button>
                    <button className="ql-blockquote"></button>
                    <button className="ql-code-block"></button>
                  </span>
                  <span className="ql-formats">
                    <button className="ql-clean"></button>
                  </span>
                  <div className="ml-auto pl-2 border-l border-border/40 flex items-center shrink-0">
                    <BackgroundPicker value={editNote.background || 'none'} onChange={(v) => setEditNote({ ...editNote, background: v })} />
                  </div>
                </div>
                <DeferredQuill
                  theme="snow"
                  placeholder="Write your note..."
                  value={editNote.content || ''}
                  onChange={(content) => setEditNote({ ...editNote, content })}
                  modules={{
                    toolbar: '#editor-toolbar'
                  }}
                />
              </div>

              {/* Image thumbnails */}
              {editNote.images?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Image className="w-3 h-3" /> Attached Photos</p>
                  <div className="flex gap-2 flex-wrap">
                    {editNote.images.map((img, i) => (
                      <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border/40">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1">
                          <button onClick={() => openCropForImage(i)} className="p-1 rounded-md bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity" title="Crop">
                            <ZoomIn className="w-3 h-3" />
                          </button>
                          <button onClick={() => removeImage(i)} className="p-1 rounded-md bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove">
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Folder */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Folder</label>
                  <Select value={editNote.folder || ''} onValueChange={(v) => setEditNote({ ...editNote, folder: v })}>
                    <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue placeholder="No folder" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>No folder</SelectItem>
                      {FOLDERS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {/* Color */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Color</label>
                  <div className="flex gap-1.5 pt-1">
                    {colorOptions.map((c) => (
                      <button key={c.value} onClick={() => setEditNote({ ...editNote, color: c.value })}
                        className={cn('w-5 h-5 rounded-full border-2 transition-transform', c.dot, editNote.color === c.value ? 'border-foreground scale-110' : 'border-transparent')}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1"><Hash className="w-3 h-3" /> Tags</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {editNote.tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Add tag..." value={newTag} onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()} className="h-8 text-xs rounded-xl" />
                  <Button size="sm" variant="outline" onClick={addTag} className="h-8 rounded-xl text-xs">Add</Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Note Actions</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditNote({ ...editNote, favorite: !editNote.favorite })}
                    className={cn('p-2 rounded-lg transition-colors', editNote.favorite ? 'text-pink-500 bg-pink-500/10' : 'text-muted-foreground hover:bg-muted')}
                    title="Favorite"
                  >
                    <Heart className={cn('w-4 h-4', editNote.favorite && 'fill-pink-500')} />
                  </button>
                  <button
                    onClick={() => setEditNote({ ...editNote, pinned: !editNote.pinned })}
                    className={cn('p-2 rounded-lg transition-colors', editNote.pinned ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted')}
                    title="Pin"
                  >
                    <Pin className={cn('w-4 h-4', editNote.pinned && 'fill-primary')} />
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={closeEditor} className="rounded-xl">Cancel</Button>
                <Button onClick={saveNote} className="rounded-xl">Save Note</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Crop Overlay */}
      <AnimatePresence>
        {cropImage && (
          <ImageCropOverlay
            src={cropImage}
            onSave={handleCropSave}
            onClose={() => { setCropImage(null); setCropIndex(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCanvas && (
          <DrawingCanvas
            onSave={handleCanvasSave}
            onCancel={() => setShowCanvas(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Note Card Component ───────────────────────────────────
function NoteCard({ note, index, onClick, onPin, onFavorite, onDelete }) {
  const bgClass = colorOptions.find(c => c.value === note.color)?.class || 'bg-card border border-border/40';
  const hasBg = note.background && note.background !== 'none';
  const bgStyle = hasBg ? getBackgroundStyle(note.background) : {};
  const hasImages = note.images?.length > 0;
  const hasAudio = !!note.audio;
  const hasChecklist = note.content && note.content.includes('data-list="check"');

  const contentLineClamp = note.content && note.content.length > 50 ? (note.id?.length % 2 === 0 ? 'line-clamp-6' : 'line-clamp-4') : 'line-clamp-3';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ delay: index * 0.025, type: 'spring', stiffness: 350, damping: 25 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn('mb-4 break-inside-avoid cursor-pointer group transition-all relative overflow-hidden shadow-sm hover:shadow-xl rounded-[2rem] min-h-[140px] flex flex-col', !hasBg && bgClass)}
      style={hasBg ? bgStyle : {}}
    >
      {/* Background overlay for readability on themed cards */}
      {hasBg && <div className="absolute inset-0 bg-black/10 pointer-events-none" />}

      {/* Top right actions overlay */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={onFavorite} className="p-1.5 rounded-full bg-background/80 backdrop-blur-md shadow-sm hover:bg-background/90 text-pink-500">
          <Heart className={cn('w-3.5 h-3.5', note.favorite && 'fill-pink-500')} />
        </button>
        <button onClick={onPin} className="p-1.5 rounded-full bg-background/80 backdrop-blur-md shadow-sm hover:bg-background/90 text-primary">
          <Pin className={cn('w-3.5 h-3.5', note.pinned && 'fill-primary')} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-full bg-background/80 backdrop-blur-md shadow-sm hover:bg-destructive/10 text-destructive">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Permanent visual indicators */}
      {note.favorite && (
        <div className="absolute -left-3 -top-3 w-10 h-10 bg-pink-500/10 rounded-full flex items-end justify-end p-2 z-[1]">
          <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
        </div>
      )}

      {/* Main card content */}
      <div className="p-4 h-full flex flex-col relative z-[2]">
        <h3 className={cn("font-semibold text-sm leading-tight line-clamp-2", hasBg && 'drop-shadow-sm', note.favorite ? 'ml-3' : '')}>{note.title}</h3>
        
        {/* Cover image preview if any */}
        {hasImages && (
          <div className="mt-2 mb-1 w-full h-24 rounded-xl overflow-hidden relative border border-border/20">
            <img src={note.images[0]} alt="cover" className="w-full h-full object-cover" />
            {note.images.length > 1 && (
              <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                +{note.images.length - 1}
              </div>
            )}
          </div>
        )}

        <p className={cn("text-xs mt-2 flex-1 leading-relaxed opacity-80", contentLineClamp)}>
          {note.content ? note.content.replace(/<[^>]*>/g, '').replace(/[#*_`]/g, '') : ''}
        </p>

        {/* Feature indicators at bottom */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-current/10">
          <div className="flex items-center gap-1.5">
            {hasAudio && <Mic className="w-3 h-3 opacity-70" />}
            {hasChecklist && <CheckSquare className="w-3 h-3 opacity-70" />}
            {note.tags?.length > 0 && <Hash className="w-3 h-3 opacity-70" />}
          </div>
          {note.folder && (
            <p className="text-[10px] font-medium opacity-70 flex items-center gap-1 ml-auto bg-current/5 px-2 py-0.5 rounded-full">
              <Folder className="w-2.5 h-2.5" /> {note.folder}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
