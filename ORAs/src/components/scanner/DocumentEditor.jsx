import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, FileText, RotateCw, Crop, Sun, Contrast, Droplets, Image as ImageIcon, Sparkles, SlidersHorizontal, Share2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const TOOLS = [
  { id: 'original', icon: ImageIcon, label: 'Original' },
  { id: 'magic', icon: Sparkles, label: 'Magic Color' },
  { id: 'bw', icon: Droplets, label: 'B&W' },
  { id: 'brightness', icon: Sun, label: 'Brightness', hasSlider: true, min: 50, max: 150 },
  { id: 'contrast', icon: Contrast, label: 'Contrast', hasSlider: true, min: 50, max: 150 },
  { id: 'saturation', icon: Droplets, label: 'Saturation', hasSlider: true, min: 0, max: 200 },
  { id: 'sharpness', icon: SlidersHorizontal, label: 'Sharpen', hasSlider: true, min: 0, max: 100 },
  { id: 'rotate', icon: RotateCw, label: 'Rotate' },
  { id: 'crop', icon: Crop, label: 'Crop' },
  { id: 'invert', icon: Layers, label: 'Invert' },
];

export default function DocumentEditor({ capturedImage, pages, onRetake, onAddPage, onSave, onCancel }) {
  const [activeTab, setActiveTab] = useState('adjust'); // 'adjust' | 'ocr'
  const canvasRef = useRef(null);
  
  // State for image adjustments
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sharpness: 0,
    rotation: 0,
    filter: 'magic' // 'original' | 'magic' | 'bw' | 'invert'
  });
  
  const [activeTool, setActiveTool] = useState(null);
  const [ocrResult, setOcrResult] = useState('');
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const imgRef = useRef(new Image());

  // Load image on mount
  useEffect(() => {
    if (capturedImage) {
      imgRef.current.src = capturedImage;
      imgRef.current.onload = renderCanvas;
    }
  }, [capturedImage]);

  // Re-render canvas when adjustments change
  useEffect(() => {
    if (imgRef.current.complete) {
      renderCanvas();
    }
  }, [adjustments]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current.src) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Handle rotation dimensions
    const imgW = imgRef.current.width;
    const imgH = imgRef.current.height;
    const isRotated = adjustments.rotation % 180 !== 0;
    canvas.width = isRotated ? imgH : imgW;
    canvas.height = isRotated ? imgW : imgH;
    
    // Apply basic CSS-like filters contextually
    let filterStr = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`;
    
    if (adjustments.filter === 'magic') {
      filterStr = `brightness(${Math.max(110, adjustments.brightness)}%) contrast(${Math.max(120, adjustments.contrast)}%) saturate(${Math.max(110, adjustments.saturation)}%)`;
    } else if (adjustments.filter === 'bw') {
      filterStr += ` grayscale(100%) contrast(120%)`;
    } else if (adjustments.filter === 'invert') {
      filterStr += ` invert(100%)`;
    }
    
    ctx.filter = filterStr;
    
    // Translate and Rotate
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((adjustments.rotation * Math.PI) / 180);
    ctx.drawImage(imgRef.current, -imgW / 2, -imgH / 2, imgW, imgH);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.filter = 'none';

    // Apply Sharpening Matrix if needed
    if (adjustments.sharpness > 0) {
      applySharpening(ctx, canvas.width, canvas.height, adjustments.sharpness);
    }
  };

  const applySharpening = (ctx, w, h, amount) => {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const mix = amount / 100;
    
    // Simple Unsharp Mask approximation to avoid full matrix convolution lag on mobile
    const blurred = new Uint8ClampedArray(data);
    const w4 = w * 4;
    
    // Horizontal blur pass
    for (let y = 0; y < h; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w4 + x * 4;
        for (let c = 0; c < 3; c++) {
          blurred[i+c] = (data[i+c-4] + data[i+c] + data[i+c+4]) / 3;
        }
      }
    }
    
    // Subtract blur from original to get edges, then add edges to original
    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const edge = data[i+c] - blurred[i+c];
        data[i+c] = Math.min(255, Math.max(0, data[i+c] + edge * mix * 5));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  };

  const handleToolClick = (tool) => {
    if (tool.id === 'rotate') {
      setAdjustments(p => ({ ...p, rotation: (p.rotation + 90) % 360 }));
      return;
    }
    if (['original', 'magic', 'bw', 'invert'].includes(tool.id)) {
      setAdjustments(p => ({ ...p, filter: tool.id }));
      setActiveTool(null);
      return;
    }
    if (tool.id === 'crop') {
      toast.info("Crop tool coming soon");
      return;
    }
    if (tool.hasSlider) {
      setActiveTool(activeTool === tool.id ? null : tool.id);
    }
  };

  const handleSliderChange = (e) => {
    if (!activeTool) return;
    setAdjustments(p => ({ ...p, [activeTool]: parseInt(e.target.value) }));
  };

  const extractText = async () => {
    setIsOcrLoading(true);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const dataUrl = canvasRef.current.toDataURL('image/jpeg');
      const { data: { text } } = await worker.recognize(dataUrl);
      setOcrResult(text || "No text found.");
      await worker.terminate();
    } catch (e) {
      setOcrResult("Failed to extract text. Make sure you have a network connection or tesseract.js is installed.");
      console.error(e);
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleSave = () => {
    const finalDataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
    onSave(finalDataUrl, ocrResult);
  };

  const activeSliderTool = TOOLS.find(t => t.id === activeTool);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border/40 shrink-0">
        <button onClick={onCancel} className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="flex bg-muted/50 p-1 rounded-capsule">
          <button 
            className={`px-4 py-1.5 rounded-capsule text-sm font-medium transition-colors ${activeTab === 'adjust' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('adjust')}
          >
            Adjust
          </button>
          <button 
            className={`px-4 py-1.5 rounded-capsule text-sm font-medium transition-colors ${activeTab === 'ocr' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => { setActiveTab('ocr'); if (!ocrResult) extractText(); }}
          >
            OCR
          </button>
        </div>
        <button onClick={handleSave} className="p-2 -mr-2 rounded-full hover:bg-primary/10 text-primary transition-colors">
          <Check className="w-5 h-5" />
        </button>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 bg-black overflow-hidden flex items-center justify-center p-4 relative">
        <canvas 
          ref={canvasRef} 
          className="max-w-full max-h-full object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
          style={{ transition: activeTab === 'ocr' ? 'all 0.3s ease, filter 0.3s ease' : 'none', filter: activeTab === 'ocr' ? 'blur(4px) brightness(0.5)' : 'none' }}
        />
        
        {/* OCR Overlay */}
        <AnimatePresence>
          {activeTab === 'ocr' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute inset-4 sm:inset-8 md:inset-12 bg-background/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">Extracted Text</h3>
                    <p className="text-xs text-muted-foreground">OCR Result</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 bg-muted/40 rounded-3xl p-5 overflow-y-auto mb-6 border border-white/5 no-scrollbar text-[15px] leading-relaxed whitespace-pre-wrap font-mono text-foreground/90 shadow-inner">
                {isOcrLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                    <LoadingSpinner inline className="w-10 h-10 animate-spin text-primary" />
                    <span className="font-medium animate-pulse">Analyzing document structure...</span>
                  </div>
                ) : ocrResult}
              </div>
              
              <div className="flex gap-4 shrink-0">
                <Button className="flex-1 rounded-capsule h-14 text-base font-medium shadow-lg shadow-primary/20" onClick={() => { navigator.clipboard.writeText(ocrResult); toast.success('Text copied'); }} disabled={!ocrResult || isOcrLoading}>
                  Copy Text
                </Button>
                {navigator.share && (
                  <Button variant="secondary" className="flex-1 rounded-capsule h-14 text-base font-medium" onClick={() => navigator.share({ text: ocrResult })} disabled={!ocrResult || isOcrLoading}>
                    <Share2 className="w-5 h-5 mr-2" /> Share
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Editing Toolbar */}
      {activeTab === 'adjust' && (
        <div className="h-40 bg-background border-t border-border/40 shrink-0 flex flex-col justify-center">
          {/* Active Slider */}
          <div className="h-12 px-6 flex items-center justify-center transition-opacity duration-300">
            {activeSliderTool ? (
              <div className="flex items-center gap-4 w-full max-w-sm mx-auto">
                <activeSliderTool.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <input 
                  type="range" 
                  min={activeSliderTool.min} max={activeSliderTool.max} 
                  value={adjustments[activeTool]} 
                  onChange={handleSliderChange}
                  className="w-full accent-primary h-2 bg-muted rounded-full appearance-none"
                />
                <span className="text-xs font-mono w-8 text-right shrink-0">{adjustments[activeTool]}</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Select Tool</span>
            )}
          </div>

          {/* Tools Scrollable Row */}
          <ScrollArea className="w-full whitespace-nowrap pb-4 px-2">
            <div className="flex w-max space-x-2 px-2">
              {TOOLS.map(tool => {
                const isActive = activeTool === tool.id || adjustments.filter === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolClick(tool)}
                    className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl transition-all ${isActive ? 'bg-primary/10 text-primary ring-1 ring-primary/30 shadow-inner' : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'}`}
                  >
                    <tool.icon className={`w-6 h-6 mb-2 ${isActive ? 'fill-primary/20' : ''}`} />
                    <span className="text-[10px] font-medium tracking-wide">{tool.label}</span>
                  </button>
                )
              })}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
