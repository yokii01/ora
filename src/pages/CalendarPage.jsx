const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { motion, AnimatePresence } from 'framer-motion';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth,
  isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek,
  parseISO, addDays
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar, Repeat, AlarmClock,
  Video, Users, Coffee, Clock, Edit3, FileText, Image as ImageIcon, MapPin, X, CalendarDays
} from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ScheduleView from '@/components/calendar/ScheduleView';
import { getEventVisual } from '@/components/calendar/SmartScheduleIllustrations';
import { useNavigate } from 'react-router-dom';
import FestivalBottomSheet from '@/components/calendar/FestivalBottomSheet';

const COLOR_MAP = {
  blue: { bg: 'bg-blue-500', light: 'bg-blue-500/15 text-blue-600 dark:text-blue-400', dot: 'bg-blue-500', border: 'border-l-blue-500' },
  green: { bg: 'bg-emerald-500', light: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-l-emerald-500' },
  red: { bg: 'bg-red-500', light: 'bg-red-500/15 text-red-600 dark:text-red-400', dot: 'bg-red-500', border: 'border-l-red-500' },
  orange: { bg: 'bg-orange-500', light: 'bg-orange-500/15 text-orange-600 dark:text-orange-400', dot: 'bg-orange-500', border: 'border-l-orange-500' },
  purple: { bg: 'bg-violet-500', light: 'bg-violet-500/15 text-violet-600 dark:text-violet-400', dot: 'bg-violet-500', border: 'border-l-violet-500' },
  pink: { bg: 'bg-pink-500', light: 'bg-pink-500/15 text-pink-600 dark:text-pink-400', dot: 'bg-pink-500', border: 'border-l-pink-500' },
};

const EVENT_TYPES = [
  { id: 'event', label: 'Event', icon: Calendar, color: 'blue' },
  { id: 'meeting', label: 'Meeting', icon: Users, color: 'purple' },
  { id: 'reminder', label: 'Reminder', icon: AlarmClock, color: 'orange' },
  { id: 'call', label: 'Video Call', icon: Video, color: 'green' },
  { id: 'personal', label: 'Personal', icon: Coffee, color: 'pink' },
  { id: 'recurring', label: 'Recurring', icon: Repeat, color: 'red' },
];

const INDIA_FIXED_HOLIDAYS = {
  '01-26': 'Republic Day',
  '08-15': 'Independence Day',
  '10-02': 'Gandhi Jayanti',
  '12-25': 'Christmas',
};

const INDIA_FESTIVAL_HOLIDAYS = {
  '2026-01-01': "New Year's Day",
  '2026-01-13': 'Bhogi',
  '2026-01-14': 'Pongal / Makar Sankranti',
  '2026-01-15': 'Thiruvalluvar Day',
  '2026-01-16': 'Uzhavar Thirunal',
  '2026-02-01': 'Thai Poosam',
  '2026-03-04': 'Holi',
  '2026-03-21': 'Id-ul-Fitr (Ramzan)',
  '2026-03-26': 'Ram Navami',
  '2026-03-31': 'Mahavir Jayanti',
  '2026-04-03': 'Good Friday',
  '2026-04-14': 'Tamil New Year / Dr. B.R. Ambedkar Birthday',
  '2026-04-18': 'Chitra Pournami',
  '2026-05-01': 'May Day',
  '2026-05-12': 'Vaikasi Visakam',
  '2026-05-27': 'Bakrid',
  '2026-06-26': 'Muharram',
  '2026-07-28': 'Aadi Perukku',
  '2026-08-07': 'Varalakshmi Nombu',
  '2026-08-26': 'Onam / Milad-un-Nabi',
  '2026-09-04': 'Krishna Jayanthi',
  '2026-09-14': 'Vinayagar Chaturthi',
  '2026-09-24': 'Mahalaya Amavasya',
  '2026-10-19': 'Ayutha Pooja',
  '2026-10-20': 'Vijaya Dasami / Dussehra',
  '2026-11-06': 'Karthigai Deepam',
  '2026-11-08': 'Diwali / Deepavali',
  '2026-11-24': 'Guru Nanak Jayanti',
  '2026-12-19': 'Vaikunda Ekadasi',
  '2026-12-24': 'Christmas Eve',
};

const getHoliday = day => {
  const iso = format(day, 'yyyy-MM-dd');
  const fixed = INDIA_FIXED_HOLIDAYS[format(day, 'MM-dd')];
  if (INDIA_FESTIVAL_HOLIDAYS[iso]) return { name: INDIA_FESTIVAL_HOLIDAYS[iso], type: 'festival' };
  if (fixed) return { name: fixed, type: 'national' };
  if (day.getDay() === 0) return { name: 'Sunday', type: 'weekend' };
  if (day.getDay() === 6) return { name: 'Saturday', type: 'weekend' };
  return null;
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [view, setView] = useState('month');
  const [showJumpDate, setShowJumpDate] = useState(false);
  const [jumpDateVal, setJumpDateVal] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedFestival, setSelectedFestival] = useState(null);
  const [showFestivalSheet, setShowFestivalSheet] = useState(false);
  const [previewEvent, setPreviewEvent] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const imageInputRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => db.entities.CalendarEvent.list('-start_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.CalendarEvent.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); setShowAdd(false); setEditEvent(null); toast.success('Event created!'); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.CalendarEvent.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); setShowAdd(false); setEditEvent(null); toast.success('Event updated!'); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.CalendarEvent.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); setShowAdd(false); toast.success('Event deleted'); },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calDays = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(selectedDate), i));

  const getEventsForDay = (day) => events.filter(e => {
    try { return isSameDay(parseISO(e.start_date), day); } catch { return false; }
  });

  const openNew = (type = 'event') => {
    const typeConf = EVENT_TYPES.find(t => t.id === type) || EVENT_TYPES[0];
    const newState = {
      title: '', description: '', color: typeConf.color, location: '',
      start_date: format(selectedDate, "yyyy-MM-dd'T'09:00"),
      end_date: format(selectedDate, "yyyy-MM-dd'T'10:00"),
      all_day: false, event_type: type,
    };
    setEditEvent(newState);
    setIsDirty(false);
    setShowAdd(true);
  };

  const updateEditEvent = (updates) => {
    setIsDirty(true);
    setEditEvent(prev => typeof updates === 'function' ? updates(prev) : { ...prev, ...updates });
  };

  const saveEvent = () => {
    if (!editEvent?.title?.trim()) return;
    if (editEvent.id) updateMutation.mutate({ id: editEvent.id, data: editEvent });
    else createMutation.mutate(editEvent);
  };

  const getEventImage = (event) => {
    if (event?.image_url) return event.image_url;
    if (event?.attachment_url) return event.attachment_url;
    const imgAttach = event?.attachments?.find(a => a.type?.startsWith('image/'));
    return imgAttach?.url || '';
  };

  const compressImage = (file, maxWidth = 800) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6)); // Compresses base64 payload footprint
        };
      };
    });
  };

  const addEventImage = async (file) => {
    if (!file || !file.type.startsWith('image/')) return toast.error('Choose an image file');
    
    // Instantly show preview
    const tempUrl = URL.createObjectURL(file);
    updateEditEvent(event => ({
      ...event,
      image_url: tempUrl,
      attachment_url: '',
      attachments: [{ name: file.name, type: file.type, url: tempUrl }, ...(event?.attachments || []).filter(item => !item.type?.startsWith('image'))],
    }));

    try {
      // Compress the image to ensure it saves properly and fits in local/remote DB limits
      const compressedDataUrl = await compressImage(file);
      
      updateEditEvent(event => ({
        ...event,
        image_url: compressedDataUrl,
        attachments: [{ name: file.name, type: file.type, url: compressedDataUrl }, ...(event?.attachments || []).filter(item => !item.type?.startsWith('image'))],
      }));
    } catch (err) {
      toast.error('Failed to compress image for saving');
    }
  };

  const openPreview = (event) => setPreviewEvent(event);

  const openPreviewEdit = () => {
    if (!previewEvent) return;
    setEditEvent({ ...previewEvent });
    setIsDirty(false);
    setPreviewEvent(null);
    setShowAdd(true);
  };

  const todayEventCount = getEventsForDay(new Date()).length;

  const canSave = Boolean(editEvent?.title?.trim() && isDirty);

  return (
    <div className="space-y-4 pb-2">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        {/* Month nav — top row */}
        <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center justify-between gap-1 sm:justify-start">
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-2xl hover:bg-muted transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <motion.h2
              key={format(currentMonth, 'MMM-yyyy')}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="min-w-0 flex-1 text-center text-lg font-bold tracking-tight sm:min-w-[140px] sm:flex-none sm:text-xl"
            >
              {format(currentMonth, 'MMMM yyyy')}
            </motion.h2>
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-2xl hover:bg-muted transition-colors">
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1.5 sm:flex">
            {/* View toggle */}
            <div className="flex bg-muted rounded-xl p-0.5 gap-0.5">
              {['day', 'week', 'month'].map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={cn('px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize',
                    view === v ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                  {v}
                </button>
              ))}
            </div>
            <motion.button whileTap={{ scale: 0.92 }}
              onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
              Today
            </motion.button>
            <motion.button whileTap={{ scale: 0.92 }}
              onClick={() => setShowJumpDate(v => !v)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors">
              <span className="sm:hidden">Date</span><span className="hidden sm:inline">Jump</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Jump to Date */}
      <AnimatePresence>
        {showJumpDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 bg-muted/40 rounded-2xl p-3 mb-1">
              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="date"
                value={jumpDateVal}
                onChange={e => setJumpDateVal(e.target.value)}
                aria-label="Jump to date"
                className="min-w-0 w-full bg-card border border-border/50 rounded-xl px-2 sm:px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <Button size="sm" className="rounded-xl text-xs h-8 px-3"
                onClick={() => {
                  if (jumpDateVal) {
                    const d = parseISO(jumpDateVal);
                    setCurrentMonth(d);
                    setSelectedDate(d);
                    setShowJumpDate(false);
                  }
                }}>
                Go
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {events.length === 0 && (
        <EmptyState 
          icon={<CalendarDays />} 
          title="Plan your schedule" 
          description="Your calendar is completely clear. Start organizing your time, add reminders, and build routines."
          action={{ label: "Add Event", icon: <Plus className="w-4 h-4" />, onClick: () => openNew() }}
        />
      )}
      
      <div className={events.length === 0 ? "hidden" : "block"}>

      {/* Calendar grid */}
      {view !== 'day' && (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-sm mb-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border/40 bg-muted/30">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
            <div key={i} className="py-2.5 text-center text-[10px] font-bold text-muted-foreground tracking-wider uppercase">{d}</div>
          ))}
        </div>

        {/* Month grid */}
        {view === 'month' && (
          <AnimatePresence mode="wait">
            <motion.div
              key={format(currentMonth, 'MM-yyyy')}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-7"
            >
              {calDays.map((day, i) => {
                const dayEvents = getEventsForDay(day);
                const selected = isSameDay(day, selectedDate);
                const todayDay = isToday(day);
                const inMonth = isSameMonth(day, currentMonth);
                const holiday = getHoliday(day);
                return (
                  <motion.button
                    key={day.toISOString()}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.003 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'min-h-[60px] sm:min-h-[72px] border-b border-r border-border/20 text-left p-1.5 transition-colors relative',
                      !inMonth && 'bg-muted/10',
                      holiday && inMonth && 'bg-red-500/[0.06] hover:bg-red-500/[0.12]',
                      selected && !todayDay && 'bg-primary/5',
                      'hover:bg-muted/30'
                    )}
                  >
                    <span className={cn(
                      'w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium mx-auto mb-1 transition-all',
                      todayDay && 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/30',
                      selected && !todayDay && 'bg-primary/15 text-primary font-semibold ring-1 ring-primary/30',
                      !inMonth && 'text-muted-foreground/30 text-xs',
                    )}>
                      {format(day, 'd')}
                    </span>
                    {holiday && inMonth && (
                      <span onClick={(e) => { e.stopPropagation(); setSelectedFestival({ ...holiday, date: format(day, 'MMMM do, yyyy') }); setShowFestivalSheet(true); }} className="mb-0.5 block truncate px-0.5 text-center text-[7px] font-semibold text-red-600/80 dark:text-red-300/80 hover:bg-red-500/20 rounded cursor-pointer transition-colors" title={holiday.name}>
                        {holiday.name}
                      </span>
                    )}
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map(e => {
                        const c = COLOR_MAP[e.color] || COLOR_MAP.blue;
                        const visual = getEventVisual(e);
                        const Icon = visual.IconComponent;
                        return (
                          <div
                            key={e.id}
                            onClick={(event) => { event.stopPropagation(); openPreview(e); }}
                            className={cn('flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded-md truncate font-medium leading-tight border-l-2 bg-gradient-to-r cursor-pointer', visual.gradient, c.border)}
                          >
                            <Icon className="w-2.5 h-2.5 flex-shrink-0 opacity-70" />
                            <span className="truncate">{e.title}</span>
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-[8px] text-muted-foreground px-1.5 font-medium">+{dayEvents.length - 2} more</div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Week view */}
        {view === 'week' && (
          <div className="grid grid-cols-7">
            {weekDays.map((day, i) => {
              const dayEvents = getEventsForDay(day);
              const selected = isSameDay(day, selectedDate);
              const todayDay = isToday(day);
              const holiday = getHoliday(day);
              return (
                <motion.div key={day.toISOString()}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedDate(day)}
                  className={cn('p-2 min-h-[100px] border-r border-border/20 cursor-pointer hover:bg-muted/30 transition-colors', holiday && 'bg-red-500/[0.06]', selected && 'bg-primary/5')}
                >
                  <span className={cn('w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium mx-auto mb-2',
                    todayDay && 'bg-primary text-primary-foreground font-bold',
                    selected && !todayDay && 'bg-primary/15 text-primary ring-1 ring-primary/30')}>
                    {format(day, 'd')}
                  </span>
                  {holiday && <p onClick={(e) => { e.stopPropagation(); setSelectedFestival({ ...holiday, date: format(day, 'MMMM do, yyyy') }); setShowFestivalSheet(true); }} className="mb-1 truncate text-center text-[7px] font-semibold text-red-600/80 dark:text-red-300/80 hover:bg-red-500/20 rounded cursor-pointer transition-colors px-1">{holiday.name}</p>}
                  <div className="space-y-1">
                    {dayEvents.map(e => {
                      const c = COLOR_MAP[e.color] || COLOR_MAP.blue;
                      const visual = getEventVisual(e);
                      const Icon = visual.IconComponent;
                      return (
                        <div
                          key={e.id}
                          onClick={(event) => { event.stopPropagation(); openPreview(e); }}
                          className={cn('flex items-center gap-1 text-[8px] px-1.5 py-1 rounded-lg font-medium truncate border-l-2 bg-gradient-to-r cursor-pointer', visual.gradient, c.border)}
                        >
                          <Icon className="w-2.5 h-2.5 flex-shrink-0 opacity-70" />
                          <span className="truncate">{e.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
      )}

      {/* Selected day section */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-muted-foreground ml-1">Schedule</h3>
          <Button onClick={() => openNew()} size="sm" className="rounded-2xl gap-1 h-8 px-3 shadow-md shadow-primary/20 shrink-0">
            <Plus className="w-3.5 h-3.5" />
            <span className="text-xs">Add Event</span>
          </Button>
        </div>

        <ScheduleView 
          events={events} 
          selectedDate={selectedDate} 
          onCreateEvent={(start_date) => {
             const newState = {
               title: '', description: '', color: 'blue', location: '',
               start_date, end_date: format(new Date(new Date(start_date).getTime() + 60*60000), "yyyy-MM-dd'T'HH:mm"),
               all_day: false, event_type: 'event'
             };
             setEditEvent(newState);
             setIsDirty(false);
             setShowAdd(true);
          }}
          onEditEvent={openPreview}
        />
      </motion.div>

      <FestivalBottomSheet 
        open={showFestivalSheet} 
        onOpenChange={setShowFestivalSheet} 
        festival={selectedFestival} 
      />

      {/* Schedule Preview */}
      <Dialog open={!!previewEvent} onOpenChange={(open) => !open && setPreviewEvent(null)}>
        <DialogContent className="w-[95vw] max-w-md overflow-hidden rounded-[2rem] p-0">
          {previewEvent && (
            <div className="max-h-[86vh] overflow-y-auto">
              <div className="relative h-44 w-full overflow-hidden bg-muted/20">
                {getEventImage(previewEvent) ? (
                  <img src={getEventImage(previewEvent)} alt={previewEvent.title} className="h-full w-full object-cover" />
                ) : (
                  <div className={cn("absolute inset-0 opacity-20", COLOR_MAP[previewEvent.color]?.bg || "bg-primary")} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              </div>
              <div className="space-y-5 p-5 pt-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">Schedule Preview</p>
                    <h3 className="mt-1 text-2xl font-bold leading-tight tracking-tight break-words">{previewEvent.title}</h3>
                  </div>
                  <button onClick={() => setPreviewEvent(null)} className="rounded-full bg-muted/70 p-2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3">
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">
                        {format(parseISO(previewEvent.start_date), 'h:mm a')}
                        {previewEvent.end_date && ` - ${format(parseISO(previewEvent.end_date), 'h:mm a')}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(previewEvent.start_date), 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  {previewEvent.location && (
                    <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3">
                      <MapPin className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">{previewEvent.location}</p>
                    </div>
                  )}
                  {previewEvent.description && (
                    <div className="rounded-2xl bg-muted/40 p-3">
                      <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" /> Notes
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{previewEvent.description}</p>
                    </div>
                  )}

                </div>

                <div className="flex gap-2 border-t border-border/40 pt-4">
                  <Button variant="outline" onClick={() => setPreviewEvent(null)} className="flex-1 rounded-2xl">Close</Button>
                  <Button onClick={openPreviewEdit} className="flex-1 rounded-2xl gap-2">
                    <Edit3 className="h-4 w-4" /> Edit
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Editor Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="w-[95vw] max-w-md max-h-[88vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-4 pt-4 pb-2 border-b border-border/40 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-primary" />
              {editEvent?.id ? 'Edit Event' : 'New Event'}
            </DialogTitle>
          </DialogHeader>
          {editEvent && (
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
              {/* Event type pills — wrapping grid on mobile */}
              {!editEvent.id && (
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map(type => {
                    const TypeIcon = type.icon;
                    return (
                      <button key={type.id}
                        onClick={() => updateEditEvent({ event_type: type.id, color: type.color })}
                        className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium border transition-all',
                          editEvent.event_type === type.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>
                        <TypeIcon className="w-3 h-3" />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              )}

              <Input
                placeholder="Event title"
                value={editEvent.title}
                onChange={e => updateEditEvent({ title: e.target.value })}
                className="text-base font-medium rounded-2xl"
                autoFocus
              />
              <Textarea
                placeholder="Description (optional)"
                value={editEvent.description || ''}
                onChange={e => updateEditEvent({ description: e.target.value })}
                className="resize-none rounded-2xl"
                rows={2}
              />
              <Input
                placeholder="Location (optional)"
                value={editEvent.location || ''}
                onChange={e => updateEditEvent({ location: e.target.value })}
                className="rounded-2xl"
              />
              <div className="rounded-2xl border border-border/50 bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Image Attachment</p>
                    <p className="text-[11px] text-muted-foreground/80">Add a visual reference for this schedule.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="rounded-2xl gap-1.5" onClick={() => imageInputRef.current?.click()}>
                    <ImageIcon className="h-3.5 w-3.5" /> Add
                  </Button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => { addEventImage(event.target.files?.[0]); event.target.value = ''; }}
                  />
                </div>
                {getEventImage(editEvent) && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-border/50 bg-background relative z-10">
                    <img src={getEventImage(editEvent)} alt="Event attachment preview" className="max-h-44 w-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (imageInputRef.current) imageInputRef.current.value = '';
                        updateEditEvent(event => ({
                          ...event,
                          image_url: '',
                          attachment_url: '',
                          attachments: (event.attachments || []).filter(item => !item.type?.startsWith('image'))
                        }));
                      }}
                      className="flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 relative z-20 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove image
                    </button>
                  </div>
                )}
              </div>
              {/* Start/End stack vertically on mobile */}
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Start</label>
                  <Input type="datetime-local" value={editEvent.start_date || ''} onChange={e => updateEditEvent({ start_date: e.target.value })} className="rounded-2xl text-xs w-full" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">End</label>
                  <Input type="datetime-local" value={editEvent.end_date || ''} onChange={e => updateEditEvent({ end_date: e.target.value })} className="rounded-2xl text-xs w-full" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Color</label>
                <div className="flex gap-2.5 flex-wrap">
                  {Object.entries(COLOR_MAP).map(([key, c]) => (
                    <button key={key} onClick={() => updateEditEvent({ color: key })}
                      className={cn('w-9 h-9 rounded-full transition-all hover:scale-110', c.bg,
                        editEvent.color === key ? 'ring-2 ring-offset-2 ring-foreground scale-125' : '')} />
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* Always-visible footer buttons */}
          {editEvent && (
            <div className="flex items-center gap-2 px-4 py-3 border-t border-border/40 flex-shrink-0">
              {editEvent.id && (
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 rounded-2xl"
                  onClick={() => { deleteMutation.mutate(editEvent.id); setShowAdd(false); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-2xl">Cancel</Button>
                <Button onClick={saveEvent} disabled={!canSave} className="rounded-2xl">Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
