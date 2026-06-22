import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive, ArrowRightLeft, Download, Edit3, FileArchive, FileText,
  Share2, Trash2, Upload, Wand2, X, Zap, Sparkles,
  Image, FileType, Table, Code, Globe, Layers, Scissors, Minimize2,
  FileDown, Tag, Package, SlidersHorizontal, ChevronRight,
  Clock, CheckCircle2,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

/* ── constants ──────────────────────────────────────────────────── */
const HISTORY_KEY = 'oras_oradocs_history_v2';

const TOOL_META = {
  'Image to PDF':   { icon: Image,      color: 'from-violet-500/20 to-fuchsia-500/20', border: 'border-violet-500/30' },
  'PDF to Images':  { icon: Layers,     color: 'from-blue-500/20 to-cyan-500/20',      border: 'border-blue-500/30' },
  'DOCX to PDF':    { icon: FileType,   color: 'from-sky-500/20 to-indigo-500/20',     border: 'border-sky-500/30' },
  'Text to PDF':    { icon: FileText,   color: 'from-emerald-500/20 to-teal-500/20',   border: 'border-emerald-500/30' },
  'CSV to PDF':     { icon: Table,      color: 'from-amber-500/20 to-orange-500/20',   border: 'border-amber-500/30' },
  'JSON to Text':   { icon: Code,       color: 'from-lime-500/20 to-green-500/20',     border: 'border-lime-500/30' },
  'Markdown to PDF':{ icon: FileDown,   color: 'from-pink-500/20 to-rose-500/20',      border: 'border-pink-500/30' },
  'HTML to PDF':    { icon: Globe,      color: 'from-orange-500/20 to-red-500/20',     border: 'border-orange-500/30' },
  'PNG to JPG':     { icon: ArrowRightLeft, color: 'from-teal-500/20 to-cyan-500/20',  border: 'border-teal-500/30' },
  'JPG to PNG':     { icon: ArrowRightLeft, color: 'from-cyan-500/20 to-blue-500/20',  border: 'border-cyan-500/30' },
  'Merge PDFs':     { icon: Layers,     color: 'from-indigo-500/20 to-violet-500/20',  border: 'border-indigo-500/30' },
  'Extract Pages':  { icon: Scissors,   color: 'from-rose-500/20 to-pink-500/20',      border: 'border-rose-500/30' },
  'PDF Compress':   { icon: Minimize2,  color: 'from-purple-500/20 to-violet-500/20',  border: 'border-purple-500/30' },
  'Image Compress': { icon: Image,      color: 'from-fuchsia-500/20 to-pink-500/20',   border: 'border-fuchsia-500/30' },
  'DOCX Optimize':  { icon: FileType,   color: 'from-blue-500/20 to-sky-500/20',       border: 'border-blue-500/30' },
  'Archive ZIP':    { icon: Package,    color: 'from-amber-500/20 to-yellow-500/20',   border: 'border-amber-500/30' },
  'Metadata Clean': { icon: Tag,        color: 'from-red-500/20 to-orange-500/20',     border: 'border-red-500/30' },
  'Web Export':     { icon: Globe,      color: 'from-green-500/20 to-emerald-500/20',  border: 'border-green-500/30' },
};

const CONVERTERS = [
  'Image to PDF', 'PDF to Images', 'DOCX to PDF', 'Text to PDF', 'CSV to PDF',
  'JSON to Text', 'Markdown to PDF', 'HTML to PDF', 'PNG to JPG', 'JPG to PNG',
  'Merge PDFs', 'Extract Pages',
];

const COMPRESSORS = [
  'PDF Compress', 'Image Compress', 'DOCX Optimize', 'Archive ZIP', 'Metadata Clean',
  'Web Export',
];

const IMPLEMENTED_TOOLS = new Set(['Image to PDF', 'PDF Compress', 'Metadata Clean']);

/* ── helpers ────────────────────────────────────────────────────── */
function readHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}

function saveHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20)));
}

function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function downloadUrl(url, name) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function fileToDataUrl(file) {
  return blobToDataUrl(file);
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ── animation variants ─────────────────────────────────────────── */
const cardVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.06, type: 'spring', stiffness: 260, damping: 22 },
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
};

const overlayVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const drawerVariant = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: { type: 'spring', stiffness: 340, damping: 34 } },
  exit: { y: '100%', transition: { duration: 0.22, ease: 'easeIn' } },
};

