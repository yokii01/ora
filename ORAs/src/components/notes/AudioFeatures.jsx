import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function useAudioRecorder() {
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
      const audioCtx = new window.AudioContext();
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

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function WaveformVisualizer({ waveform, isActive }) {
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

export function AudioPlayer({ src }) {
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

export function useSpeechToText(onResult) {
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
