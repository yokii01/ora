import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format, parseISO, isSameDay, differenceInMinutes, startOfWeek, endOfWeek, eachDayOfInterval, isToday, getHours, getMinutes
} from 'date-fns';
import { Clock, MapPin, CalendarDays, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEventVisual } from './SmartScheduleIllustrations';

const HOUR_HEIGHT = 60;
const TOTAL_HOURS = 24;
const HALF_HOUR_HEIGHT = HOUR_HEIGHT / 2;

function formatHour(hour) {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

function getEventPosition(event) {
  try {
    const start = parseISO(event.start_date);
    const end = event.end_date ? parseISO(event.end_date) : new Date(start.getTime() + 60 * 60 * 1000);
    const startMinutes = getHours(start) * 60 + getMinutes(start);
    const durationMinutes = Math.max(differenceInMinutes(end, start), 15);
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20);
    return { top, height, startMinutes, durationMinutes };
  } catch {
    return { top: 0, height: HOUR_HEIGHT, startMinutes: 0, durationMinutes: 60 };
  }
}

function computeOverlapColumns(events) {
  const positioned = events.map(event => {
    const pos = getEventPosition(event);
    return { event, ...pos, end: pos.startMinutes + pos.durationMinutes };
  });

  positioned.sort((a, b) => a.startMinutes - b.startMinutes || b.durationMinutes - a.durationMinutes);

  const columns = [];

  positioned.forEach(item => {
    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      const lastInCol = columns[col][columns[col].length - 1];
      if (item.startMinutes >= lastInCol.end) {
        columns[col].push(item);
        item.column = col;
        placed = true;
        break;
      }
    }
    if (!placed) {
      item.column = columns.length;
      columns.push([item]);
    }
  });

  const totalColumns = columns.length || 1;
  return positioned.map(item => ({
    ...item,
    totalColumns,
  }));
}

function CurrentTimeIndicator({ minHour = 0 }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const minutes = getHours(now) * 60 + getMinutes(now);
  const top = (minutes / 60) * HOUR_HEIGHT - (minHour * HOUR_HEIGHT);

  return (
    <div className="absolute left-14 right-0 z-10 pointer-events-none" style={{ top }}>
      <div className="flex items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 shadow-lg shadow-red-500/40" />
        <div className="flex-1 h-px bg-red-500/70" />
      </div>
    </div>
  );
}

