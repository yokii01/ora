const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { encryptVaultItem, decryptVaultItem } from '@/lib/vaultCrypto';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, LockOpen, Plus, Eye, EyeOff, Copy, Trash2, Search,
  Shield, CreditCard, FileText, User2, KeyRound, X, Edit2, RefreshCw, Sparkles, Sliders, CheckCircle2,
  Users, Mail, Landmark, ShoppingBag, Briefcase, Gamepad2, Camera
} from 'lucide-react';
import VaultItemDetail from '@/components/vault/VaultItemDetail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/shared/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── PIN Persistence ──────────────────────────────────────────────────────────
const VAULT_PIN_KEY = 'oras_vault_pin';
const DEFAULT_PIN = '1111';

function loadVaultPin() {
  return localStorage.getItem(VAULT_PIN_KEY) || DEFAULT_PIN;
}
function saveVaultPin(pin) {
  localStorage.setItem(VAULT_PIN_KEY, pin);
}

// ─── Category Config ──────────────────────────────────────────────────────────
const categoryConfig = {
  social: { icon: Users, color: 'text-info' },
  email: { icon: Mail, color: 'text-success' },
  banking: { icon: Landmark, color: 'text-warning' },
  shopping: { icon: ShoppingBag, color: 'text-primary' },
  work: { icon: Briefcase, color: 'text-purple-500' },
  entertainment: { icon: Gamepad2, color: 'text-pink-500' },
  other: { icon: KeyRound, color: 'text-muted-foreground' },
};

const ITEM_TYPES = [
  { id: 'password', label: 'Password', icon: KeyRound, color: 'bg-blue-500/10 text-blue-500' },
  { id: 'card', label: 'Payment Card', icon: CreditCard, color: 'bg-green-500/10 text-green-500' },
  { id: 'secure_note', label: 'Secure Note', icon: FileText, color: 'bg-yellow-500/10 text-yellow-500' },
  { id: 'identity', label: 'Identity', icon: User2, color: 'bg-purple-500/10 text-purple-500' },
];

const CATEGORY_PILLS = ['all', 'password', 'card', 'secure_note', 'identity'];

function generatePassword(opts = {}) {
  const { length = 16, upper = true, lower = true, numbers = true, symbols = true } = opts;
  let chars = '';
  if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lower) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) chars += '0123456789';
  if (symbols) chars += '!@#$%^&*()-_=+[]{}';
  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (pwd.length >= 16) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500', text: 'text-red-500' };
  if (score <= 4) return { score, label: 'Fair', color: 'bg-orange-500', text: 'text-orange-500' };
  if (score <= 5) return { score, label: 'Good', color: 'bg-yellow-500', text: 'text-yellow-500' };
  return { score, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
}

