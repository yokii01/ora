import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLAN_TYPES, PLAN_QUESTIONS, getCoverImage } from './planUtils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const COMMON_FIELDS = [
  { id: 'title', label: 'Plan Title', type: 'text', placeholder: 'Give your plan a name', required: true },
  { id: 'description', label: 'Description', type: 'textarea', placeholder: 'What is this plan about?' },
  { id: 'start_date', label: 'Start Date', type: 'date' },
  { id: 'end_date', label: 'End Date', type: 'date' },
  { id: 'budget', label: 'Budget ($)', type: 'number', placeholder: '0' },
  { id: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'urgent'] },
  { id: 'status', label: 'Status', type: 'select', options: ['draft', 'active', 'upcoming'] },
];

export default function CreatePlanFlow({ onClose, onCreate, isCreating }) {
  const [step, setStep] = useState(0); // 0=type, 1=common, 2=specific
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({
    status: 'draft', priority: 'medium',
  });
  const [specificData, setSpecificData] = useState({});

  const typeInfo = PLAN_TYPES.find(t => t.type === selectedType);
  const specificQuestions = PLAN_QUESTIONS[selectedType] || PLAN_QUESTIONS.custom;

  const setField = (key, value) => setFormData(p => ({ ...p, [key]: value }));
  const setSpecific = (key, value) => setSpecificData(p => ({ ...p, [key]: value }));

  const handleCreate = () => {
    const coverImage = getCoverImage(selectedType, formData.title);
    const budget = parseFloat(formData.budget) || 0;
    const notes = Object.entries(specificData)
      .filter(([, v]) => v)
      .map(([k, v]) => `**${k.replace(/_/g, ' ')}:** ${v}`)
      .join('\n\n');

    onCreate({
      ...formData,
      plan_type: selectedType,
      cover_image: coverImage,
      budget,
      progress: 0,
      notes: notes || formData.notes || '',
      milestones: [],
      checklist: [],
      tags: [],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-background rounded-t-[32px] sm:rounded-[28px] overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/40 flex-shrink-0">
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="font-bold text-base">
                {step === 0 ? 'Choose Plan Type' : step === 1 ? 'Basic Details' : `${typeInfo?.label} Details`}
              </h2>
              <div className="flex gap-1 mt-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className={cn('h-1 rounded-full transition-all', i <= step ? 'bg-primary w-5' : 'bg-muted w-3')} />
                ))}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="grid grid-cols-2 gap-3">
                  {PLAN_TYPES.map(pt => (
                    <button key={pt.type} onClick={() => { setSelectedType(pt.type); setStep(1); }}
                      className={cn('flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all hover:border-primary/40 hover:bg-primary/5',
                        selectedType === pt.type ? 'border-primary bg-primary/10' : 'border-border/50 bg-card')}>
                      <span className="text-3xl">{pt.emoji}</span>
                      <span className="text-xs font-semibold leading-tight">{pt.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 mb-4">
                  <span className="text-3xl">{typeInfo?.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm">{typeInfo?.label}</p>
                    <p className="text-xs text-muted-foreground">Fill in basic details</p>
                  </div>
                </div>
                {COMMON_FIELDS.map(f => (
                  <FieldInput key={f.id} field={f} value={formData[f.id] || ''} onChange={v => setField(f.id, v)} />
                ))}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                <p className="text-xs text-muted-foreground pb-1">Answer questions specific to your {typeInfo?.label.toLowerCase()}. All optional.</p>
                {specificQuestions.map(f => (
                  <FieldInput key={f.id} field={f} value={specificData[f.id] || ''} onChange={v => setSpecific(f.id, v)} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step > 0 && (
          <div className="px-5 py-4 border-t border-border/40 flex-shrink-0">
            {step === 1 ? (
              <button
                disabled={!formData.title?.trim()}
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                Next: Specific Details <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-3">
                <button onClick={handleCreate} disabled={isCreating}
                  className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-70">
                  {isCreating ? <LoadingSpinner inline className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {isCreating ? 'Creating...' : 'Create Plan'}
                </button>
                <button onClick={() => { handleCreate(); }}
                  disabled={isCreating}
                  className="px-4 h-12 rounded-2xl border border-border/50 text-sm font-medium hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50">
                  Skip
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function FieldInput({ field, value, onChange }) {
  const base = "w-full bg-muted/50 border border-border/40 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors";

  return (
    <div>
      <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
        {field.label}
        {field.required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {field.type === 'textarea' ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder}
          rows={3} className={cn(base, 'resize-none')} />
      ) : field.type === 'select' ? (
        <select value={value} onChange={e => onChange(e.target.value)} className={base}>
          <option value="">Select...</option>
          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : field.type === 'daterange' ? (
        <div className="grid grid-cols-2 gap-2">
          <input type="date" placeholder="Start" value={value?.split(',')[0] || ''}
            onChange={e => onChange(`${e.target.value},${value?.split(',')[1] || ''}`)} className={base} />
          <input type="date" placeholder="End" value={value?.split(',')[1] || ''}
            onChange={e => onChange(`${value?.split(',')[0] || ''},${e.target.value}`)} className={base} />
        </div>
      ) : (
        <input type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
          value={value} onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder} className={base} />
      )}
    </div>
  );
}