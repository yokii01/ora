const db = globalThis.__B44_DB__;

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import JSZip from 'jszip';
import {
  CheckCircle2, Cloud, Copy, Download, File, FileText, FolderOpen,
  FolderPlus, Grid3X3, HardDrive, Image, Link2, List,
  Search, Star, Upload, Unplug
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { UploadExperience } from '@/components/files/UploadExperience';
import { FilePreview } from '@/components/files/FilePreview';
import { FileActions } from '@/components/files/FileActions';

const fileIcons = { image: Image, pdf: FileText, document: FileText, default: File };
const sourceLabels = { local: 'Local Storage', google_drive: 'Google Drive', dropbox: 'Dropbox', onedrive: 'OneDrive' };
const providerConfig = {
  google_drive: { env: import.meta.env.VITE_GOOGLE_DRIVE_AUTH_URL },
  onedrive: { env: import.meta.env.VITE_ONEDRIVE_AUTH_URL },
  dropbox: { env: import.meta.env.VITE_DROPBOX_AUTH_URL },
};

const formatBytes = (bytes = 0) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

const formatDuration = seconds => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;
};

function getFileIcon(type) {
  if (!type) return fileIcons.default;
  if (type.startsWith('image')) return fileIcons.image;
  if (type.includes('pdf')) return fileIcons.pdf;
  if (type.includes('doc') || type.includes('text')) return fileIcons.document;
  return fileIcons.default;
}

