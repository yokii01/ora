import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, FolderInput, CopyPlus, Share2, Download, Trash2, Info, Star, StarOff, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

export function FileActions({ file, files, onUpdate, onDelete, onShare, onDownload, onPreview, isFolder }) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState(file.name || '');
  const [moveOpen, setMoveOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const handleRename = async () => {
    if (!newName.trim() || newName === file.name) {
      setRenameOpen(false);
      return;
    }
    await onUpdate(file.id, { name: newName.trim() });
    setRenameOpen(false);
    toast.success('File renamed');
  };

  const handleDuplicate = async () => {
    toast.info('Duplicating file...');
    // Real implementation requires backend/storage duplication. For now, create metadata copy.
    await onUpdate('duplicate', { ...file, id: undefined, name: file.name + ' (Copy)' });
  };

  const folders = [...new Set(files?.filter(f => f.file_type === 'folder').map(f => f.name) || [])];
  const stop = (event) => event.stopPropagation();
  const run = (handler) => (event) => {
    event.stopPropagation();
    handler?.(event);
  };

  return (
    <div className="inline-flex" onClick={stop} onPointerDown={stop}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
          <button className="p-1.5 rounded-md hover:bg-muted transition-colors"><MoreVertical className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl" onClick={stop} onPointerDown={stop}>
          {!isFolder && <DropdownMenuItem onClick={run(() => onPreview(file))}><Info className="w-4 h-4 mr-2" /> Preview</DropdownMenuItem>}
          <DropdownMenuItem onClick={run(() => { setNewName(file.name); setRenameOpen(true); })}><Pencil className="w-4 h-4 mr-2" /> Rename</DropdownMenuItem>
          <DropdownMenuItem onClick={run(() => setMoveOpen(true))}><FolderInput className="w-4 h-4 mr-2" /> Move to...</DropdownMenuItem>
          {!isFolder && <DropdownMenuItem onClick={run(handleDuplicate)}><CopyPlus className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={run(() => onUpdate(file.id, { starred: !file.starred }))}>
            {file.starred ? <StarOff className="w-4 h-4 mr-2" /> : <Star className="w-4 h-4 mr-2 text-warning fill-warning" />}
            {file.starred ? 'Unstar' : 'Favorite'}
          </DropdownMenuItem>
          {!isFolder && <DropdownMenuItem onClick={run(() => onShare(file))}><Share2 className="w-4 h-4 mr-2" /> Share</DropdownMenuItem>}
          {!isFolder && <DropdownMenuItem onClick={run(() => onDownload(file.file_url, file.name))}><Download className="w-4 h-4 mr-2" /> Download</DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={run(() => setInfoOpen(true))}><Info className="w-4 h-4 mr-2" /> File Info</DropdownMenuItem>
          <DropdownMenuItem onClick={run(() => onDelete(file.id))} className="text-destructive focus:text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Rename</DialogTitle></DialogHeader>
          <Input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRename()} className="rounded-xl" autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleRename} className="rounded-xl">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Move to Folder</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2 max-h-60 overflow-y-auto">
            <button onClick={() => { onUpdate(file.id, { folder: 'root' }); setMoveOpen(false); toast.success('Moved to Files'); }} className="w-full flex items-center p-2 rounded-lg hover:bg-muted text-sm font-medium">Root (Files)</button>
            {folders.map(f => (
              <button key={f} onClick={() => { onUpdate(file.id, { folder: f }); setMoveOpen(false); toast.success(`Moved to ${f}`); }} className="w-full flex items-center p-2 rounded-lg hover:bg-muted text-sm">{f}</button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>File Information</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Name</span><span className="font-medium truncate max-w-[200px]" title={file.name}>{file.name}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Type</span><span className="font-medium">{file.file_type || 'Unknown'}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Size</span><span className="font-medium">{file.file_size ? `${(file.file_size/1024).toFixed(1)} KB` : 'N/A'}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Location</span><span className="font-medium truncate max-w-[200px]">{file.folder || 'root'}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Created</span><span className="font-medium">{file.created_date ? new Date(file.created_date).toLocaleDateString() : 'Unknown'}</span></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