/* ── Toast component ────────────────────────────────────────────── */
function Toast({ message, type = 'info', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  const colors = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    error:   'border-destructive/30 bg-destructive/10 text-destructive',
    info:    'border-primary/30 bg-primary/10 text-primary',
    warn:    'border-amber-500/30 bg-amber-500/10 text-amber-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.95 }}
      className={cn('rounded-2xl border px-5 py-3.5 text-sm font-bold shadow-lg backdrop-blur-md', colors[type] || colors.info)}
    >
      <div className="flex items-center gap-2.5">
        {type === 'success' && <CheckCircle2 className="h-4 w-4" />}
        {type === 'warn' && <Clock className="h-4 w-4" />}
        {type === 'error' && <X className="h-4 w-4" />}
        {type === 'info' && <Sparkles className="h-4 w-4" />}
        {message}
      </div>
    </motion.div>
  );
}

/* ── main component ─────────────────────────────────────────────── */
export default function ORADOCS() {
  const [files, setFiles] = useState([]);
  const [history, setHistory] = useState(readHistory);
  const [activeTool, setActiveTool] = useState('Image to PDF');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);

  /* toast helpers */
  const pushToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /* history */
  const updateHistory = (next) => {
    setHistory(next);
    saveHistory(next);
  };

  const addRecent = async (entry) => {
    const next = [{ id: Date.now().toString(), createdAt: new Date().toISOString(), ...entry }, ...history];
    updateHistory(next);
  };

  /* file handling */
  const onFiles = async (list) => {
    const nextFiles = Array.from(list || []);
    setFiles(nextFiles);
    setProgress(0);

    for (const file of nextFiles.slice(0, 4)) {
      const dataUrl = file.size <= 8 * 1024 * 1024 ? await fileToDataUrl(file).catch(() => '') : '';
      await addRecent({
        name: file.name,
        type: file.type || 'Unknown',
        size: file.size,
        tool: 'Uploaded',
        dataUrl,
      });
    }
    if (nextFiles.length) pushToast(`${nextFiles.length} file${nextFiles.length > 1 ? 's' : ''} added`, 'success');
  };

  /* tool runners */
  const runImageToPdf = async () => {
    const imageFiles = files.filter(file => file.type === 'image/jpeg' || file.type === 'image/png');
    if (!imageFiles.length) throw new Error('Choose at least one JPG or PNG image.');

    const pdf = await PDFDocument.create();
    for (let index = 0; index < imageFiles.length; index += 1) {
      const bytes = await imageFiles[index].arrayBuffer();
      const image = imageFiles[index].type === 'image/png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
      const page = pdf.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      setProgress(Math.round(((index + 1) / imageFiles.length) * 80));
    }
    const output = await pdf.save({ useObjectStreams: true });
    const blob = new Blob([output], { type: 'application/pdf' });
    return { blob, name: `oradocs-images-${Date.now()}.pdf`, type: 'application/pdf' };
  };

  const runPdfCompress = async () => {
    const file = files.find(item => item.type === 'application/pdf' || item.name.toLowerCase().endsWith('.pdf'));
    if (!file) throw new Error('Choose a PDF file first.');
    const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
    pdf.setTitle('');
    pdf.setAuthor('');
    pdf.setSubject('');
    pdf.setKeywords([]);
    pdf.setProducer('ORADOCS');
    setProgress(75);
    const output = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
    const blob = new Blob([output], { type: 'application/pdf' });
    return { blob, name: file.name.replace(/\.pdf$/i, '') + '-compressed.pdf', type: 'application/pdf' };
  };

  const runTextExport = async () => {
    const file = files[0];
    if (!file) throw new Error('Choose a file first.');
    const text = file.type.startsWith('text/') || /\.(txt|md|json|csv)$/i.test(file.name)
      ? await file.text()
      : `ORADOCS file summary\n\nName: ${file.name}\nType: ${file.type || 'Unknown'}\nSize: ${formatSize(file.size)}\n`;
    setProgress(80);
    const blob = new Blob([text], { type: 'text/plain' });
    return { blob, name: file.name.replace(/\.[^.]+$/, '') + '-oradocs.txt', type: 'text/plain' };
  };

  const runTool = async () => {
    if (!files.length) {
      pushToast('Upload a file first.', 'error');
      return;
    }

    /* graceful "coming soon" for unimplemented tools */
    if (!IMPLEMENTED_TOOLS.has(activeTool)) {
      pushToast(`${activeTool} — Coming soon!`, 'warn');
      return;
    }

    setProcessing(true);
    setProgress(15);
    try {
      let output;
      if (activeTool === 'Image to PDF') output = await runImageToPdf();
      else if (activeTool === 'PDF Compress' || activeTool === 'Metadata Clean') output = await runPdfCompress();
      else output = await runTextExport();

      const dataUrl = await blobToDataUrl(output.blob);
      setProgress(100);
      pushToast(`${activeTool} completed!`, 'success');
      await addRecent({
        name: output.name,
        type: output.type,
        size: output.blob.size,
        tool: activeTool,
        dataUrl,
      });
      downloadUrl(dataUrl, output.name);
    } catch (err) {
      pushToast(err.message || 'Could not process this file.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  /* recent file actions */
  const deleteRecent = (id) => updateHistory(history.filter(item => item.id !== id));

  const startRename = (item) => {
    setRenamingId(item.id);
    setRenameValue(item.name);
  };

  const commitRename = () => {
    updateHistory(history.map(item => item.id === renamingId ? { ...item, name: renameValue.trim() || item.name } : item));
    setRenamingId(null);
    setRenameValue('');
  };

  const shareRecent = async (item) => {
    const text = `${item.name}\n${item.tool} - ${formatSize(item.size)}`;
    try {
      if (navigator.share) await navigator.share({ title: item.name, text });
      else {
        await navigator.clipboard.writeText(text);
        pushToast('Copied to clipboard', 'success');
      }
    } catch {}
  };

  /* select tool from drawer */
  const selectTool = (tool) => {
    setActiveTool(tool);
    setDrawerOpen(false);
    pushToast(`Active tool: ${tool}`, 'info');
  };

  /* quick tools for the inline bar (top 5 popular) */
  const quickTools = ['Image to PDF', 'PDF Compress', 'Merge PDFs', 'PNG to JPG', 'Archive ZIP'];

  const ToolIcon = ({ tool, size = 16 }) => {
    const meta = TOOL_META[tool];
    const Icon = meta?.icon || FileText;
    return <Icon style={{ width: size, height: size }} />;
  };

  /* ── render ─────────────────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-36">

      {/* ── toast stack ──────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-x-0 top-6 z-[100] flex flex-col items-center gap-2">
        <AnimatePresence>
          {toasts.map(t => (
            <Toast key={t.id} message={t.message} type={t.type} onDone={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>

      {/* ── header ───────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="visible"
        className="flex items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            ORA<span className="bg-gradient-to-r from-primary via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">DOCS</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Professional document utilities for ORAs.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary sm:flex items-center gap-1.5">
            <ToolIcon tool={activeTool} size={13} />
            {activeTool}
          </span>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/50 bg-card/70 text-muted-foreground shadow-lg backdrop-blur-md transition-colors hover:border-primary/40 hover:text-primary"
            title="All Tools"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* ── upload capsule ───────────────────────────────────── */}
      <motion.section
        variants={fadeUp} initial="hidden" animate="visible"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
        className={cn(
          'group relative overflow-hidden rounded-[2rem] border p-5 shadow-xl transition-all duration-300',
          dragging
            ? 'border-primary bg-primary/10 shadow-[0_0_40px_hsl(var(--primary)/0.2)]'
            : 'border-border/50 bg-gradient-to-br from-card/80 via-card/60 to-card/80'
        )}
      >
        {/* subtle gradient glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-gradient-to-br from-primary/10 to-violet-500/5 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <motion.label
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex cursor-pointer items-center justify-center gap-3 rounded-full bg-gradient-to-r from-primary to-violet-500 px-7 py-4 text-base font-extrabold text-primary-foreground shadow-[0_0_32px_hsl(var(--primary)/0.35)] transition-shadow hover:shadow-[0_0_48px_hsl(var(--primary)/0.5)]"
          >
            <Upload className="h-5 w-5" /> Upload File
            <input type="file" multiple className="hidden" onChange={e => onFiles(e.target.files)} />
          </motion.label>
          <div className="min-w-0 text-center sm:text-right">
            <p className="truncate text-sm font-bold">{files.length ? `${files.length} selected · ${formatSize(totalSize)}` : 'Drop files here or choose upload'}</p>
            <p className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:justify-end">
              <ToolIcon tool={activeTool} size={12} />
              Current tool: {activeTool}
            </p>
          </div>
        </div>
      </motion.section>

      {/* ── quick tools bar ──────────────────────────────────── */}
      <motion.section variants={fadeUp} initial="hidden" animate="visible" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Quick Tools</h2>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1 text-xs font-semibold text-primary/80 transition-colors hover:text-primary"
          >
            View All <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {quickTools.map((tool, i) => {
            const meta = TOOL_META[tool];
            const Icon = meta?.icon || FileText;
            return (
              <motion.button
                key={tool}
                custom={i}
                variants={cardVariant}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveTool(tool)}
                className={cn(
                  'group/tool relative shrink-0 overflow-hidden rounded-2xl border px-4 py-3 text-sm font-bold transition-all duration-200',
                  activeTool === tool
                    ? `border-primary/50 bg-gradient-to-br ${meta?.color || 'from-primary/20 to-primary/10'} text-foreground shadow-[0_0_24px_hsl(var(--primary)/0.25)]`
                    : 'border-border/40 bg-card/60 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{tool}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* ── process panel ────────────────────────────────────── */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="relative overflow-hidden rounded-[2rem] border border-border/50 bg-gradient-to-br from-card/80 to-card/60 p-5 shadow-lg"
          >
            <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-violet-500/10 to-transparent blur-3xl" />
            <div className="relative">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="font-bold">Ready to Process</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setFiles([])}
                  className="rounded-full bg-muted/50 p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {files.map((file, i) => (
                  <motion.div
                    key={`${file.name}-${file.size}`}
                    custom={i}
                    variants={cardVariant}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center gap-3 rounded-2xl border border-border/30 bg-muted/20 p-3 backdrop-blur-sm"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {file.type?.includes('pdf') ? <FileArchive className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.type || 'Unknown'} · {formatSize(file.size)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              {processing ? (
                <div className="mt-5 space-y-3">
                  <div className="h-2 overflow-hidden rounded-full bg-muted/50">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <LoadingSpinner label="Processing document..." size="sm" />
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.015, boxShadow: '0 0 32px hsl(var(--primary) / 0.25)' }}
                  whileTap={{ scale: 0.985 }}
                  onClick={runTool}
                  className="mt-5 flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-foreground to-foreground/90 text-sm font-extrabold text-background transition-all"
                >
                  <Wand2 className="h-4 w-4" /> Run {activeTool}
                </motion.button>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── recent files ─────────────────────────────────────── */}
      <motion.section
        variants={fadeUp} initial="hidden" animate="visible"
        className="relative overflow-hidden rounded-[2rem] border border-border/50 bg-gradient-to-br from-card/80 to-card/60 p-5 shadow-lg"
      >
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-tl from-primary/8 to-transparent blur-3xl" />
        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Recent Files</h2>
            </div>
            <span className="rounded-full bg-muted/40 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              {history.length} items
            </span>
          </div>

          {history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/50 p-8 text-center text-sm text-muted-foreground">
              <FileText className="mx-auto mb-2 h-8 w-8 opacity-30" />
              Recent files appear here after upload or export.
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item, i) => (
                <motion.div
                  key={item.id}
                  custom={i}
                  variants={cardVariant}
                  initial="hidden"
                  animate="visible"
                  layout
                  whileHover={{ x: 2 }}
                  className="group rounded-2xl border border-border/20 bg-muted/15 p-3 transition-colors hover:border-border/40 hover:bg-muted/25"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-primary transition-transform group-hover:scale-105',
                      TOOL_META[item.tool]
                        ? `bg-gradient-to-br ${TOOL_META[item.tool].color}`
                        : 'bg-primary/10'
                    )}>
                      {item.type?.includes('pdf') ? <FileArchive className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      {renamingId === item.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={e => e.key === 'Enter' && commitRename()}
                          className="w-full rounded-xl bg-background px-3 py-1.5 text-sm font-bold outline-none ring-1 ring-primary/30"
                        />
                      ) : (
                        <p className="truncate text-sm font-bold">{item.name}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.tool}</span>
                        <span className="opacity-40">·</span>
                        <span>{formatSize(item.size)}</span>
                        {item.createdAt && (
                          <>
                            <span className="opacity-40">·</span>
                            <span>{timeAgo(item.createdAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[
                        { action: () => item.dataUrl && downloadUrl(item.dataUrl, item.name), icon: Download, title: 'Download', disabled: !item.dataUrl, hoverClass: 'hover:bg-primary/10 hover:text-primary' },
                        { action: () => shareRecent(item), icon: Share2, title: 'Share', hoverClass: 'hover:bg-blue-500/10 hover:text-blue-400' },
                        { action: () => startRename(item), icon: Edit3, title: 'Rename', hoverClass: 'hover:bg-amber-500/10 hover:text-amber-400' },
                        { action: () => deleteRecent(item.id), icon: Trash2, title: 'Delete', hoverClass: 'hover:bg-destructive/10 hover:text-destructive' },
                      ].map(({ action, icon: BtnIcon, title, disabled, hoverClass }) => (
                        <motion.button
                          key={title}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={action}
                          disabled={disabled}
                          className={cn(
                            'rounded-full p-2 text-muted-foreground transition-all disabled:opacity-25',
                            hoverClass
                          )}
                          title={title}
                        >
                          <BtnIcon className="h-4 w-4" />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* ── full-screen tool drawer ──────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              variants={overlayVariant}
              initial="hidden" animate="visible" exit="exit"
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              variants={drawerVariant}
              initial="hidden" animate="visible" exit="exit"
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[2rem] border-t border-border/50 bg-gradient-to-b from-background via-background to-card/80 p-6 shadow-2xl"
            >
              {/* handle */}
              <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-muted-foreground/25" />

              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">All Tools</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">Select a tool to set it as active</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              {/* converters */}
              <div className="mb-6">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <ArrowRightLeft className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Converters</h3>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{CONVERTERS.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {CONVERTERS.map((tool, i) => {
                    const meta = TOOL_META[tool];
                    const Icon = meta?.icon || FileText;
                    const isActive = activeTool === tool;
                    const implemented = IMPLEMENTED_TOOLS.has(tool);
                    return (
                      <motion.button
                        key={tool}
                        custom={i}
                        variants={cardVariant}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => selectTool(tool)}
                        className={cn(
                          'relative flex items-center gap-3 rounded-2xl border p-3.5 text-left text-sm font-bold transition-all duration-200',
                          isActive
                            ? `border-primary/50 bg-gradient-to-br ${meta?.color || 'from-primary/20 to-primary/10'} text-foreground shadow-[0_0_20px_hsl(var(--primary)/0.2)]`
                            : 'border-border/40 bg-card/60 text-muted-foreground hover:border-border hover:bg-card/80 hover:text-foreground'
                        )}
                      >
                        <div className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                          isActive ? 'bg-primary/20 text-primary' : 'bg-muted/40 text-muted-foreground'
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="truncate">{tool}</span>
                        {!implemented && (
                          <span className="absolute right-2 top-2 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">Soon</span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* compressors */}
              <div className="mb-2">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <Archive className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Compressors</h3>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{COMPRESSORS.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {COMPRESSORS.map((tool, i) => {
                    const meta = TOOL_META[tool];
                    const Icon = meta?.icon || Archive;
                    const isActive = activeTool === tool;
                    const implemented = IMPLEMENTED_TOOLS.has(tool);
                    return (
                      <motion.button
                        key={tool}
                        custom={i}
                        variants={cardVariant}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => selectTool(tool)}
                        className={cn(
                          'relative flex items-center gap-3 rounded-2xl border p-3.5 text-left text-sm font-bold transition-all duration-200',
                          isActive
                            ? `border-primary/50 bg-gradient-to-br ${meta?.color || 'from-primary/20 to-primary/10'} text-foreground shadow-[0_0_20px_hsl(var(--primary)/0.2)]`
                            : 'border-border/40 bg-card/60 text-muted-foreground hover:border-border hover:bg-card/80 hover:text-foreground'
                        )}
                      >
                        <div className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                          isActive ? 'bg-primary/20 text-primary' : 'bg-muted/40 text-muted-foreground'
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="truncate">{tool}</span>
                        {!implemented && (
                          <span className="absolute right-2 top-2 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">Soon</span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
