import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, DollarSign, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLAN_TYPES, STATUS_CONFIG, getCoverImage } from './planUtils';

export default function PlanCard({ plan, view, onClick }) {
  const typeInfo = PLAN_TYPES.find(t => t.type === plan.plan_type) || PLAN_TYPES[0];
  const statusInfo = STATUS_CONFIG[plan.status] || STATUS_CONFIG.active;
  const coverImage = plan.cover_image || getCoverImage(plan.plan_type, plan.title);
  const progress = plan.progress || 0;
  const isListView = view === 'list';

  if (isListView) {
    return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all text-left"
      >
        <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-muted">
          <img src={coverImage} alt={plan.title} className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg">{typeInfo.emoji}</span>
            <span className="font-semibold text-sm truncate">{plan.title}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{plan.description || typeInfo.label}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">{progress}%</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusInfo.bg, statusInfo.text)}>
            {statusInfo.label}
          </span>
          {plan.end_date && <span className="text-[10px] text-muted-foreground">{plan.end_date}</span>}
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full rounded-3xl overflow-hidden bg-card border border-border/40 hover:border-primary/30 hover:shadow-xl shadow-md transition-all text-left group"
    >
      {/* Cover image */}
      <div className="relative h-44 bg-muted overflow-hidden">
        <img
          src={coverImage}
          alt={plan.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/10">
            <span>{typeInfo.emoji}</span>
            <span>{typeInfo.label}</span>
          </span>
        </div>

        {/* Status */}
        <div className="absolute top-3 right-3">
          <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full', statusInfo.bg, statusInfo.text)}>
            {statusInfo.label}
          </span>
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-bold text-white text-base leading-tight truncate">{plan.title}</h3>
          {plan.location && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-white/70" />
              <span className="text-[11px] text-white/80 truncate">{plan.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        {plan.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{plan.description}</p>
        )}

        {/* Progress */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-primary"
            />
          </div>
          <span className="text-[11px] font-semibold text-primary">{progress}%</span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {plan.start_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {plan.start_date}
            </span>
          )}
          {plan.budget > 0 && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {plan.budget.toLocaleString()}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 text-primary font-semibold">
            View <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.button>
  );
}