import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Home, StickyNote, CheckSquare, Calendar, Wallet,
  FolderOpen, ScanLine, Lock, Target, Sparkles, Settings, CloudSun, FileText, PartyPopper, Map
} from 'lucide-react';

const pages = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Notes', path: '/notes', icon: StickyNote },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Calendar', path: '/calendar', icon: Calendar },
  { name: 'Finance', path: '/finance', icon: Wallet },
  { name: 'Files', path: '/files', icon: FolderOpen },
  { name: 'Scanner', path: '/scanner', icon: ScanLine },
  { name: 'Password Vault', path: '/vault', icon: Lock },
  { name: 'Habits', path: '/habits', icon: Target },
  { name: 'AI Assistant', path: '/assistant', icon: Sparkles },
  { name: 'Weather', path: '/weather', icon: CloudSun },
  { name: 'ORADOCS', path: '/oradocs', icon: FileText },
  { name: 'ROUTO', path: '/routo', icon: Map },
  { name: 'FESTO', path: '/festo', icon: PartyPopper },
  { name: 'NEORA', path: '/news', icon: FileText },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onOpenChange]);

  const handleSelect = (path) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search everything..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((page) => (
            <CommandItem
              key={page.path}
              onSelect={() => handleSelect(page.path)}
              className="gap-3"
            >
              <page.icon className="w-4 h-4 text-muted-foreground" />
              <span>{page.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