function triggerDownload(url, name) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export default function Files() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [folder, setFolder] = useState('root');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploads, setUploads] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState([]);
  const [preview, setPreview] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  const [shareWith, setShareWith] = useState('');
  const [connected, setConnected] = useState(() => {
    try { return JSON.parse(localStorage.getItem('oras_cloud_connections') || '{}'); } catch { return {}; }
  });
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const provider = params.get('cloud_provider');
    if (params.get('cloud_connected') === '1' && provider && sourceLabels[provider]) {
      setConnected(previous => {
        const next = { ...previous, [provider]: true };
        localStorage.setItem('oras_cloud_connections', JSON.stringify(next));
        return next;
      });
      params.delete('cloud_provider');
      params.delete('cloud_connected');
      const remainingQuery = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${remainingQuery ? `?${remainingQuery}` : ''}`);
      toast.success(`${sourceLabels[provider]} connected`);
    }
  }, []);

  const { data: files = [] } = useQuery({
    queryKey: ['files'],
    queryFn: () => db.entities.FileItem.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: data => db.entities.FileItem.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.FileItem.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: id => db.entities.FileItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });

  const currentFiles = useMemo(() => files
    .filter(file => file.folder === folder || (folder === 'root' && (!file.folder || file.folder === 'root')))
    .filter(file => file.name?.toLowerCase().includes(search.toLowerCase())), [files, folder, search]);
  const starred = files.filter(file => file.starred);

  const patchUpload = (id, patch) => setUploads(items => items.map(item => item.id === id ? { ...item, ...patch } : item));

  const uploadFiles = async fileList => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    const queue = incoming.map(file => ({
      id: crypto.randomUUID?.() || `${Date.now()}-${file.name}`,
      file,
      name: file.name,
      percent: 0,
      speed: 0,
      remainingSeconds: 0,
      status: 'queued',
    }));
    setUploads(items => [...queue, ...items].slice(0, 12));

    for (const item of queue) {
      patchUpload(item.id, { status: 'uploading' });
      try {
        const { file_url } = await db.integrations.Core.UploadFile({
          file: item.file,
          onProgress: progress => patchUpload(item.id, {
            percent: progress.percent,
            speed: progress.speed,
            remainingSeconds: progress.remainingSeconds,
          }),
        });
        await createMutation.mutateAsync({
          name: item.file.name,
          file_url,
          preview_url: item.file.type.startsWith('image/') ? file_url : '',
          file_type: item.file.type || 'application/octet-stream',
          file_size: item.file.size,
          folder,
          source: 'local',
        });
        patchUpload(item.id, { percent: 100, status: 'success', remainingSeconds: 0 });
      } catch (error) {
        patchUpload(item.id, { status: 'error', error: error.message });
      }
    }
  };

  const connectProvider = provider => {
    const authUrl = providerConfig[provider]?.env;
    if (!authUrl) {
      toast.error(`${sourceLabels[provider]} OAuth is not configured`, {
        description: `Add VITE_${provider === 'google_drive' ? 'GOOGLE_DRIVE' : provider.toUpperCase()}_AUTH_URL to connect this provider.`,
      });
      return;
    }
    localStorage.setItem('oras_cloud_oauth_pending', provider);
    window.location.assign(authUrl);
  };

  const disconnectProvider = provider => {
    setConnected(previous => {
      const next = { ...previous, [provider]: false };
      localStorage.setItem('oras_cloud_connections', JSON.stringify(next));
      return next;
    });
    toast.success(`${sourceLabels[provider]} disconnected`);
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    await createMutation.mutateAsync({ name: newFolderName.trim(), folder, file_type: 'folder', source: 'local' });
    setShowNewFolder(false);
    setNewFolderName('');
  };

  const copyShareLink = async file => {
    const token = file.share_token || crypto.randomUUID?.() || `${Date.now()}`;
    if (!file.share_token) await updateMutation.mutateAsync({ id: file.id, data: { share_token: token, shared: true } });
    const link = `${window.location.origin}/files?share=${encodeURIComponent(token)}`;
    await navigator.clipboard.writeText(link);
    toast.success('Share link copied');
  };

  const shareInternally = async () => {
    if (!shareFile || !shareWith.trim()) return;
    const recipients = [...new Set([...(shareFile.shared_with || []), shareWith.trim()])];
    await updateMutation.mutateAsync({ id: shareFile.id, data: { shared: true, shared_with: recipients } });
    setShareWith('');
    toast.success('File shared internally');
  };

  const downloadMany = async items => {
    const downloadable = items.filter(item => item.file_type !== 'folder' && item.file_url);
    if (!downloadable.length) return toast.error('No downloadable files selected');
    if (downloadable.length === 1) return triggerDownload(downloadable[0].file_url, downloadable[0].name);
    const zip = new JSZip();
    toast.info('Preparing ZIP download...');
    await Promise.all(downloadable.map(async file => {
      const blob = await fetch(file.file_url).then(response => response.blob());
      zip.file(file.name, blob);
    }));
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    triggerDownload(url, folder === 'root' ? 'ORAs-files.zip' : `${folder}.zip`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const toggleSelection = id => setSelected(ids => ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]);
  const selectedFiles = files.filter(file => selected.includes(file.id));

  return (
    <div className="space-y-5" onDragEnter={event => { event.preventDefault(); setDragging(true); }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">File Holder</h1>
        <div className="flex flex-wrap gap-2">
          {selected.length > 0 && (
            <Button onClick={() => downloadMany(selectedFiles)} size="sm" variant="outline" className="gap-1.5 rounded-full">
              <Download className="w-4 h-4" /> Download {selected.length}
            </Button>
          )}
          <Button onClick={() => setShowNewFolder(true)} size="sm" variant="outline" className="gap-1.5 rounded-full">
            <FolderPlus className="w-4 h-4" /> Folder
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} size="sm" className="gap-1.5 rounded-full shadow-lg shadow-primary/20">
            <Upload className="w-4 h-4" /> Upload
          </Button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={event => { uploadFiles(event.target.files); event.target.value = ''; }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.entries(sourceLabels).map(([key, label]) => {
          const isLocal = key === 'local';
          const isConnected = isLocal || connected[key];
          return (
            <button
              key={key}
              onClick={() => {
                if (isLocal) return;
                if (isConnected) disconnectProvider(key);
                else connectProvider(key);
              }}
              className="flex min-w-0 items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-2 text-left text-xs transition-all hover:border-primary/30 hover:bg-card"
            >
              {isLocal ? <HardDrive className="w-4 h-4 text-primary" /> : isConnected ? <Unplug className="w-4 h-4 text-success" /> : <Cloud className="w-4 h-4 text-muted-foreground" />}
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', isConnected ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground')}>
                {isConnected ? 'On' : 'Connect'}
              </span>
            </button>
          );
        })}
      </div>

      <div
        onDragOver={event => { event.preventDefault(); setDragging(true); }}
        onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
        onDrop={event => { event.preventDefault(); setDragging(false); uploadFiles(event.dataTransfer.files); }}
        className={cn('rounded-[2rem] border-2 border-dashed p-6 text-center transition-all',
          dragging ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-border/70 bg-muted/20')}>
        <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">Drop files here to upload</p>
        <p className="mt-1 text-xs text-muted-foreground">Multiple files are supported</p>
      </div>

      <UploadExperience uploads={uploads} onDismiss={id => setUploads(items => items.filter(u => u.id !== id))} />

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search files..." value={search} onChange={event => setSearch(event.target.value)} className="pl-9 rounded-full bg-muted/50" />
        </div>
        <div className="flex bg-muted/50 rounded-full p-0.5">
          <button onClick={() => setView('grid')} className={cn('p-2 rounded-full', view === 'grid' && 'bg-background shadow-sm')}><Grid3X3 className="w-4 h-4" /></button>
          <button onClick={() => setView('list')} className={cn('p-2 rounded-full', view === 'list' && 'bg-background shadow-sm')}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {folder !== 'root' && (
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setFolder('root')} className="text-muted-foreground hover:text-primary">Files</button>
          <span>/</span><span className="font-medium">{folder}</span>
          <button onClick={() => downloadMany(files.filter(file => file.folder === folder))} className="ml-auto flex items-center gap-1 text-xs text-primary">
            <Download className="w-3.5 h-3.5" /> Download folder
          </button>
        </div>
      )}

      {folder === 'root' && starred.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {starred.slice(0, 5).map(file => (
            <div key={file.id} className="flex min-w-[140px] items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-2">
              <Star className="w-3.5 h-3.5 fill-warning text-warning" /><span className="truncate text-xs">{file.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className={cn(view === 'grid' ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4' : 'space-y-2')}>
        <AnimatePresence>
          {currentFiles.map((file, index) => {
            const Icon = getFileIcon(file.file_type);
            const isFolder = file.file_type === 'folder';
            const isSelected = selected.includes(file.id);
            return (
              <motion.div key={file.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(index * 0.015, 0.15) }}
                onClick={() => isFolder ? setFolder(file.name) : setPreview(file)}
                className={cn('group cursor-pointer rounded-[1.75rem] border bg-card/80 transition-all hover:shadow-md hover:border-primary/25 relative',
                  isSelected ? 'border-primary ring-2 ring-primary/15' : 'border-border/60',
                  view === 'grid' ? 'p-4 flex flex-col items-center text-center' : 'p-3 flex items-center gap-3 rounded-full')}>
                
                {/* Selection Checkbox */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelection(file.id); }}
                  className={cn('absolute top-2 left-2 z-10 p-1.5 rounded-lg transition-all',
                    isSelected ? 'opacity-100 bg-primary text-primary-foreground' : 'opacity-0 group-hover:opacity-100 bg-background/50 hover:bg-background/80 backdrop-blur-md')}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <div className={cn('rounded-2xl bg-muted/60 flex items-center justify-center', view === 'grid' ? 'w-12 h-12 mb-3 mt-2' : 'w-9 h-9')}>
                  {isFolder ? <FolderOpen className="w-5 h-5 text-warning" /> : <Icon className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className={cn(view === 'list' && 'flex-1 min-w-0', view === 'grid' && 'w-full px-1 min-w-0 text-center')}>
                  <p className="truncate text-xs font-medium w-full" title={file.name}>{file.name}</p>
                  {!isFolder && <p className="mt-0.5 text-[10px] text-muted-foreground w-full truncate">{formatBytes(file.file_size)} - {sourceLabels[file.source] || 'Local'}</p>}
                </div>
                
                <div className="absolute top-2 right-2" onClick={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()}>
                  <FileActions
                  file={file}
                  files={files}
                  isFolder={isFolder}
                  onUpdate={(id, data) => id === 'duplicate' ? createMutation.mutate(data) : updateMutation.mutate({ id, data })}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onShare={(f) => setShareFile(f)}
                  onDownload={triggerDownload}
                  onPreview={(f) => setPreview(f)}
                />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {currentFiles.length === 0 && (
        <div className="py-14 text-center text-muted-foreground"><FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-medium">No files here</p></div>
      )}

      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Folder</DialogTitle></DialogHeader>
          <Input placeholder="Folder name" value={newFolderName} onChange={event => setNewFolderName(event.target.value)} onKeyDown={event => event.key === 'Enter' && createFolder()} />
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowNewFolder(false)}>Cancel</Button><Button onClick={createFolder}>Create</Button></div>
        </DialogContent>
      </Dialog>

      <FilePreview 
        file={preview} 
        files={currentFiles} 
        isOpen={!!preview} 
        onClose={() => setPreview(null)} 
        onNavigate={(dir) => {
          const idx = currentFiles.findIndex(f => f.id === preview.id);
          const nextIdx = (idx + dir + currentFiles.length) % currentFiles.length;
          setPreview(currentFiles[nextIdx]);
        }} 
      />

      <Dialog open={!!shareFile} onOpenChange={() => setShareFile(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Share {shareFile?.name}</DialogTitle></DialogHeader>
          <Button onClick={() => copyShareLink(shareFile)} variant="outline" className="w-full gap-2"><Copy className="w-4 h-4" /> Copy share link</Button>
          <div className="flex gap-2"><Input value={shareWith} onChange={event => setShareWith(event.target.value)} placeholder="Name or email for internal sharing" /><Button onClick={shareInternally}><Link2 className="w-4 h-4" /></Button></div>
          {shareFile?.shared_with?.length > 0 && <p className="text-xs text-muted-foreground">Shared with: {shareFile.shared_with.join(', ')}</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