function TimelineEventBlock({ item, onEditEvent, minHour = 0 }) {
  const { event, top, height, column, totalColumns } = item;
  const visual = getEventVisual(event);
  const Icon = visual.IconComponent;

  const widthPercent = 100 / totalColumns;
  const leftPercent = column * widthPercent;
  
  // Extract persistent image securely
  let eventImg = null;
  if (event?.image_url) eventImg = event.image_url;
  else if (event?.attachment_url) eventImg = event.attachment_url;
  else {
    const imgAttach = event?.attachments?.find(a => a.type?.startsWith('image/'));
    if (imgAttach) eventImg = imgAttach.url;
  }

  // Cap visual height to avoid massive blocks for long events
  const visualHeight = Math.min(Math.max(height, 24), 160);
  const isLong = height >= 180; // 3+ hours
  
  const adjustedTop = top - (minHour * HOUR_HEIGHT);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: -4 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      whileHover={{ scale: 1.01, zIndex: 50 }}
      onClick={() => onEditEvent?.(event)}
      className="absolute z-20 cursor-pointer flex flex-col items-start"
      style={{
        top: `${adjustedTop}px`,
        height: `${Math.max(height, 24)}px`, // Maintains actual timeline slot duration for layout overlap calculations
        left: `calc(${leftPercent}% + 2px)`,
        width: `calc(${widthPercent}% - 4px)`,
      }}
    >
      <div 
        className={cn(
          "relative w-full rounded-2xl shadow-sm hover:shadow-md transition-shadow shrink-0 overflow-hidden flex flex-col justify-center",
          !eventImg && "border-l-4 bg-gradient-to-r backdrop-blur-sm",
          !eventImg && visual.gradient
        )}
        style={{ 
          height: `${visualHeight}px`,
          borderLeftColor: !eventImg ? getBorderColor(event.color) : undefined,
        }}
      >
        {eventImg && (
          <>
            <img src={eventImg} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0" />
            <div 
              className="absolute left-0 top-0 bottom-0 w-1.5 z-10 shadow-sm"
              style={{ backgroundColor: getBorderColor(event.color) }}
            />
          </>
        )}

        <div className={cn("relative z-10 flex items-start gap-1.5 p-2.5 w-full h-full flex-col justify-center", eventImg && "text-white")}>
          <div className="flex w-full items-start gap-1.5">
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className={cn("text-[12px] font-bold truncate leading-tight", eventImg ? "drop-shadow-md" : "text-foreground")}>
                {event.title}
              </p>
              
              {visualHeight > 36 && (
                <p className={cn("text-[10px] mt-1 flex items-center gap-1", eventImg ? "text-white/90 drop-shadow-sm" : "text-muted-foreground")}>
                  <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                  <span className="truncate">
                    {format(parseISO(event.start_date), 'h:mm a')}
                    {event.end_date && ` – ${format(parseISO(event.end_date), 'h:mm a')}`}
                  </span>
                </p>
              )}

              {visualHeight > 52 && event.location && (
                <p className={cn("text-[10px] mt-1 flex items-center gap-1 truncate", eventImg ? "text-white/80 drop-shadow-sm" : "text-muted-foreground")}>
                  <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                  {event.location}
                </p>
              )}

              {isLong && visualHeight >= 80 && (
                <p className={cn("text-[10px] mt-1 font-semibold flex items-center gap-1", eventImg ? "text-white/90 drop-shadow-sm" : "text-primary/80")}>
                  <CalendarDays className="w-2.5 h-2.5 flex-shrink-0" />
                  {format(parseISO(event.start_date), 'd MMMM yyyy')}
                </p>
              )}
            </div>
            
            {!eventImg && visualHeight > 30 && (
              <Icon className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getBorderColor(color) {
  const map = {
    blue: 'hsl(217, 91%, 60%)',
    green: 'hsl(160, 84%, 39%)',
    red: 'hsl(0, 84%, 60%)',
    orange: 'hsl(25, 95%, 53%)',
    purple: 'hsl(263, 70%, 50%)',
    pink: 'hsl(330, 81%, 60%)',
  };
  return map[color] || map.blue;
}

function DailyTimeline({ events, selectedDate, onCreateEvent, onEditEvent }) {
  const scrollRef = useRef(null);
  const dayEvents = events.filter(e => {
    try { return isSameDay(parseISO(e.start_date), selectedDate); } catch { return false; }
  });

  const positionedEvents = useMemo(() => computeOverlapColumns(dayEvents), [dayEvents]);

  // Calculate dynamic hour range
  const { minHour, displayHours } = useMemo(() => {
    if (dayEvents.length === 0) return { minHour: 8, maxHour: 18, displayHours: 10 };
    
    const startHours = dayEvents.map(e => {
      try { return getHours(parseISO(e.start_date)); } catch { return 8; }
    });
    const endHours = dayEvents.map(e => {
      try {
        const end = e.end_date ? parseISO(e.end_date) : new Date(parseISO(e.start_date).getTime() + 60*60000);
        return getHours(end) + (getMinutes(end) > 0 ? 1 : 0);
      } catch { return 18; }
    });
    
    const earliest = Math.min(...startHours);
    const latest = Math.max(...endHours);
    
    let currentHour = null;
    if (isSameDay(selectedDate, new Date())) {
      currentHour = getHours(new Date());
    }

    let minH = Math.max(0, earliest - 1);
    let maxH = Math.min(24, latest + 2);
    
    if (currentHour !== null) {
      minH = Math.min(minH, Math.max(0, currentHour - 1));
      maxH = Math.max(maxH, Math.min(24, currentHour + 2));
    }

    if (maxH - minH < 6) {
      maxH = Math.min(24, minH + 6);
      if (maxH - minH < 6) {
        minH = Math.max(0, maxH - 6);
      }
    }

    return { minHour: minH, maxHour: maxH, displayHours: maxH - minH };
  }, [dayEvents, selectedDate]);

  useEffect(() => {
    if (scrollRef.current && dayEvents.length > 0) {
      const now = new Date();
      const targetHour = isSameDay(selectedDate, now) ? getHours(now) : minHour + 1;
      const scrollTo = Math.max(0, (targetHour - minHour - 1) * HOUR_HEIGHT);
      scrollRef.current.scrollTo({ top: scrollTo, behavior: 'smooth' });
    }
  }, [selectedDate, minHour, dayEvents.length]);

  const handleTimeSlotClick = (hour, halfHour) => {
    const minutes = halfHour ? 30 : 0;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    onCreateEvent?.(`${dateStr}T${timeStr}`);
  };

  if (dayEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
          <CalendarDays className="w-5 h-5 text-muted-foreground/60" />
        </div>
        <p className="text-sm font-semibold text-foreground">No events scheduled</p>
        <p className="text-xs text-muted-foreground mt-1 mb-4">Your timeline is clear for the day.</p>
        <button 
          onClick={() => {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            onCreateEvent?.(`${dateStr}T12:00`);
          }}
          className="px-5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors shadow-sm"
        >
          Add Event
        </button>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="relative overflow-y-auto"
      style={{ maxHeight: 'min(65vh, 600px)', scrollBehavior: 'smooth' }}
    >
      <div className="relative" style={{ height: `${displayHours * HOUR_HEIGHT}px` }}>
        {/* Hour rows */}
        {Array.from({ length: displayHours }, (_, i) => {
          const hour = minHour + i;
          return (
            <div key={hour} className="absolute left-0 right-0" style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
              {/* Hour label */}
              <div className="absolute left-0 top-0 w-14 flex items-start justify-end pr-3 -mt-2">
                <span className="text-[10px] font-medium text-muted-foreground/60">{formatHour(hour)}</span>
              </div>
              {/* Full hour line */}
              <div className="absolute left-14 right-0 top-0 border-t border-border/30" />
              {/* Half hour line */}
              <div className="absolute left-14 right-0 border-t border-border/15" style={{ top: `${HALF_HOUR_HEIGHT}px` }} />
              {/* Clickable time slots */}
              <button
                className="absolute left-14 right-0 top-0 hover:bg-primary/5 transition-colors"
                style={{ height: `${HALF_HOUR_HEIGHT}px` }}
                onClick={() => handleTimeSlotClick(hour, false)}
                aria-label={`Create event at ${formatHour(hour)}`}
              />
              <button
                className="absolute left-14 right-0 hover:bg-primary/5 transition-colors"
                style={{ top: `${HALF_HOUR_HEIGHT}px`, height: `${HALF_HOUR_HEIGHT}px` }}
                onClick={() => handleTimeSlotClick(hour, true)}
                aria-label={`Create event at ${formatHour(hour)} 30`}
              />
            </div>
          );
        })}

        {/* Event blocks container */}
        <div className="absolute top-0 bottom-0 left-14 right-1">
          {positionedEvents.map(item => (
            <TimelineEventBlock
              key={item.event.id}
              item={item}
              onEditEvent={onEditEvent}
              minHour={minHour}
            />
          ))}
        </div>

        {/* Current time indicator */}
        {isSameDay(selectedDate, new Date()) && (
          <div className="absolute left-0 right-0 overflow-hidden pointer-events-none" style={{ top: 0, bottom: 0 }}>
            <CurrentTimeIndicator minHour={minHour} />
          </div>
        )}
      </div>
    </div>
  );
}

function WeeklyAgenda({ events, selectedDate, onEditEvent }) {
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const groupedEvents = weekDays.map(day => ({
    day,
    events: events
      .filter(e => { try { return isSameDay(parseISO(e.start_date), day); } catch { return false; } })
      .sort((a, b) => a.start_date.localeCompare(b.start_date)),
  }));

  return (
    <div className="space-y-1 overflow-y-auto" style={{ maxHeight: 'min(65vh, 600px)' }}>
      {groupedEvents.map(({ day, events: dayEvents }) => (
        <motion.div
          key={day.toISOString()}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl',
            isToday(day) && 'bg-primary/5'
          )}>
            <div className={cn(
              'w-9 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0',
              isToday(day) ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}>
              <span className="text-[9px] font-bold uppercase leading-none">{format(day, 'EEE')}</span>
              <span className="text-sm font-bold leading-tight">{format(day, 'd')}</span>
            </div>
            <div className="flex-1 min-w-0">
              {dayEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground/50 italic">No events</p>
              ) : (
                <div className="space-y-1">
                  {dayEvents.map(event => {
                    const visual = getEventVisual(event);
                    const Icon = visual.IconComponent;
                    return (
                      <motion.button
                        key={event.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onEditEvent?.(event)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left',
                          'bg-gradient-to-r border border-border/20 hover:border-border/40 transition-all',
                          visual.gradient
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold truncate">{event.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(parseISO(event.start_date), 'h:mm a')}
                            {event.end_date && ` – ${format(parseISO(event.end_date), 'h:mm a')}`}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function ScheduleView({ events, selectedDate, onCreateEvent, onEditEvent }) {
  const [subView, setSubView] = useState('timeline');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-sm"
    >
      {/* Sub-view toggle */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-muted/20">
        <h3 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {format(selectedDate, 'EEEE, MMMM d')}
        </h3>
        <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setSubView('timeline')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all',
              subView === 'timeline' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <CalendarDays className="w-3 h-3" />
            Day
          </button>
          <button
            onClick={() => setSubView('agenda')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all',
              subView === 'agenda' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List className="w-3 h-3" />
            Week
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {subView === 'timeline' ? (
          <motion.div
            key="timeline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <DailyTimeline
              events={events}
              selectedDate={selectedDate}
              onCreateEvent={onCreateEvent}
              onEditEvent={onEditEvent}
            />
          </motion.div>
        ) : (
          <motion.div
            key="agenda"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="p-2"
          >
            <WeeklyAgenda
              events={events}
              selectedDate={selectedDate}
              onEditEvent={onEditEvent}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
