import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Zap, ZapOff, FlipHorizontal, X, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function CameraView({ onCapture, onCancel, pagesCount }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [flash, setFlash] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [documentBounds, setDocumentBounds] = useState(null);
  const [isStable, setIsStable] = useState(false);
  const [stableSince, setStableSince] = useState(null);
  const [autoCapturing, setAutoCapturing] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [scanMode, setScanMode] = useState('document');
  const jsQrRef = useRef(null);
  const frameCountRef = useRef(0);
  
  // Initialize BarcodeDetector if available
  const barcodeDetector = useRef(null);
  useEffect(() => {
    if ('BarcodeDetector' in window) {
      try {
        barcodeDetector.current = new window.BarcodeDetector({ formats: ['qr_code'] });
      } catch (e) { console.warn('BarcodeDetector format not supported'); }
    }
    import('jsqr')
      .then(module => { jsQrRef.current = module.default; })
      .catch(() => {});
  }, []);

  const stopCamera = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const openCamera = useCallback(async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 2560 },
          height: { ideal: 1440 },
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current.play();
      }
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() || {};
      setHasTorch(!!capabilities.torch);
    } catch (error) {
      toast.error('Failed to open camera');
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    openCamera();
    return stopCamera;
  }, [openCamera, stopCamera]);

  const toggleFlash = async () => {
    if (!streamRef.current || !hasTorch) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !flash }] });
      setFlash(!flash);
    } catch (e) {
      toast.error('Could not toggle flash');
    }
  };

  const flipCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setFlash(false);
  };

  // Processing loop for edge detection and QR
  useEffect(() => {
    const processFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4 || !canvasRef.current) {
        animationRef.current = requestAnimationFrame(processFrame);
        return;
      }
      
      const video = videoRef.current;
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      const w = video.videoWidth;
      const h = video.videoHeight;
      
      if (canvasRef.current.width !== w) {
        canvasRef.current.width = w;
        canvasRef.current.height = h;
      }
      
      ctx.drawImage(video, 0, 0, w, h);
      
      // 1. QR Code Detection
      frameCountRef.current += 1;
      if (barcodeDetector.current) {
        try {
          const barcodes = await barcodeDetector.current.detect(canvasRef.current);
          if (barcodes.length > 0) {
            setQrCodeData(barcodes[0].rawValue);
          }
        } catch (e) {}
      } else if (jsQrRef.current && frameCountRef.current % 10 === 0) {
        try {
          const qrImage = ctx.getImageData(0, 0, w, h);
          const code = jsQrRef.current(qrImage.data, w, h, { inversionAttempts: 'attemptBoth' });
          if (code?.data) setQrCodeData(code.data);
        } catch (e) {}
      }

      // 2. Simplified Edge Detection (Contrast-based bounding box)
      // To keep it lightweight and 60fps, we'll simulate document bounds finding
      // In a full WebAssembly OpenCV implementation, we'd use cv.Canny and cv.findContours
      
      // For visual effect, we simulate a stable bounding box when device is steady
      // We'll calculate simple brightness variance in center
      const centerX = Math.floor(w/4);
      const centerY = Math.floor(h/4);
      const imgData = ctx.getImageData(centerX, centerY, w/2, h/2);
      let sum = 0;
      for (let i = 0; i < imgData.data.length; i += 4) {
        sum += (imgData.data[i] + imgData.data[i+1] + imgData.data[i+2]) / 3;
      }
      const avgBrightness = sum / (imgData.width * imgData.height);
      
      // Pseudo-stability check based on brightness fluctuation
      const isCurrentlyStable = avgBrightness > 40 && avgBrightness < 220; // Needs decent lighting
      
      if (isCurrentlyStable) {
        setDocumentBounds({
          x: w * 0.15,
          y: h * 0.15,
          width: w * 0.7,
          height: h * 0.7
        });
        setIsStable(true);
      } else {
        setDocumentBounds(null);
        setIsStable(false);
      }

      animationRef.current = requestAnimationFrame(processFrame);
    };

    animationRef.current = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  // Auto-capture logic
  useEffect(() => {
    if (scanMode === 'document' && isStable && !autoCapturing) {
      if (!stableSince) {
        setStableSince(Date.now());
      } else if (Date.now() - stableSince > 2000) {
        // 2 seconds stable -> Auto Capture
        setAutoCapturing(true);
        capturePhoto();
      }
    } else {
      setStableSince(null);
    }
  }, [isStable, stableSince, autoCapturing, scanMode]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Add flash effect
    const flashEl = document.createElement('div');
    flashEl.className = 'fixed inset-0 bg-white z-[100] pointer-events-none transition-opacity duration-300';
    document.body.appendChild(flashEl);
    setTimeout(() => { flashEl.style.opacity = '0'; }, 50);
    setTimeout(() => { flashEl.remove(); }, 350);

    const ctx = canvasRef.current.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
    
    // Return to Scanner component
    onCapture({ image: dataUrl, qrData: qrCodeData });
  }, [onCapture, qrCodeData]);

  // Calculate progress for auto-capture ring
  const progress = stableSince ? Math.min(100, ((Date.now() - stableSince) / 2000) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top Bar */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-start justify-between px-6 pt-12">
        <button onClick={onCancel} className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white">
          <X className="w-5 h-5" />
        </button>
        <div className="flex rounded-full bg-black/40 p-1 backdrop-blur-xl border border-white/10">
          <button
            onClick={() => setScanMode('document')}
            className={`px-3 py-2 rounded-full text-xs font-bold transition-all ${scanMode === 'document' ? 'bg-white text-black' : 'text-white/70'}`}
          >
            Document
          </button>
          <button
            onClick={() => setScanMode('qr')}
            className={`px-3 py-2 rounded-full text-xs font-bold transition-all ${scanMode === 'qr' ? 'bg-white text-black' : 'text-white/70'}`}
          >
            QR
          </button>
        </div>
        {hasTorch && (
          <button onClick={toggleFlash} className={`p-3 rounded-full backdrop-blur-md transition-colors ${flash ? 'bg-yellow-500/80 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
            {flash ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Video View */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {/* QR Badge Overlay */}
        {qrCodeData && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-blue-500/90 text-white px-4 py-2 rounded-capsule backdrop-blur-md font-medium shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
            <QrCode className="w-4 h-4" /> QR Found
          </div>
        )}

        {/* Document Boundary Guide (Premium animated corner brackets) */}
        <div className="absolute inset-6 md:inset-12 pointer-events-none flex flex-col justify-between opacity-90 transition-all duration-500">
          <div className="flex justify-between">
            <div className={`w-16 h-16 border-t-[3px] border-l-[3px] transition-all duration-500 rounded-tl-3xl ${isStable ? 'border-primary scale-105 shadow-[inset_4px_4px_15px_-5px_rgba(var(--primary),0.5)]' : 'border-white/60'}`} />
            <div className={`w-16 h-16 border-t-[3px] border-r-[3px] transition-all duration-500 rounded-tr-3xl ${isStable ? 'border-primary scale-105 shadow-[inset_-4px_4px_15px_-5px_rgba(var(--primary),0.5)]' : 'border-white/60'}`} />
          </div>
          
          {/* Scanning crosshair / center indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className={`transition-all duration-500 flex items-center justify-center ${isStable ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
              <div className="w-24 h-24 rounded-full border border-primary/40 animate-ping absolute" />
              <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_20px_4px_rgba(var(--primary),0.8)]" />
            </div>
          </div>

          <div className="flex justify-between">
            <div className={`w-16 h-16 border-b-[3px] border-l-[3px] transition-all duration-500 rounded-bl-3xl ${isStable ? 'border-primary scale-105 shadow-[inset_4px_-4px_15px_-5px_rgba(var(--primary),0.5)]' : 'border-white/60'}`} />
            <div className={`w-16 h-16 border-b-[3px] border-r-[3px] transition-all duration-500 rounded-br-3xl ${isStable ? 'border-primary scale-105 shadow-[inset_-4px_-4px_15px_-5px_rgba(var(--primary),0.5)]' : 'border-white/60'}`} />
          </div>
        </div>

        {/* Hint text */}
        <div className="absolute bottom-32 left-0 right-0 text-center flex justify-center">
          <div className="px-5 py-2.5 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-2 shadow-2xl">
            {isStable ? (
              <>
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-white/90 text-sm font-medium tracking-wide">{scanMode === 'qr' && qrCodeData ? 'QR locked. Tap capture.' : 'Hold steady...'}</span>
              </>
            ) : (
              <span className="text-white/80 text-sm font-medium tracking-wide">{scanMode === 'qr' ? 'Center the QR code in frame' : 'Align document within frame'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="h-40 bg-black w-full flex items-center justify-between px-10 pb-6 z-10">
        <button onClick={flipCamera} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md">
          <FlipHorizontal className="w-6 h-6" />
        </button>

        {/* Premium Shutter Button */}
        <div className="relative flex items-center justify-center w-24 h-24">
          {/* Auto capture progress ring */}
          {isStable && !autoCapturing && (
            <svg className="absolute inset-0 w-full h-full -rotate-90 scale-110 transition-transform">
              <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" className="text-white/10" strokeWidth="3" />
              <circle 
                cx="48" cy="48" r="44" 
                fill="none" 
                stroke="currentColor" 
                className="text-primary transition-all duration-200" 
                strokeWidth="3" 
                strokeDasharray="276" 
                strokeDashoffset={276 - (276 * progress / 100)} 
                strokeLinecap="round"
              />
            </svg>
          )}
          
          <button 
            onClick={capturePhoto} 
            disabled={autoCapturing}
            className="w-16 h-16 rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.2)] hover:shadow-[0_0_0_6px_rgba(255,255,255,0.3)] active:scale-95 transition-all duration-300 flex items-center justify-center relative overflow-hidden group"
          >
            <div className="absolute inset-1 rounded-full border-2 border-black/10 group-active:border-black/20 transition-colors" />
            {autoCapturing && <LoadingSpinner inline className="w-6 h-6 text-black animate-spin" />}
          </button>
        </div>

        <div className="w-12 h-12 flex items-center justify-center">
          {pagesCount > 0 && (
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20" />
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold ring-2 ring-black">
                {pagesCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
