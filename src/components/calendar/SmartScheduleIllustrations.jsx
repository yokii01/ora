import React from 'react';
import {
  Briefcase, Dumbbell, Users, BookOpen, Heart, Plane, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

const EVENT_VISUAL_RULES = [
  {
    keywords: ['work', 'meeting', 'office'],
    gradient: 'from-blue-600/15 to-indigo-600/15',
    IconComponent: Briefcase,
  },
  {
    keywords: ['fitness', 'workout', 'gym', 'exercise'],
    gradient: 'from-emerald-500/15 to-teal-500/15',
    IconComponent: Dumbbell,
  },
  {
    keywords: ['social', 'party', 'dinner', 'lunch'],
    gradient: 'from-orange-400/15 to-pink-500/15',
    IconComponent: Users,
  },
  {
    keywords: ['study', 'learn', 'exam', 'class'],
    gradient: 'from-purple-500/15 to-violet-500/15',
    IconComponent: BookOpen,
  },
  {
    keywords: ['health', 'doctor', 'medical'],
    gradient: 'from-green-400/15 to-emerald-500/15',
    IconComponent: Heart,
  },
  {
    keywords: ['travel', 'trip', 'flight', 'vacation'],
    gradient: 'from-sky-400/15 to-blue-500/15',
    IconComponent: Plane,
  },
];

const COLOR_GRADIENT_MAP = {
  blue: 'from-blue-500/10 to-blue-600/10',
  green: 'from-emerald-500/10 to-emerald-600/10',
  red: 'from-red-500/10 to-red-600/10',
  orange: 'from-orange-500/10 to-orange-600/10',
  purple: 'from-violet-500/10 to-violet-600/10',
  pink: 'from-pink-500/10 to-pink-600/10',
};

export function getEventVisual(event) {
  const searchText = `${event.title || ''} ${event.description || ''}`.toLowerCase();

  for (const rule of EVENT_VISUAL_RULES) {
    if (rule.keywords.some(kw => searchText.includes(kw))) {
      return {
        gradient: rule.gradient,
        IconComponent: rule.IconComponent,
      };
    }
  }

  return {
    gradient: COLOR_GRADIENT_MAP[event.color] || COLOR_GRADIENT_MAP.blue,
    IconComponent: Calendar,
  };
}

export function EventVisualBadge({ event, className }) {
  const { gradient, IconComponent } = getEventVisual(event);

  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gradient-to-r',
      gradient,
      className
    )}>
      <IconComponent className="w-2.5 h-2.5 text-muted-foreground/70" />
    </div>
  );
}
