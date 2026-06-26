import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, ChevronLeft, ChevronRight, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'highlight.js/styles/github-dark.css';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import DOMPurify from 'dompurify';

// Lazy loaded heavy viewers
const WordViewer = lazy(() => import('mammoth').then(m => ({ default: function MammothWordViewer({ url }) {
  const [html, setHtml] = useState('');
  useEffect(() => {
    fetch(url).then(r => r.arrayBuffer()).then(buf => m.default.convertToHtml({ arrayBuffer: buf })).then(res => setHtml(res.value));
  }, [url]);
  return <div className="p-4 bg-white text-black rounded-xl overflow-auto w-full h-full" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
} })));

const ExcelViewer = lazy(() => import('xlsx').then(m => ({ default: function SheetJSViewer({ url }) {
  const [html, setHtml] = useState('');
  useEffect(() => {
    fetch(url).then(r => r.arrayBuffer()).then(buf => {
      const wb = m.default.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      setHtml(m.default.utils.sheet_to_html(ws));
    });
  }, [url]);
  return <div className="p-4 bg-white text-black rounded-xl overflow-auto w-full h-full" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
} })));

const CodeViewer = lazy(() => import('highlight.js/lib/core').then(m => {
  return Promise.all([
    import('highlight.js/lib/languages/javascript'),
    import('highlight.js/lib/languages/python'),
    import('highlight.js/lib/languages/css'),
    import('highlight.js/lib/languages/xml'),
    import('highlight.js/lib/languages/json')
  ]).then(langs => {
    m.default.registerLanguage('javascript', langs[0].default);
    m.default.registerLanguage('python', langs[1].default);
    m.default.registerLanguage('css', langs[2].default);
    m.default.registerLanguage('xml', langs[3].default);
    m.default.registerLanguage('json', langs[4].default);
    return { default: function HighlightCodeViewer({ code }) { return <pre className="p-4 bg-muted/30 rounded-xl overflow-auto text-xs w-full text-left" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(m.default.highlightAuto(code).value) }} />; } };
  });
}));

export function FilePreview({ file, files, isOpen, onClose, onNavigate }) {
  const [activeFile, setActiveFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (file) setActiveFile(file);
  }, [file]);

  useEffect(() => {
    if (file && (file.file_type?.includes('text') || /\.(md|js|jsx|py|css|html|json|ts|tsx|csv|txt)$/i.test(file.name))) {
      fetch(file.file_url)
        .then(r => r.text())
        .then(txt => { setTextContent(txt); setError(false); })
        .catch(() => setError(true));
    } else {
      setTextContent('');
      setError(false);
    }
  }, [file]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight') onNavigate(1);
      if (e.key === 'ArrowLeft') onNavigate(-1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNavigate]);

  if (!activeFile && !file) return null;
  const current = file || activeFile;

  const isImage = current.file_type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(current.name);
  const isVideo = current.file_type?.startsWith('video/') || /\.(mp4|webm|ogg|mov)$/i.test(current.name);
  const isAudio = current.file_type?.startsWith('audio/') || /\.(mp3|wav|ogg|flac)$/i.test(current.name);
  const isPdf = current.file_type?.includes('pdf') || /\.pdf$/i.test(current.name);
  const isCode = /\.(js|jsx|py|css|html|json|ts|tsx|java|cpp|go|rs)$/i.test(current.name);
  const isText = current.file_type?.includes('text') || /\.(md|txt|log|csv)$/i.test(current.name);
  const isWord = /\.(doc|docx)$/i.test(current.name);
  const isExcel = /\.(xls|xlsx|csv)$/i.test(current.name);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-3xl border-white/10 rounded-2xl">
        <DialogHeader className="p-4 border-b border-border/50 flex flex-row items-center justify-between space-y-0 absolute top-0 left-0 right-0 z-10 bg-background/50 backdrop-blur-xl">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <File className="w-4 h-4 text-primary" />
            </div>
            <DialogTitle className="truncate text-base font-semibold max-w-[200px] sm:max-w-md">{current.name}</DialogTitle>
          </div>
          <div className="flex items-center gap-2 pr-6">
            <Button variant="outline" size="sm" onClick={() => {
               const a = document.createElement('a'); a.href = current.file_url; a.download = current.name; a.click();
            }} className="h-8 rounded-lg gap-1.5 bg-background/50 backdrop-blur-md">
              <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black/20 mt-[72px]">
          {files?.length > 1 && (
            <>
              <Button variant="ghost" size="icon" className="absolute left-4 z-20 w-10 h-10 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-md" onClick={(e) => { e.stopPropagation(); onNavigate(-1); }}>
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button variant="ghost" size="icon" className="absolute right-4 z-20 w-10 h-10 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-md" onClick={(e) => { e.stopPropagation(); onNavigate(1); }}>
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}

          <div className="w-full h-full p-4 md:p-8 overflow-auto flex flex-col items-center justify-center">
            <Suspense fallback={<div className="flex flex-col items-center gap-3 text-muted-foreground"><LoadingSpinner inline className="w-8 h-8 animate-spin" /><p>Loading preview...</p></div>}>
              {isImage && <img src={current.file_url} alt={current.name} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform hover:scale-[1.02] duration-300" />}
              {isVideo && <video src={current.file_url} controls autoPlay className="max-w-full max-h-full rounded-xl shadow-2xl" />}
              {isAudio && <audio src={current.file_url} controls className="w-full max-w-md" />}
              {isPdf && <iframe src={current.file_url} className="w-full h-full rounded-xl bg-white" />}
              {isWord && <WordViewer url={current.file_url} />}
              {isExcel && <ExcelViewer url={current.file_url} />}
              
              {(isCode || isText) && !error && textContent && (
                <div className="w-full h-full max-w-4xl text-left">
                  {isCode ? <CodeViewer code={textContent} /> : <pre className="w-full h-full bg-card p-6 rounded-xl text-xs overflow-auto text-left whitespace-pre-wrap">{textContent}</pre>}
                </div>
              )}

              {error && <p className="text-destructive">Failed to load text preview.</p>}

              {!isImage && !isVideo && !isAudio && !isPdf && !isWord && !isExcel && !isCode && !isText && (
                <div className="flex flex-col items-center gap-4 text-muted-foreground bg-muted/20 p-8 rounded-2xl border border-border/50">
                  <File className="w-16 h-16 opacity-50" />
                  <p>Preview is unavailable for this file format.</p>
                  <Button onClick={() => {
                     const a = document.createElement('a'); a.href = current.file_url; a.download = current.name; a.click();
                  }}>Download to view</Button>
                </div>
              )}
            </Suspense>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
