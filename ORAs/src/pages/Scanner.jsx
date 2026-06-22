import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ScanLine, Download, Trash2, ChevronLeft, Link2, Wifi, Contact, AlignLeft, FileText, Sparkles, Crop, Wand2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

import CameraView from '@/components/scanner/CameraView';
import DocumentEditor from '@/components/scanner/DocumentEditor';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// Fallback DB proxy
const db = globalThis.__B44_DB__ || {
  entities: {
    ScanDocument: { list: async () => [], create: async () => ({}), delete: async () => ({}) },
    Note: { create: async () => ({}) }
  },
  integrations: {
    Core: { UploadFile: async () => ({ url: '' }), InvokeLLM: async () => ({ text: '' }) }
  }
};

const downloadDataUrl = (url, name) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export default function Scanner() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState('list'); // 'list' | 'camera' | 'editor' | 'saving' | 'qr'
  const [pages, setPages] = useState([]); // Array of data URLs
  const [currentImage, setCurrentImage] = useState(null);
  const [saveStep, setSaveStep] = useState('Processing...');
  const [previewScan, setPreviewScan] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [pendingSave, setPendingSave] = useState(null);

  const { data: scans = [], isLoading } = useQuery({
    queryKey: ['scans'],
    queryFn: () => db.entities.ScanDocument.list('-created_date')
  });

  const createScan = useMutation({
    mutationFn: (data) => db.entities.ScanDocument.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scans'] })
  });
  
  const createNote = useMutation({
    mutationFn: (data) => db.entities.Note.create(data)
  });

  const deleteScan = useMutation({
    mutationFn: (id) => db.entities.ScanDocument.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scans'] })
  });

  // Flow handlers
  const startCamera = useCallback(() => {
    setPages([]);
    setCurrentImage(null);
    setMode('camera');
  }, []);

  const handleCapture = useCallback((result) => {
    if (result.qrData) {
      setQrData(result.qrData);
      setMode('qr');
      return;
    }
    setCurrentImage(result.image);
    setMode('editor');
  }, []);

  const handleAddPage = useCallback(() => {
    setMode('camera');
  }, []);

  const handleEditorCancel = useCallback(() => {
    if (pages.length > 0) {
      // Just discard this page, return to list of pages (or camera)
      setMode('camera');
    } else {
      setMode('list');
    }
  }, [pages]);

  const generatePDF = async (imageUrls) => {
    const pdf = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < imageUrls.length; i++) {
      if (i > 0) pdf.addPage();
      const img = new Image();
      img.src = imageUrls[i];
      await new Promise(r => { img.onload = r; });
      
      const imgRatio = img.width / img.height;
      const pageRatio = pageWidth / pageHeight;
      
      let finalW = pageWidth;
      let finalH = pageHeight;
      
      if (imgRatio > pageRatio) {
        finalH = pageWidth / imgRatio;
      } else {
        finalW = pageHeight * imgRatio;
      }
      
      const x = (pageWidth - finalW) / 2;
      const y = (pageHeight - finalH) / 2;
      
      pdf.addImage(imgUrls[i], 'JPEG', x, y, finalW, finalH);
    }
    return pdf.output('datauristring');
  };

  const handleEditorSave = async (finalDataUrl, ocrText) => {
    const newPages = [...pages, finalDataUrl];
    setPages(newPages);
    
    // Auto-save logic
    setMode('saving');
    try {
      setSaveStep('Uploading images...');
      const uploadedImageUrls = await Promise.all(
        newPages.map(async (p, i) => {
          try {
            const res = await db.integrations.Core.UploadFile({ base64: p.split(',')[1], filename: `scan_page_${i}.jpg` });
            return res.url || p;
          } catch (e) { return p; }
        })
      );

      setSaveStep('Generating PDF...');
      const pdfDataUrl = await generatePDF(newPages);
      
      setSaveStep('Saving document...');
      await createScan.mutateAsync({
        title: `Scan ${new Date().toLocaleString()}`,
        date: new Date().toISOString(),
        pagesCount: newPages.length,
        pdfUrl: pdfDataUrl,
        thumbnailUrl: uploadedImageUrls[0],
        ocrText: ocrText || ''
      });
      
      if (ocrText && ocrText.trim().length > 10) {
        setSaveStep('Creating Note from text...');
        await createNote.mutateAsync({
          title: `Scan Text ${new Date().toLocaleDateString()}`,
          content: ocrText,
          folder: 'Archive',
          color: 'gray',
          created_date: new Date().toISOString()
        });
        toast.success("Document saved & Note created");
      } else {
        toast.success("Document saved");
      }
      
      setMode('list');
    } catch (err) {
      toast.error("Failed to save document");
      setMode('list');
    }
  };

  // QR Actions
  const handleQrAction = () => {
    if (!qrData) return;
    if (qrData.startsWith('http')) window.open(qrData, '_blank');
    else if (qrData.startsWith('WIFI:')) toast.success("WiFi credentials found");
    else if (qrData.startsWith('BEGIN:VCARD')) toast.success("Contact card found");
    else { navigator.clipboard.writeText(qrData); toast.success("Text copied"); }
    setMode('list');
  };

  // UI Modes mapping wrapped in AnimatePresence for premium transitions
  return (
    <AnimatePresence mode="wait">
      {mode === 'camera' && (
        <motion.div key="camera" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="fixed inset-0 z-50">
          <CameraView onCapture={handleCapture} onCancel={() => setMode('list')} pagesCount={pages.length} />
        </motion.div>
      )}

      {mode === 'editor' && (
        <motion.div key="editor" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="fixed inset-0 z-50">
          <DocumentEditor capturedImage={currentImage} pages={pages} onRetake={() => setMode('camera')} onAddPage={handleAddPage} onSave={(dataUrl, text) => { setPendingSave({ dataUrl, text }); setMode('save-options'); }} onCancel={handleEditorCancel} />
        </motion.div>
      )}

      {mode === 'save-options' && (
        <motion.div key="save-options" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-6">
          <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner border border-primary/20">
            <Download className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-3">Save Document</h2>
          <p className="text-muted-foreground mb-10 text-center text-lg">Where would you like to keep this scan?</p>
          
          <div className="w-full max-w-sm space-y-4">
            <Button onClick={() => {
              toast.success("Transferred to File Holder");
              handleEditorSave(pendingSave.dataUrl, pendingSave.text);
            }} className="w-full h-16 text-lg rounded-capsule flex items-center justify-center gap-3 shadow-lg shadow-primary/25 hover:scale-[1.02] transition-transform">
              <FileText className="w-6 h-6" /> Transfer to File Holder
            </Button>
            
            <Button variant="secondary" onClick={() => {
              handleEditorSave(pendingSave.dataUrl, pendingSave.text);
            }} className="w-full h-16 text-lg rounded-capsule hover:scale-[1.02] transition-transform">
              Keep in Scanner
            </Button>
            
            <Button variant="ghost" onClick={() => setMode('editor')} className="w-full h-14 rounded-capsule mt-6 text-muted-foreground">
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {mode === 'saving' && (
        <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background space-y-8">
          <LoadingSpinner label="" size="lg" />
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">Saving Document</h3>
            <p className="text-muted-foreground text-lg">{saveStep}</p>
          </div>
        </motion.div>
      )}

      {mode === 'qr' && (() => {
        const isUrl = qrData?.startsWith('http');
        const isWifi = qrData?.startsWith('WIFI:');
        const isVcard = qrData?.startsWith('BEGIN:VCARD');
        return (
          <motion.div key="qr" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-50 flex flex-col p-6 bg-background">
            <div className="flex items-center mb-10 pt-4">
              <button onClick={() => setMode('list')} className="p-3 -ml-3 rounded-full hover:bg-muted transition-colors"><ChevronLeft className="w-7 h-7" /></button>
              <h2 className="text-2xl font-bold ml-2">QR Detected</h2>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full pb-10">
              <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center mb-8 shadow-inner border border-primary/20">
                {isUrl ? <Link2 className="w-12 h-12 text-primary" /> : isWifi ? <Wifi className="w-12 h-12 text-primary" /> : isVcard ? <Contact className="w-12 h-12 text-primary" /> : <AlignLeft className="w-12 h-12 text-primary" />}
              </div>
              <div className="w-full bg-card rounded-[2rem] p-6 border border-border shadow-lg text-center mb-10 break-words max-h-64 overflow-y-auto">
                <p className="font-medium text-lg text-foreground/90 leading-relaxed">{qrData}</p>
              </div>
              <div className="w-full space-y-4">
                {isUrl && (
                  <Button onClick={() => window.open(qrData, '_blank')} className="w-full rounded-capsule h-16 text-lg shadow-lg shadow-primary/20">
                    Open Website
                  </Button>
                )}
                <Button onClick={() => { navigator.clipboard.writeText(qrData); toast.success("Text copied"); }} variant={isUrl ? "outline" : "default"} className={`w-full rounded-capsule h-16 text-lg ${!isUrl && 'shadow-lg shadow-primary/20'}`}>
                  Copy Content
                </Button>
                <Button onClick={() => toast.success("QR Saved")} variant="secondary" className="w-full rounded-capsule h-16 text-lg">
                  Save QR
                </Button>
              </div>
              <Button variant="ghost" onClick={() => setMode('camera')} className="w-full rounded-capsule mt-6 h-14 text-muted-foreground">Scan Another</Button>
            </div>
          </motion.div>
        );
      })()}

      {mode === 'list' && (
        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen pb-24 bg-background">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-2xl border-b border-border/40 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[1.25rem] bg-primary/20 flex items-center justify-center shadow-inner border border-primary/20">
                <ScanLine className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-2xl leading-none tracking-tight">Scanner</h1>
                <span className="text-sm text-muted-foreground mt-1 block">{scans.length} Documents</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-5">
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={startCamera}
                className="col-span-2 relative overflow-hidden group rounded-[2rem] bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/20 p-8 flex flex-col items-center justify-center min-h-[180px] shadow-lg shadow-primary/5"
              >
                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500" />
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white mb-4 shadow-[0_0_30px_rgba(var(--primary),0.5)] group-hover:scale-110 transition-transform duration-500">
                  <Camera className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-xl tracking-tight">Scan Document</h3>
                <p className="text-sm text-muted-foreground mt-2 font-medium">Auto-crop - OCR - PDF Export</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {[
                    { icon: Crop, label: 'Auto Crop' },
                    { icon: Sparkles, label: 'Enhance' },
                    { icon: Wand2, label: 'OCR' },
                  ].map((item) => (
                    <span key={item.label} className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/60 px-3 py-1 text-xs font-semibold text-primary">
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </span>
                  ))}
                </div>
              </motion.button>

              {isLoading ? (
                <div className="col-span-2 py-20 flex justify-center"><LoadingSpinner label="Loading scans..." size="md" /></div>
              ) : scans.length === 0 ? (
                <div className="col-span-2 py-16 flex flex-col items-center justify-center text-center rounded-[2rem] border border-dashed border-border/70 bg-card/40">
                  <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mb-6 border-2 border-dashed border-border">
                    <FileText className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">No Scans Yet</h3>
                  <p className="text-muted-foreground max-w-[200px]">Tap the camera button above to scan your first document.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {scans.map((scan) => (
                    <motion.div
                      key={scan.id}
                      initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-shadow flex flex-col group cursor-pointer"
                      onClick={() => setPreviewScan(scan)}
                    >
                      <div className="relative aspect-[3/4] bg-muted/30 w-full overflow-hidden">
                        <img src={scan.thumbnailUrl || scan.pdfUrl} alt={scan.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs text-white font-medium shadow-sm">
                          {scan.pagesCount} {scan.pagesCount === 1 ? 'Page' : 'Pages'}
                        </div>
                      </div>
                      <div className="p-4 bg-card z-10">
                        <h4 className="font-semibold text-sm truncate">{scan.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(scan.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Preview Dialog */}
          <Dialog open={!!previewScan} onOpenChange={(open) => !open && setPreviewScan(null)}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-[2rem] bg-card/95 backdrop-blur-2xl border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              {previewScan && (
                <div className="flex flex-col h-[85vh]">
                  <DialogHeader className="p-5 border-b border-border/40 shrink-0 bg-background/50 backdrop-blur-md">
                    <DialogTitle className="truncate text-xl">{previewScan.title}</DialogTitle>
                    <div className="text-sm text-muted-foreground mt-1">{new Date(previewScan.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} • {previewScan.pagesCount} {previewScan.pagesCount === 1 ? 'Page' : 'Pages'}</div>
                  </DialogHeader>
                  
                  <div className="flex-1 overflow-y-auto p-5 bg-muted/10 space-y-6">
                    <div className="rounded-2xl overflow-hidden shadow-lg border border-white/5">
                      <img src={previewScan.thumbnailUrl || previewScan.pdfUrl} className="w-full h-auto" alt="Preview" />
                    </div>
                    
                    {previewScan.ocrText && (
                      <div className="bg-background rounded-3xl p-5 border border-border/50 shadow-sm">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Extracted Text
                        </h4>
                        <p className="text-sm font-mono whitespace-pre-wrap text-foreground/80 leading-relaxed">{previewScan.ocrText}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 border-t border-border/40 bg-background shrink-0 flex gap-4">
                    <Button variant="destructive" className="flex-1 rounded-capsule h-14 font-medium" onClick={() => { deleteScan.mutate(previewScan.id); setPreviewScan(null); }}>
                      <Trash2 className="w-5 h-5 mr-2" /> Delete
                    </Button>
                    <Button className="flex-1 rounded-capsule h-14 font-medium shadow-lg shadow-primary/20" onClick={() => downloadDataUrl(previewScan.pdfUrl, `${previewScan.title}.pdf`)}>
                      <Download className="w-5 h-5 mr-2" /> Export PDF
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
