import React from 'react';
import { cn } from '@/lib/utils';

const TASK_VISUAL_RULES = [
  {
    keywords: ['study', 'learn', 'homework', 'exam', 'education', 'read', 'book'],
    emoji: '📚',
    gradient: 'from-indigo-500/30 to-purple-600/30',
    glow: 'shadow-indigo-500/20',
  },
  {
    keywords: ['fitness', 'workout', 'gym', 'exercise', 'run', 'sport'],
    emoji: '🏋️',
    gradient: 'from-emerald-500/30 to-teal-600/30',
    glow: 'shadow-emerald-500/20',
  },
  {
    keywords: ['travel', 'trip', 'flight', 'vacation', 'holiday'],
    emoji: '✈️',
    gradient: 'from-sky-400/30 to-blue-600/30',
    glow: 'shadow-sky-500/20',
  },
  {
    keywords: ['finance', 'budget', 'money', 'bank', 'invest', 'pay', 'bill'],
    emoji: '💰',
    gradient: 'from-amber-500/30 to-orange-600/30',
    glow: 'shadow-amber-500/20',
  },
  {
    keywords: ['code', 'coding', 'develop', 'program', 'debug', 'deploy', 'build', 'software'],
    emoji: '💻',
    gradient: 'from-cyan-500/30 to-blue-600/30',
    glow: 'shadow-cyan-500/20',
  },
  {
    keywords: ['design', 'ui', 'ux', 'creative', 'art', 'figma'],
    emoji: '🎨',
    gradient: 'from-pink-500/30 to-rose-600/30',
    glow: 'shadow-pink-500/20',
  },
  {
    keywords: ['shop', 'buy', 'purchase', 'order', 'grocery', 'store'],
    emoji: '🛒',
    gradient: 'from-violet-500/30 to-purple-600/30',
    glow: 'shadow-violet-500/20',
  },
  {
    keywords: ['social', 'meet', 'friend', 'party', 'event', 'dinner'],
    emoji: '🎉',
    gradient: 'from-orange-400/30 to-red-500/30',
    glow: 'shadow-orange-500/20',
  },
  {
    keywords: ['health', 'doctor', 'medicine', 'medical', 'appointment'],
    emoji: '🩺',
    gradient: 'from-green-400/30 to-emerald-600/30',
    glow: 'shadow-green-500/20',
  },
  {
    keywords: ['work', 'office', 'meeting', 'project', 'presentation'],
    emoji: '💼',
    gradient: 'from-blue-500/30 to-indigo-600/30',
    glow: 'shadow-blue-500/20',
  },
  {
    keywords: ['cook', 'food', 'recipe', 'meal', 'kitchen', 'eat'],
    emoji: '🍳',
    gradient: 'from-yellow-500/30 to-orange-500/30',
    glow: 'shadow-yellow-500/20',
  },
  {
    keywords: ['clean', 'organize', 'tidy', 'laundry', 'house', 'home'],
    emoji: '🏠',
    gradient: 'from-teal-500/30 to-cyan-600/30',
    glow: 'shadow-teal-500/20',
  },
  {
    keywords: ['music', 'song', 'practice', 'instrument', 'piano', 'guitar'],
    emoji: '🎵',
    gradient: 'from-fuchsia-500/30 to-pink-600/30',
    glow: 'shadow-fuchsia-500/20',
  },
  {
    keywords: ['write', 'blog', 'journal', 'essay', 'content'],
    emoji: '✍️',
    gradient: 'from-slate-400/30 to-zinc-600/30',
    glow: 'shadow-slate-500/20',
  },
  {
    keywords: ['personal', 'self', 'habit', 'routine', 'morning'],
    emoji: '🌟',
    gradient: 'from-amber-400/30 to-yellow-600/30',
    glow: 'shadow-amber-400/20',
  },
];

