const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Moon, Sun, Monitor, Palette, Bell, Shield, Globe, LogOut, User,
  Type, Layout, Clock, Fingerprint, KeyRound, Download, Languages, Lock, Database, Smartphone, Zap,
  Home, StickyNote, CheckSquare, Calendar, MoreHorizontal, Wallet, Sparkles, Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Target } from 'lucide-react';

const ALL_NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/notes', icon: StickyNote, label: 'Notes' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/finance', icon: Wallet, label: 'Finance' },
  { path: '/habits', icon: Target, label: 'Habito' },
  { path: '/assistant', icon: Sparkles, label: 'AI' },
  { path: '/more', icon: MoreHorizontal, label: 'More' },
];

const NAV_KEY = 'oras_bottom_nav_items';
function loadNavItems() { try { return JSON.parse(localStorage.getItem(NAV_KEY) || 'null') || null; } catch { return null; } }
function saveNavItems(items) { localStorage.setItem(NAV_KEY, JSON.stringify(items)); }

const ACCENT_COLORS = [
  { name: 'Indigo', value: '245 58% 51%' },
  { name: 'Violet', value: '265 58% 55%' },
  { name: 'Blue', value: '217 91% 55%' },
  { name: 'Teal', value: '172 66% 40%' },
  { name: 'Rose', value: '340 82% 55%' },
  { name: 'Amber', value: '38 92% 50%' },
];

const FONT_SIZES = ['Small', 'Medium', 'Large', 'Extra Large'];
const LANGUAGES = ['English', 'Arabic (عربي)', 'French', 'Spanish', 'German', 'Chinese', 'Japanese'];
const LOCK_TIMEOUTS = ['1 minute', '5 minutes', '15 minutes', '30 minutes', 'Never'];

function SettingRow({ icon: Icon, label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function SettingSection({ title, icon: Icon, delay = 0, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card rounded-2xl border border-border/60 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="space-y-1 divide-y divide-border/40">
        {children}
      </div>
    </motion.div>
  );
}

const SETTINGS_KEY = 'oras_settings';

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { return {}; }
}

function persistSetting(key, value) {
  const s = loadSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...s, [key]: value }));
}

function applyThemeToDOM(t) {
  const root = document.documentElement;
  if (t === 'dark') root.classList.add('dark');
  else if (t === 'light') root.classList.remove('dark');
  else {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
    else root.classList.remove('dark');
  }
}

function applyFontSizeToDOM(size) {
  const sizeMap = { Small: '14px', Medium: '16px', Large: '18px', 'Extra Large': '20px' };
  document.documentElement.style.fontSize = sizeMap[size] || '16px';
}

function applyAccentToDOM(color) {
  if (!color) return;
  const val = typeof color === 'object' ? color.value : color;
  if (val) document.documentElement.style.setProperty('--primary', val);
}

// Apply saved settings on first load
(function initSettings() {
  const s = loadSettings();
  if (s.theme) applyThemeToDOM(s.theme);
  if (s.fontSize) applyFontSizeToDOM(s.fontSize);
  if (s.accentColor) applyAccentToDOM(s.accentColor);
  // Restore nav items
  if (s.navItems) saveNavItems(s.navItems);
})();

