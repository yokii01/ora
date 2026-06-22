import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Eye, EyeOff, Copy, Edit2, Trash2, CheckCircle2,
  Clock, Calendar, ExternalLink, KeyRound, CreditCard, FileText, User2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

const ITEM_TYPES = [
  { id: 'password', label: 'Password', icon: KeyRound, emoji: '🔑', color: 'bg-blue-500/10 text-blue-500' },
  { id: 'card', label: 'Payment Card', icon: CreditCard, emoji: '💳', color: 'bg-green-500/10 text-green-500' },
  { id: 'secure_note', label: 'Secure Note', icon: FileText, emoji: '📝', color: 'bg-yellow-500/10 text-yellow-500' },
  { id: 'identity', label: 'Identity', icon: User2, emoji: '🪪', color: 'bg-purple-500/10 text-purple-500' },
];

export default function VaultItemDetail({ entry, onClose, onEdit, onDelete }) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const typeConf = ITEM_TYPES.find(t => t.id === (entry.item_type || 'password')) || ITEM_TYPES[0];

  const copy = (text, label, key) => {
    navigator.clipboard.writeText(text || '');
    toast.success(`${label} copied!`);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAll = () => {
    const lines = [
      `Site: ${entry.site_name}`,
      entry.username && `Username: ${entry.username}`,
      entry.password_encrypted && `Password: ${entry.password_encrypted}`,
      entry.url && `URL: ${entry.url}`,
      entry.notes && `Notes: ${entry.notes}`,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines);
    toast.success('All details copied!');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try { return format(parseISO(dateStr), 'MMM d, yyyy · h:mm a'); } catch { return dateStr; }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="w-full sm:max-w-md bg-card border border-border/60 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={cn('h-1.5 w-full', typeConf.color.includes('blue') ? 'bg-blue-500' : typeConf.color.includes('green') ? 'bg-green-500' : typeConf.color.includes('yellow') ? 'bg-yellow-500' : 'bg-purple-500')} />
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center text-xl', typeConf.color)}>
                {typeConf.emoji}
              </div>
              <div>
                <p className="font-bold text-base">{entry.site_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{typeConf.label}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {/* Username */}
            {entry.username && (
              <div className="bg-muted/40 rounded-2xl p-3.5 flex items-center justify-between group">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                    {entry.item_type === 'card' ? 'Cardholder' : 'Username / Email'}
                  </p>
                  <p className="text-sm font-medium">{entry.username}</p>
                </div>
                <motion.button whileTap={{ scale: 0.85 }}
                  onClick={() => copy(entry.username, 'Username', 'username')}
                  className="p-2 rounded-xl hover:bg-muted transition-colors">
                  {copiedField === 'username'
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    : <Copy className="w-4 h-4 text-muted-foreground" />}
                </motion.button>
              </div>
            )}

            {/* Password */}
            {entry.password_encrypted && (
              <div className="bg-muted/40 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                    {entry.item_type === 'card' ? 'Card Number' : 'Password'}
                  </p>
                  <p className="text-sm font-mono">
                    {showPassword ? entry.password_encrypted : '••••••••••••'}
                  </p>
                </div>
                <div className="flex gap-1 ml-2">
                  <motion.button whileTap={{ scale: 0.85 }}
                    onClick={() => setShowPassword(v => !v)}
                    className="p-2 rounded-xl hover:bg-muted transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.85 }}
                    onClick={() => copy(entry.password_encrypted, entry.item_type === 'card' ? 'Card number' : 'Password', 'password')}
                    className="p-2 rounded-xl hover:bg-muted transition-colors">
                    {copiedField === 'password'
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </motion.button>
                </div>
              </div>
            )}

            {/* URL */}
            {entry.url && (
              <div className="bg-muted/40 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">URL / Expiry</p>
                  <p className="text-sm truncate">{entry.url}</p>
                </div>
                {entry.url.startsWith('http') && (
                  <a href={entry.url} target="_blank" rel="noreferrer" className="p-2 rounded-xl hover:bg-muted transition-colors ml-2">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                )}
              </div>
            )}

            {/* Notes */}
            {entry.notes && (
              <div className="bg-muted/40 rounded-2xl p-3.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.notes}</p>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/30 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Created</p>
                </div>
                <p className="text-xs font-medium">{formatDate(entry.created_date)}</p>
              </div>
              <div className="bg-muted/30 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Updated</p>
                </div>
                <p className="text-xs font-medium">{formatDate(entry.updated_date)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 pt-3 border-t border-border/40 space-y-2">
            <Button onClick={copyAll} variant="outline" className="w-full rounded-2xl gap-2 h-11">
              <Copy className="w-4 h-4" /> Copy All Details
            </Button>
            <div className="flex gap-2">
              <Button onClick={() => onEdit(entry)} variant="outline" className="flex-1 rounded-2xl gap-2 h-11">
                <Edit2 className="w-4 h-4" /> Edit
              </Button>
              <Button onClick={() => { onDelete(entry.id); onClose(); }} variant="outline"
                className="flex-1 rounded-2xl gap-2 h-11 text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}