const PRIORITY_EMOJI_MAP = {
  urgent: { emoji: '🔥', gradient: 'from-red-500/25 to-red-600/25', glow: 'shadow-red-500/20' },
  high: { emoji: '⚡', gradient: 'from-orange-500/25 to-orange-600/25', glow: 'shadow-orange-500/20' },
  medium: { emoji: '📋', gradient: 'from-blue-500/25 to-blue-600/25', glow: 'shadow-blue-500/20' },
  low: { emoji: '📝', gradient: 'from-gray-500/20 to-gray-600/20', glow: 'shadow-gray-500/10' },
};

const TASK_IMAGE_RULES = [
  { keywords: ['gym', 'workout', 'fitness', 'exercise'], image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=320' },
  { keywords: ['study', 'learn', 'homework'], image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=320' },
  { keywords: ['coding', 'code', 'dev', 'programming'], image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=320' },
  { keywords: ['travel', 'trip', 'flight', 'vacation'], image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=320' },
  { keywords: ['meeting', 'office', 'work'], image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=320' },
  { keywords: ['finance', 'money', 'budget', 'invest'], image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=320' },
  { keywords: ['shopping', 'shop', 'buy', 'grocery'], image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=320' },
  { keywords: ['food', 'meal', 'restaurant', 'cook', 'eat'], image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=320' },
  { keywords: ['movie', 'cinema', 'watch'], image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=320' },
  { keywords: ['music', 'song', 'listen'], image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=320' },
  { keywords: ['reading', 'book', 'read'], image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=320' },
  { keywords: ['swim', 'pool', 'swimming', 'ocean'], image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&q=80&w=320' },
  { keywords: ['run', 'running', 'jog'], image: 'https://images.unsplash.com/photo-1552674605-171d3146f776?auto=format&fit=crop&q=80&w=320' },
  { keywords: ['health', 'medical', 'doctor', 'medicine'], image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=320' },
  { keywords: ['family', 'home', 'house'], image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=320' },
];

const PRIORITY_IMAGES = {
  urgent: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&q=80&w=320',
  high: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&q=80&w=320',
  medium: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=320',
  low: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=320',
};

export function getTaskVisual(task) {
  // 1. Strict match on hashtag tags first
  const tags = (task.tags || []).map(t => t.replace(/^#/, '').toLowerCase());
  let matchedImage = null;
  
  for (const rule of TASK_IMAGE_RULES) {
    if (rule.keywords.some(kw => tags.includes(kw))) {
      matchedImage = rule.image;
      break;
    }
  }

  // 2. Loose match on title/description if no tag match
  if (!matchedImage) {
    const searchText = [
      task.title || '',
      task.description || '',
    ].join(' ').toLowerCase();

    const imageRule = TASK_IMAGE_RULES.find(rule => rule.keywords.some(kw => searchText.includes(kw)));
    if (imageRule) {
      matchedImage = imageRule.image;
    }
  }

  // 3. Fallback to abstract gradient if no match at all
  const abstractGradientImage = 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&q=80&w=320';
  const finalImage = matchedImage || abstractGradientImage;

  const fallback = PRIORITY_EMOJI_MAP[task.priority] || PRIORITY_EMOJI_MAP.medium;
  return {
    emoji: fallback.emoji,
    image: finalImage,
    gradient: fallback.gradient,
    glow: fallback.glow,
  };
}

export function TaskVisualBadge({ task, className }) {
  const { emoji, image, gradient, glow } = getTaskVisual(task);

  return (
    <div className={cn(
      'relative flex items-center justify-center overflow-hidden bg-gradient-to-br',
      gradient,
      glow,
      className
    )}>
      {image ? (
        <>
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
          {/* 10-15% dark overlay */}
          <div className="absolute inset-0 bg-black/15" />
          {/* Subtle vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.3)_100%)] pointer-events-none" />
        </>
      ) : (
        <span className="text-2xl sm:text-3xl select-none drop-shadow-lg" role="img">
          {emoji}
        </span>
      )}
    </div>
  );
}
