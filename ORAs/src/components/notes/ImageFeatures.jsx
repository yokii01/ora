import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ImageCropOverlay({ src, onSave, onClose }) {
  const imgRef = useRef(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 200, h: 200 });
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
          <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to right, rgba(0,0,0,0.6) ${crop.x}px, transparent ${crop.x}px, transparent ${crop.x + crop.w}px, rgba(0,0,0,0.6) ${crop.x + crop.w}px)` }} />
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

export function PhotoGallery({ images }) {
  const [viewImg, setViewImg] = useState(null);
  if (!images?.length) return null;
  return (
    <>
      <div className="space-y-2 mt-4">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">Photos ({images.length})</p>
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

export function DrawingCanvas({ onSave, onCancel }) {
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

export function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}
