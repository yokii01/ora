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
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';

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
  const [mode, setMode] = useState('onboarding'); // 'onboarding' | 'dashboard' | 'camera' | 'editor' | 'saving' | 'qr'
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

      {mode === 'onboarding' && (
        <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-white flex flex-col items-center justify-between p-6 pb-12">
          <div className="w-full flex justify-end mt-4">
            <button onClick={() => setMode('dashboard')} className="text-gray-400 hover:text-gray-600 font-medium">Skip</button>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-sm">
            <h1 className="text-[22px] font-bold text-gray-900 tracking-wide mb-3">SAVE FILE ONLINE</h1>
            <p className="text-gray-400 text-[15px] leading-relaxed mb-12 px-2">Save the details. it's professional and minimal site UI design template</p>
            
            <div className="relative w-64 h-64 mb-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-50/80 rounded-full scale-110" />
              <div className="absolute inset-4 bg-blue-100/50 rounded-full scale-100" />
              {/* Illustration placeholder */}
              <svg xmlns="http://www.w3.org/2000/svg" className="w-32 h-32 z-10 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M12 11v9"/><path d="M9 14l3-3 3 3"/></svg>
            </div>
            
            <div className="flex gap-2 mb-4">
              <div className="w-6 h-1.5 bg-blue-600 rounded-full" />
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
            </div>
          </div>
          
          <div className="w-full max-w-sm mt-auto pt-8">
            <Button onClick={() => setMode('dashboard')} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px] shadow-[0_8px_30px_rgba(37,99,235,0.24)] transition-all">
              UPLOAD NOW
            </Button>
          </div>
        </motion.div>
      )}

      {mode === 'dashboard' && (
        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-[#F8FAFC]">
          {/* Header */}
          <div className="px-6 pt-12 pb-6 bg-white sticky top-0 z-10 border-b border-gray-100 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => setMode('onboarding')} className="text-gray-400 hover:text-gray-600 p-2 -ml-2 rounded-full"><ChevronLeft className="w-6 h-6" /></button>
              <button className="text-gray-400 hover:text-gray-600 p-2 -mr-2 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></button>
            </div>
            <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">Hello, Welcome</h1>
          </div>

          <div className="px-6 py-6 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <button className="bg-white border border-gray-100 rounded-3xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col items-start gap-5 text-left">
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-[15px] mb-1">Meeting link</h3>
                  <p className="text-[13px] text-gray-400 font-medium">4 items</p>
                </div>
              </button>
              
              <button onClick={startCamera} className="bg-white border-2 border-blue-50/50 rounded-3xl p-5 shadow-[0_8px_30px_rgba(37,99,235,0.08)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.12)] transition-all flex flex-col items-start gap-5 text-left relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-50/80 rounded-full group-hover:scale-110 transition-transform duration-500" />
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 z-10">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div className="z-10">
                  <h3 className="font-bold text-gray-900 text-[15px] mb-1">Doc scanner</h3>
                  <p className="text-[13px] text-blue-500 font-semibold flex items-center gap-1.5">New project <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span></p>
                </div>
              </button>
              
              <button className="bg-white border border-gray-100 rounded-3xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col items-start gap-5 text-left">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-[15px] mb-1">Text scanner</h3>
                  <p className="text-[13px] text-gray-400 font-medium">2 items</p>
                </div>
              </button>
              
              <button className="bg-white border border-gray-100 rounded-3xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col items-start gap-5 text-left">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-[15px] mb-1">Translate scanner</h3>
                  <p className="text-[13px] text-gray-400 font-medium">1 items</p>
                </div>
              </button>
            </div>

            <div className="mt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[13px] font-bold text-gray-400 tracking-wider uppercase">Recent</h2>
                <button className="text-gray-400 hover:text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg></button>
              </div>

              {isLoading ? (
                <SkeletonLoader type="grid" count={4} className="py-4" />
              ) : scans.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center rounded-3xl border border-dashed border-gray-200 bg-white shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-[15px] font-medium text-gray-900">No recent scans</p>
                  <p className="text-[13px] text-gray-400 mt-1">Tap Doc scanner to start</p>
                </div>
              ) : (
                <div className="space-y-3 pb-32">
                  {scans.map((scan) => (
                    <div key={scan.id} onClick={() => setPreviewScan(scan)} className="flex items-center gap-4 p-3.5 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-md cursor-pointer transition-all">
                      <div className="w-14 h-14 rounded-[14px] bg-gray-100 overflow-hidden shrink-0">
                        <img src={scan.thumbnailUrl || scan.pdfUrl} alt={scan.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 overflow-hidden pr-2">
                        <h4 className="font-bold text-[15px] text-gray-900 truncate mb-1">{scan.title}</h4>
                        <p className="text-[13px] text-gray-400 font-medium">{new Date(scan.date).toLocaleDateString()} • {scan.pagesCount} pages</p>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/90 to-transparent pt-12 pb-8 z-20">
             <Button onClick={startCamera} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px] shadow-[0_8px_30px_rgba(37,99,235,0.24)] transition-all">
               QUICK ACTION
             </Button>
          </div>
        </motion.div>
      )}
      
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
    </AnimatePresence>
  );
}
