const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, isToday, parseISO, addDays, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import WidgetCard from './WidgetCard';

const eventColors = {
  blue: 'bg-info/10 border-info/30 text-info',
  green: 'bg-success/10 border-success/30 text-success',
  red: 'bg-destructive/10 border-destructive/30 text-destructive',
  orange: 'bg-warning/10 border-warning/30 text-warning',
  purple: 'bg-primary/10 border-primary/30 text-primary',
  pink: 'bg-pink-100 border-pink-200 text-pink-600',
};

export default function CalendarWidget({ events = [], delay = 0 }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [rescheduling, setRescheduling] = useState(null);
  const queryClient = useQueryClient();

  const dayEvents = events
    .filter(e => {
      try {
        const d = parseISO(e.start_date);
        return format(d, 'yyyy-MM-dd') === format(viewDate, 'yyyy-MM-dd');
      } catch { return false; }
    })
    .slice(0, 3);

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, newDate }) => {
      const event = events.find(e => e.id === id);
      const orig = parseISO(event.start_date);
      const diff = event.end_date ? parseISO(event.end_date) - orig : 3600000;
      const newStart = new Date(newDate + 'T' + format(orig, 'HH:mm:ss'));
      const newEnd = new Date(newStart.getTime() + diff);
      return db.entities.CalendarEvent.update(id, {
        start_date: newStart.toISOString(),
        end_date: newEnd.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setRescheduling(null);
    },
  });

  const isToday_ = isToday(viewDate);

  return (
    <WidgetCard delay={delay}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-success" />
          </div>
          <h3 className="font-semibold text-sm">
            {isToday_ ? "Today's Events" : format(viewDate, 'MMM d')}
          </h3>
        </div>
        <Link to="/calendar" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Date navigator */}
      <div className="flex items-center justify-between mb-3 bg-muted/40 rounded-xl p-1">
        <button onClick={() => setViewDate(subDays(viewDate, 1))} className="p-1 rounded-lg hover:bg-background transition-colors">
          <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <span className="text-xs font-medium text-muted-foreground">{format(viewDate, 'EEE, MMM d')}</span>
        <button onClick={() => setViewDate(addDays(viewDate, 1))} className="p-1 rounded-lg hover:bg-background transition-colors">
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {dayEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground py-3 text-center">No events on this day</p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {dayEvents.map((event) => (
              <motion.div
                key={event.id}
                layout
                className={`flex items-center gap-3 py-2 px-3 rounded-lg border cursor-pointer group ${eventColors[event.color] || eventColors.blue}`}
                onClick={() => setRescheduling(event.id)}
                title="Click to reschedule"
              >
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{event.title}</p>
                  <p className="text-[10px] opacity-70">{format(parseISO(event.start_date), 'h:mm a')}</p>
                </div>
                <span className="text-[9px] opacity-0 group-hover:opacity-70 transition-opacity">Reschedule</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Reschedule inline picker */}
      <AnimatePresence>
        {rescheduling && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mt-3 p-3 bg-muted/50 rounded-xl border border-border/60"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium">Pick new date</p>
              <button onClick={() => setRescheduling(null)}><X className="w-3 h-3 text-muted-foreground" /></button>
            </div>
            <input
              type="date"
              className="w-full text-xs bg-background border border-border rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary"
              defaultValue={format(viewDate, 'yyyy-MM-dd')}
              onChange={(e) => e.target.value && rescheduleMutation.mutate({ id: rescheduling, newDate: e.target.value })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </WidgetCard>
  );
}