export default function Settings() {
  const saved = loadSettings();
  const [theme, setTheme] = useState(saved.theme || 'system');
  const [accentColor, setAccentColor] = useState(saved.accentColor || ACCENT_COLORS[0]);
  const [fontSize, setFontSize] = useState(saved.fontSize || 'Medium');
  const [language, setLanguage] = useState(saved.language || 'English');
  const [density, setDensity] = useState(saved.density || 'comfortable');
  const [lockTimeout, setLockTimeout] = useState(saved.lockTimeout || '5 minutes');
  const [appLock, setAppLock] = useState(saved.appLock || false);
  const [biometrics, setBiometrics] = useState(saved.biometrics || false);
  const [notifTasks, setNotifTasks] = useState(saved.notifTasks !== undefined ? saved.notifTasks : true);
  const [notifCalendar, setNotifCalendar] = useState(saved.notifCalendar !== undefined ? saved.notifCalendar : true);
  const [notifHabits, setNotifHabits] = useState(saved.notifHabits !== undefined ? saved.notifHabits : true);
  const [notifFinance, setNotifFinance] = useState(saved.notifFinance || false);
  const [notifVault, setNotifVault] = useState(saved.notifVault || false);
  const defaultNav = loadNavItems() || ['/', '/notes', '/tasks', '/calendar', '/more'];
  const [navItems, setNavItems] = useState(defaultNav);
  const [showChangePIN, setShowChangePIN] = useState(false);
  const [newPIN, setNewPIN] = useState('');
  const [confirmPIN, setConfirmPIN] = useState('');
  const [pinError, setPinError] = useState('');

  const applyTheme = (t) => { setTheme(t); applyThemeToDOM(t); setHasUnsaved(true); };
  const applyAccent = (color) => { setAccentColor(color); applyAccentToDOM(color); setHasUnsaved(true); };
  const applyFontSize = (size) => { setFontSize(size); applyFontSizeToDOM(size); setHasUnsaved(true); };

  const handleExport = () => {
    const data = { exportDate: new Date().toISOString(), app: 'ORAs' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'oras-backup.json';
    a.click();
    toast.success('Backup exported');
  };

  const handleChangePIN = () => {
    if (newPIN.length < 4) { setPinError('PIN must be at least 4 characters'); return; }
    if (newPIN !== confirmPIN) { setPinError('PINs do not match'); return; }
    setShowChangePIN(false);
    setNewPIN('');
    setConfirmPIN('');
    setPinError('');
    toast.success('App PIN changed');
  };

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  const [hasUnsaved, setHasUnsaved] = useState(false);
  const mark = () => setHasUnsaved(true);

  const saveAllSettings = () => {
    const settings = { theme, accentColor, fontSize, language, density, lockTimeout, appLock, biometrics, notifTasks, notifCalendar, notifHabits, notifFinance, notifVault, navItems };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    saveNavItems(navItems);
    // Re-apply all DOM changes immediately
    applyThemeToDOM(theme);
    applyFontSizeToDOM(fontSize);
    if (accentColor?.value) applyAccentToDOM(accentColor);
    // Trigger storage event so BottomNav re-reads nav items
    window.dispatchEvent(new Event('storage'));
    setHasUnsaved(false);
    toast.success('Settings saved! Bottom bar updated.');
  };

  return (
    <div className="space-y-4 max-w-lg pb-24">
      <div className="flex items-center justify-between">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold tracking-tight">Settings</motion.h1>
        <AnimatePresence>
          {hasUnsaved && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <Button onClick={saveAllSettings} size="sm" className="rounded-xl gap-1.5 shadow-sm">Save Changes</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Appearance */}
      <SettingSection title="Appearance" icon={Palette} delay={0}>
        <div className="py-3">
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5"><Monitor className="w-3 h-3" /> Theme</p>
          <div className="flex gap-2">
            {themeOptions.map((opt) => (
              <button key={opt.value} onClick={() => applyTheme(opt.value)}
                className={cn('flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                  theme === opt.value ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:bg-muted')}>
                <opt.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="py-3">
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5"><Zap className="w-3 h-3" /> Accent Color</p>
          <div className="flex gap-2 flex-wrap">
            {ACCENT_COLORS.map(c => (
              <button key={c.name} onClick={() => applyAccent(c)} title={c.name}
                className={cn('w-8 h-8 rounded-full border-3 transition-transform hover:scale-110', accentColor.name === c.name ? 'border-foreground scale-110' : 'border-transparent')}
                style={{ background: `hsl(${c.value})` }} />
            ))}
          </div>
        </div>

        <SettingRow icon={Type} label="Font Size" description={`Current: ${fontSize}`}>
          <Select value={fontSize} onValueChange={applyFontSize}>
            <SelectTrigger className="w-28 rounded-xl h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow icon={Layout} label="Layout Density">
          <Select value={density} onValueChange={(v) => { setDensity(v); mark(); }}>
            <SelectTrigger className="w-32 rounded-xl h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="comfortable">Comfortable</SelectItem>
              <SelectItem value="spacious">Spacious</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </SettingSection>

      {/* Notifications */}
      <SettingSection title="Notifications" icon={Bell} delay={0.05}>
        <SettingRow icon={Bell} label="Task reminders">
          <Switch checked={notifTasks} onCheckedChange={(v) => { setNotifTasks(v); mark(); }} />
        </SettingRow>
        <SettingRow icon={Bell} label="Calendar alerts">
          <Switch checked={notifCalendar} onCheckedChange={(v) => { setNotifCalendar(v); mark(); }} />
        </SettingRow>
        <SettingRow icon={Bell} label="Habit reminders">
          <Switch checked={notifHabits} onCheckedChange={(v) => { setNotifHabits(v); mark(); }} />
        </SettingRow>
        <SettingRow icon={Bell} label="Finance & bill alerts">
          <Switch checked={notifFinance} onCheckedChange={(v) => { setNotifFinance(v); mark(); }} />
        </SettingRow>
        <SettingRow icon={Bell} label="Vault security alerts">
          <Switch checked={notifVault} onCheckedChange={(v) => { setNotifVault(v); mark(); }} />
        </SettingRow>
      </SettingSection>

      {/* Security */}
      <SettingSection title="Security & Privacy" icon={Shield} delay={0.1}>
        <SettingRow icon={Lock} label="App Lock" description="Lock app on background">
          <Switch checked={appLock} onCheckedChange={(v) => { setAppLock(v); mark(); }} />
        </SettingRow>
        <SettingRow icon={Fingerprint} label="Face / Biometric Lock" description="Use biometrics to unlock">
          <Switch checked={biometrics} onCheckedChange={(v) => { setBiometrics(v); mark(); }} />
        </SettingRow>
        <SettingRow icon={Clock} label="Auto-lock timeout">
          <Select value={lockTimeout} onValueChange={(v) => { setLockTimeout(v); mark(); }}>
            <SelectTrigger className="w-28 rounded-xl h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LOCK_TIMEOUTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow icon={KeyRound} label="Change App PIN">
          <Button size="sm" variant="outline" onClick={() => setShowChangePIN(true)} className="rounded-xl h-8 text-xs">Change</Button>
        </SettingRow>
        <SettingRow icon={Shield} label="Vault PIN" description="Managed inside the Vault module">
          <Button size="sm" variant="ghost" onClick={() => toast.info('Open Vault to change its PIN')} className="rounded-xl h-8 text-xs text-muted-foreground">
            Go to Vault
          </Button>
        </SettingRow>
      </SettingSection>

      {/* Language & Region */}
      <SettingSection title="Language & Region" icon={Globe} delay={0.15}>
        <SettingRow icon={Languages} label="Language">
          <Select value={language} onValueChange={(v) => { setLanguage(v); mark(); }}>
            <SelectTrigger className="w-36 rounded-xl h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </SettingRow>
      </SettingSection>

      {/* Bottom Nav Customization */}
      <SettingSection title="Bottom Navigation" icon={Navigation} delay={0.18}>
        <div className="py-2">
          <p className="text-xs text-muted-foreground mb-3">Choose up to 5 items shown in the bottom bar (last slot is always "More")</p>
          <div className="space-y-2">
            {ALL_NAV_ITEMS.filter(i => i.path !== '/more').map(item => {
              const active = navItems.includes(item.path);
              return (
                <div key={item.path} className={cn('flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer', active ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 border-transparent')}
                  onClick={() => {
                    const current = navItems.filter(p => p !== '/more');
                    let next;
                    if (active) { next = current.filter(p => p !== item.path); }
                    else if (current.length < 4) { next = [...current, item.path]; }
                    else { toast.error('Maximum 4 items (+ More)'); return; }
                    const full = [...next, '/more'];
                    setNavItems(full);
                    mark();
                  }}
                >
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', active ? 'bg-primary/10' : 'bg-muted')}>
                    <item.icon className={cn('w-4 h-4', active ? 'text-primary' : 'text-muted-foreground')} />
                  </div>
                  <span className={cn('text-sm font-medium flex-1', active ? 'text-foreground' : 'text-muted-foreground')}>{item.label}</span>
                  <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all', active ? 'border-primary bg-primary' : 'border-muted-foreground/30')}>
                    {active && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SettingSection>

      {/* Data & Backup */}
      <SettingSection title="Data & Backup" icon={Database} delay={0.2}>
        <SettingRow icon={Download} label="Export Data" description="Download a backup of your data">
          <Button size="sm" variant="outline" onClick={handleExport} className="rounded-xl h-8 text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </SettingRow>
        <SettingRow icon={Smartphone} label="App Version" description="ORAs v2.0.0">
          <span className="text-xs text-muted-foreground">Latest</span>
        </SettingRow>
      </SettingSection>

      {/* Account */}
      <SettingSection title="Account" icon={User} delay={0.25}>
        <div className="py-1">
          <Button
            variant="outline"
            onClick={() => db.auth.logout('/login')}
            className="w-full rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </SettingSection>

      {/* Change PIN Dialog */}
      <Dialog open={showChangePIN} onOpenChange={setShowChangePIN}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><KeyRound className="w-4 h-4" /> Change App PIN</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {pinError && <p className="text-xs text-destructive">{pinError}</p>}
            <Input type="password" placeholder="New PIN (4-6 digits)" value={newPIN} onChange={(e) => { setNewPIN(e.target.value.slice(0, 6)); setPinError(''); }} className="rounded-xl text-center tracking-widest" maxLength={6} />
            <Input type="password" placeholder="Confirm new PIN" value={confirmPIN} onChange={(e) => { setConfirmPIN(e.target.value.slice(0, 6)); setPinError(''); }} className="rounded-xl text-center tracking-widest" maxLength={6} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowChangePIN(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={handleChangePIN} className="flex-1 rounded-xl">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}