// ─── Lock Screen ──────────────────────────────────────────────────────────────
function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef(null);
  const savedPin = loadVaultPin();

  useEffect(() => {
    try {
      const savedAvatar = localStorage.getItem('oras_vault_avatar');
      if (savedAvatar) {
        setAvatarUrl(savedAvatar);
      }
    } catch (e) {
      console.error('Failed to access localStorage for avatar', e);
    }
  }, []);

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const MAX_SIZE = 512;
          
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarUrl(resizedBase64);
          try {
            localStorage.setItem('oras_vault_avatar', resizedBase64);
            toast.success('Avatar saved successfully');
          } catch (error) {
            console.error('Error saving avatar to localStorage:', error);
            toast.error('Failed to save avatar permanently');
          }
        };
        img.onerror = () => {
          setAvatarUrl(base64String);
          try {
            localStorage.setItem('oras_vault_avatar', base64String);
            toast.success('Avatar saved successfully');
          } catch (error) {
            console.error('Error saving avatar to localStorage:', error);
            toast.error('Failed to save avatar permanently');
          }
        };
        img.src = base64String;
      };
      reader.readAsDataURL(file);
    }
  };

  const tryUnlock = () => {
    if (pin === savedPin) {
      onUnlock();
    } else {
      setShake(true);
      setError('Incorrect PIN');
      setPin('');
      setTimeout(() => setShake(false), 600);
    }
  };

  const handleDigit = (d) => {
    if (pin.length < 6) {
      const next = pin + d;
      setPin(next);
      setError('');
      if (next.length >= 4 && next.length === savedPin.length) {
        if (next === savedPin) {
          setTimeout(() => onUnlock(), 150);
        } else {
          setTimeout(() => {
            setShake(true);
            setError('Incorrect PIN');
            setPin('');
            setTimeout(() => setShake(false), 600);
          }, 150);
        }
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 py-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xs text-center">
        {/* Interactive Avatar */}
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleAvatarUpload} 
          className="hidden" 
        />
        <motion.div
          onClick={() => fileInputRef.current?.click()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ boxShadow: ['0 0 0px transparent', '0 0 30px hsl(var(--primary)/0.4)', '0 0 0px transparent'] }}
          transition={{ boxShadow: { repeat: Infinity, duration: 3 } }}
          className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center relative overflow-hidden cursor-pointer group shadow-lg"
        >
          {avatarUrl ? (
            <>
              <img src={avatarUrl} alt="Vault Avatar" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
              <User2 className="w-10 h-10 text-primary relative z-10 drop-shadow-md group-hover:hidden" />
              <Camera className="w-10 h-10 text-primary relative z-10 drop-shadow-md hidden group-hover:block" />
            </>
          )}
        </motion.div>

        <h2 className="text-xl font-bold mb-1">Secure Vault</h2>
        <p className="text-xs text-muted-foreground mb-4">Enter PIN to unlock</p>

        {savedPin === DEFAULT_PIN && (
          <p className="text-[11px] text-warning bg-warning/10 px-3 py-1.5 rounded-2xl mb-3 border border-warning/20">Default PIN is 1111</p>
        )}

        {/* PIN dots */}
        <motion.div animate={shake ? { x: [-6, 6, -6, 6, 0] } : {}} transition={{ duration: 0.4 }} className="flex justify-center gap-3 mb-2">
          {Array.from({ length: savedPin.length }, (_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{ scale: pin.length > i ? 1.2 : 1 }}
              className={cn('w-3 h-3 rounded-full border-[2.5px] transition-all duration-200 ease-out',
                pin.length > i ? 'bg-primary border-primary shadow-[0_0_10px_hsl(var(--primary)/0.6)]' : 'border-border/60 bg-transparent'
              )}
            />
          ))}
        </motion.div>

        {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-destructive mb-2">{error}</motion.p>}
        {!error && <div className="h-4 mb-2" />}

        {/* PIN Pad */}
        <div className="grid grid-cols-3 gap-3 mb-2">
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.85 }}
              onClick={() => {
                if (d === '⌫') setPin(p => p.slice(0, -1));
                else if (d !== '') handleDigit(String(d));
              }}
              disabled={d === ''}
              className={cn(
                'w-14 h-14 mx-auto rounded-full text-xl font-bold transition-all relative overflow-hidden',
                d === '' ? 'opacity-0 pointer-events-none' : d === '⌫' ? 'bg-muted/50 text-muted-foreground hover:bg-muted/70' : 'bg-muted/20 hover:bg-muted/50 text-foreground border border-border/10 shadow-sm active:bg-primary/20 hover:shadow-md'
              )}
            >
              {d}
              {d !== '' && d !== '⌫' && <motion.div className="absolute inset-0 bg-primary/20 rounded-full opacity-0" whileTap={{ opacity: 1, scale: 1.5 }} transition={{ duration: 0.3 }} />}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Vault ───────────────────────────────────────────────────────────────
export default function Vault() {
  const [unlocked, setUnlocked] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [detailEntry, setDetailEntry] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  const [activeType, setActiveType] = useState('all');
  const [showGenOptions, setShowGenOptions] = useState(false);
  const [genOpts, setGenOpts] = useState({ length: 16, upper: true, lower: true, numbers: true, symbols: true });
  const [copiedField, setCopiedField] = useState(null);
  const queryClient = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ['passwords'],
    queryFn: async () => {
      const rawList = await db.entities.PasswordEntry.list('-created_date');
      const currentPin = loadVaultPin();
      return Promise.all(rawList.map(item => decryptVaultItem(item, currentPin)));
    },
    enabled: unlocked,
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.PasswordEntry.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['passwords'] }); setShowAdd(false); setEditEntry(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.PasswordEntry.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['passwords'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.PasswordEntry.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['passwords'] }),
  });

  const handleChangePIN = () => {
    if (newPin.length < 4) { setPinError('PIN must be at least 4 digits'); return; }
    if (newPin !== confirmPin) { setPinError('PINs do not match'); return; }
    saveVaultPin(newPin);
    setNewPin('');
    setConfirmPin('');
    setShowChangePin(false);
    setPinError('');
    toast.success('Vault PIN updated & saved permanently');
  };

  const copyToClipboard = (text, label, fieldKey) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
    if (fieldKey) {
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const openAdd = (type = 'password') => {
    setEditEntry({ site_name: '', username: '', password_encrypted: '', url: '', category: 'other', notes: '', item_type: type });
    setShowAdd(true);
  };

  const saveEntry = async () => {
    if (!editEntry?.site_name?.trim()) return;
    const currentPin = loadVaultPin();
    const encrypted = await encryptVaultItem(editEntry, currentPin);
    if (editEntry.id) updateMutation.mutate({ id: editEntry.id, data: encrypted });
    else createMutation.mutate(encrypted);
    setShowAdd(false);
    setEditEntry(null);
  };

  const filtered = entries.filter(e =>
    (e.site_name?.toLowerCase().includes(search.toLowerCase()) || e.username?.toLowerCase().includes(search.toLowerCase())) &&
    (activeType === 'all' || (e.item_type || 'password') === activeType)
  );

  if (!unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />;
  }

  const currentPin = loadVaultPin();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Vault</h1>
          {/* Animated lock icon — no text label */}
          <motion.button
            onClick={() => setUnlocked(false)}
            whileTap={{ scale: 0.9 }}
            title="Lock vault"
            className="relative"
          >
            <motion.div
              animate={{ boxShadow: ['0 0 0px transparent', '0 0 12px hsl(152,60%,42%,0.5)', '0 0 0px transparent'] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="w-8 h-8 rounded-full bg-success/10 border border-success/30 flex items-center justify-center"
            >
              <LockOpen className="w-4 h-4 text-success" />
            </motion.div>
          </motion.button>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowChangePin(true)} size="sm" variant="outline" className="rounded-full gap-1.5 text-xs px-3">
            <KeyRound className="w-3.5 h-3.5" /> PIN
          </Button>
          <Button onClick={() => openAdd('password')} size="sm" className="rounded-full gap-1.5 text-xs px-4 shadow-md shadow-primary/20">
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        </div>
      </div>

      {/* Security Disclaimer Banner */}
      <div className="p-3 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-400">
        <Shield className="w-4 h-4 shrink-0 text-emerald-500" />
        <span><strong>Client-Side Shield Active:</strong> All stored credentials are locally encrypted using Web Crypto AES-GCM 256-bit with PBKDF2 PIN derivation. Data never leaves your device in cleartext.</span>
      </div>

      {currentPin === DEFAULT_PIN && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-warning/10 border border-warning/20 rounded-2xl p-3 text-sm text-warning flex items-center gap-2">
          <Shield className="w-4 h-4 flex-shrink-0" />
          <span>Default PIN active. <button onClick={() => setShowChangePin(true)} className="underline font-semibold">Change it now</button></span>
        </motion.div>
      )}

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORY_PILLS.map(type => {
          const typeConf = ITEM_TYPES.find(t => t.id === type);
          return (
            <motion.button
              key={type}
              whileTap={{ scale: 0.93 }}
              onClick={() => setActiveType(type)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
                activeType === type
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25'
                  : 'bg-card border-border/60 text-muted-foreground hover:border-primary/30'
              )}
            >
              {typeConf && typeConf.icon ? <typeConf.icon className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {type === 'all' ? 'All Items' : typeConf?.label}
            </motion.button>
          );
        })}
      </div>

      {/* Oval Search Bar */}
      <motion.div
        whileFocus={{ scale: 1.01 }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search vault..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-full bg-muted/50 border-muted-foreground/20 h-11 focus:border-primary/40 transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </motion.div>

      {/* Entries */}
      <div className="space-y-2.5">
        <AnimatePresence>
          {filtered.map((entry, i) => {
            const isVisible = showPasswords[entry.id];
            const typeConf = ITEM_TYPES.find(t => t.id === (entry.item_type || 'password')) || ITEM_TYPES[0];
            const TypeIcon = typeConf.icon;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 400, damping: 30 }}
                whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                className="bg-card rounded-3xl border border-border/50 p-4 group backdrop-blur-sm transition-all cursor-pointer"
                onClick={() => setDetailEntry(entry)}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.4 }}
                    className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg border border-border/40', typeConf.color)}
                  >
                    <TypeIcon className="w-5 h-5" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{entry.site_name}</p>
                    {entry.username && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate max-w-[140px]">{entry.username}</p>
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => copyToClipboard(entry.username, 'Username', `u-${entry.id}`)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copiedField === `u-${entry.id}`
                            ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            : <Copy className="w-3 h-3 text-muted-foreground hover:text-primary" />}
                        </motion.button>
                      </div>
                    )}
                    {entry.password_encrypted && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs font-mono text-muted-foreground">
                          {isVisible ? entry.password_encrypted : '••••••••'}
                        </p>
                        <button onClick={() => setShowPasswords(p => ({ ...p, [entry.id]: !p[entry.id] }))}
                          className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {isVisible ? <EyeOff className="w-3 h-3 text-muted-foreground" /> : <Eye className="w-3 h-3 text-muted-foreground" />}
                        </button>
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => copyToClipboard(entry.password_encrypted, 'Password', `p-${entry.id}`)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copiedField === `p-${entry.id}`
                            ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            : <Copy className="w-3 h-3 text-muted-foreground hover:text-primary" />}
                        </motion.button>
                      </div>
                    )}
                    {entry.notes && entry.item_type === 'secure_note' && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{entry.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setEditEntry({ ...entry }); setShowAdd(true); }}
                      className="p-2 rounded-xl hover:bg-muted transition-colors">
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(entry.id); }}
                      className="p-2 rounded-xl hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <EmptyState 
          icon={<Lock />} 
          title="Secure your sensitive data" 
          description="Add passwords, credit cards, secure notes, or identities to your encrypted vault."
          action={{ label: "Add Item", icon: <Plus className="w-4 h-4" />, onClick: () => openAdd('password') }}
        />
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editEntry?.id ? 'Edit Item' : 'Add to Vault'}</DialogTitle></DialogHeader>
          {editEntry && (
            <div className="space-y-4">
              {!editEntry.id && (
                <div className="grid grid-cols-4 gap-2">
                  {ITEM_TYPES.map(t => (
                    <button key={t.id} onClick={() => setEditEntry({ ...editEntry, item_type: t.id })}
                      className={cn('p-3 rounded-2xl border text-center transition-all', editEntry.item_type === t.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted')}>
                      <span className="flex justify-center items-center mb-1"><t.icon className="w-6 h-6" /></span>
                      <p className="text-[9px] font-medium">{t.label.split(' ')[0]}</p>
                    </button>
                  ))}
                </div>
              )}
              <Input placeholder="Name / Site" value={editEntry.site_name} onChange={(e) => setEditEntry({ ...editEntry, site_name: e.target.value })} className="rounded-2xl" />
              {(editEntry.item_type === 'password' || !editEntry.item_type) && (
                <>
                  <Input placeholder="Username / Email" value={editEntry.username || ''} onChange={(e) => setEditEntry({ ...editEntry, username: e.target.value })} className="rounded-2xl" />
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input placeholder="Password" type="text" value={editEntry.password_encrypted || ''} onChange={(e) => setEditEntry({ ...editEntry, password_encrypted: e.target.value })} className="flex-1 rounded-2xl font-mono text-sm" />
                      <Button variant="outline" size="icon" onClick={() => setShowGenOptions(v => !v)} className="rounded-2xl" title="Generator options">
                        <Sliders className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setEditEntry({ ...editEntry, password_encrypted: generatePassword(genOpts) })} className="rounded-2xl" title="Generate">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Password strength */}
                    {editEntry.password_encrypted && (() => {
                      const s = getPasswordStrength(editEntry.password_encrypted);
                      return (
                        <div>
                          <div className="flex gap-1 mb-1">
                            {[1,2,3,4].map(i => (
                              <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-all', i <= Math.ceil(s.score / 1.75) ? s.color : 'bg-muted')} />
                            ))}
                          </div>
                          <p className={cn('text-[10px] font-medium', s.text)}>{s.label} password</p>
                        </div>
                      );
                    })()}
                    {/* Generator options panel */}
                    <AnimatePresence>
                      {showGenOptions && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="bg-muted/40 rounded-2xl p-3 space-y-3 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">Length: {genOpts.length}</span>
                            <input type="range" min={8} max={32} value={genOpts.length} onChange={e => setGenOpts(o => ({...o, length: +e.target.value}))} className="w-24" />
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[['upper','A-Z'],['lower','a-z'],['numbers','0-9'],['symbols','!@#']].map(([k,l]) => (
                              <button key={k} onClick={() => setGenOpts(o => ({...o, [k]: !o[k]}))}
                                className={cn('px-2 py-1.5 rounded-xl text-xs font-medium border transition-all', genOpts[k] ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground')}>
                                {l}
                              </button>
                            ))}
                          </div>
                          <Button size="sm" onClick={() => { setEditEntry({ ...editEntry, password_encrypted: generatePassword(genOpts) }); setShowGenOptions(false); }} className="w-full rounded-xl gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Generate & Apply
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <Input placeholder="URL" value={editEntry.url || ''} onChange={(e) => setEditEntry({ ...editEntry, url: e.target.value })} className="rounded-2xl" />
                </>
              )}
              {editEntry.item_type === 'card' && (
                <>
                  <Input placeholder="Cardholder name" value={editEntry.username || ''} onChange={(e) => setEditEntry({ ...editEntry, username: e.target.value })} className="rounded-2xl" />
                  <Input placeholder="Card number" value={editEntry.password_encrypted || ''} onChange={(e) => setEditEntry({ ...editEntry, password_encrypted: e.target.value })} className="rounded-2xl font-mono" />
                  <Input placeholder="Expiry (MM/YY) · CVV" value={editEntry.url || ''} onChange={(e) => setEditEntry({ ...editEntry, url: e.target.value })} className="rounded-2xl" />
                </>
              )}
              {(editEntry.item_type === 'secure_note' || editEntry.item_type === 'identity') && (
                <Textarea placeholder={editEntry.item_type === 'identity' ? 'Full name, ID number, passport...' : 'Secure note content...'} value={editEntry.notes || ''} onChange={(e) => setEditEntry({ ...editEntry, notes: e.target.value })} className="rounded-2xl min-h-[100px]" />
              )}
              <Select value={editEntry.category} onValueChange={(v) => setEditEntry({ ...editEntry, category: v })}>
                <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(categoryConfig).map(([k, v]) => {
                  const Icon = v.icon;
                  return <SelectItem key={k} value={k}><div className="flex items-center gap-2"><Icon className="w-4 h-4" /> <span>{k}</span></div></SelectItem>;
                })}</SelectContent>
              </Select>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-full">Cancel</Button>
                <Button onClick={saveEntry} className="rounded-full">Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Item Detail Modal */}
      {detailEntry && (
        <VaultItemDetail
          entry={detailEntry}
          onClose={() => setDetailEntry(null)}
          onEdit={(e) => { setDetailEntry(null); setEditEntry({ ...e }); setShowAdd(true); }}
          onDelete={(id) => { deleteMutation.mutate(id); setDetailEntry(null); }}
        />
      )}

      {/* Change PIN Dialog */}
      <Dialog open={showChangePin} onOpenChange={setShowChangePin}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><KeyRound className="w-4 h-4" /> Change Vault PIN</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {pinError && <p className="text-xs text-destructive">{pinError}</p>}
            <Input type="password" placeholder="New PIN (4-6 digits)" value={newPin} onChange={(e) => { setNewPin(e.target.value.slice(0, 6)); setPinError(''); }} className="rounded-2xl text-center tracking-widest" maxLength={6} />
            <Input type="password" placeholder="Confirm new PIN" value={confirmPin} onChange={(e) => { setConfirmPin(e.target.value.slice(0, 6)); setPinError(''); }} className="rounded-2xl text-center tracking-widest" maxLength={6} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowChangePin(false)} className="flex-1 rounded-full">Cancel</Button>
              <Button onClick={handleChangePIN} className="flex-1 rounded-full">Save PIN</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}