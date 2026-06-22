import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLAN_TYPES, PLAN_QUESTIONS, getCoverImage } from './planUtils';
import { fetchTripData } from '@/api/tripApi';
import db from '@/api/base44Client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const COMMON_FIELDS = [
  { id: 'title', label: 'Plan Title', type: 'text', placeholder: 'Give your plan a name', required: true },
  { id: 'description', label: 'Description', type: 'textarea', placeholder: 'What is this plan about?' },
  { id: 'budget', label: 'Total Budget ($)', type: 'number', placeholder: '0' },
];

export default function CreatePlanWizard({ onClose, onCreate, isCreating }) {
  const [step, setStep] = useState(0); 
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({ status: 'draft', priority: 'medium' });
  const [specificData, setSpecificData] = useState({});
  const [aiLoading, setAiLoading] = useState(false);

  const typeInfo = PLAN_TYPES.find(t => t.type === selectedType);
  const questionSteps = PLAN_QUESTIONS[selectedType] || PLAN_QUESTIONS.custom || [];
  
  // Step mapping:
  // 0 = Select Type
  // 1 = Basic Details
  // 2 to (1 + questionSteps.length) = Question steps
  const totalSteps = 1 + questionSteps.length;

  const setField = (key, value) => setFormData(p => ({ ...p, [key]: value }));
  const setSpecific = (key, value) => setSpecificData(p => ({ ...p, [key]: value }));

  const generateAIPlan = async () => {
    setAiLoading(true);
    try {
      let extraContext = '';
      if (selectedType === 'trip') {
        const tripData = await fetchTripData(specificData.destination, specificData.starting_location);
        extraContext = tripData ? `\n[System Real-time Data]: \nHotels API Data: ${JSON.stringify(tripData.hotels || {})}\nFlights API Data: ${JSON.stringify(tripData.flights || {})}` : '';
      }

      const prompt = `Act as an expert planner. Generate a comprehensive Master Plan for a ${typeInfo?.label} titled "${formData.title}".
      
      User Details:
      ${JSON.stringify(specificData, null, 2)}
      
      Budget: $${formData.budget}
      ${extraContext}
      
      Please structure the plan using Markdown with the following sections if applicable:
      - Overview
      - Objectives
      - Timeline / Daily Breakdown
      - Budget Breakdown
      - Risk Notes & Recommendations
      
      For trips, include itinerary, places to visit, hotel recommendations, transport recommendations, and packing list.
      Respond ONLY with the markdown content.`;

      const aiResponse = await db.integrations.Core.InvokeLLM({ prompt, model: 'gemini_flash' });
      return aiResponse;
    } catch (e) {
      console.error(e);
      return `*AI generation failed. Please fill out your plan manually or check your AI configuration.*\n\n${e.message}`;
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreate = async () => {
    const coverImage = getCoverImage(selectedType);
    const budget = parseFloat(formData.budget) || 0;
    
    // Generate AI Plan
    const aiPlan = await generateAIPlan();

    const notes = Object.entries(specificData)
      .filter(([, v]) => v)
      .map(([k, v]) => `**${k.replace(/_/g, ' ')}:** ${v}`)
      .join('\n');

    onCreate({
      ...formData,
      plan_type: selectedType,
      cover_image: coverImage,
      budget,
      progress: 0,
      notes: `${notes}\n\n---\n\n## AI Master Plan\n\n${aiPlan}`,
      milestones: [],
      checklist: [],
      tags: [],
    });
  };

  const currentFields = step === 1 ? COMMON_FIELDS : (questionSteps[step - 2]?.fields || []);
  const stepTitle = step === 0 ? 'Choose Plan Type' : step === 1 ? 'Basic Details' : questionSteps[step - 2]?.title;

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
        className="w-full sm:max-w-xl bg-background rounded-t-[32px] sm:rounded-[28px] overflow-hidden max-h-[90vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/40 flex-shrink-0 bg-muted/20">
          <div className="flex items-center gap-3">
            {step > 0 && !aiLoading && !isCreating && (
              <button onClick={() => setStep(s => s - 1)} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="font-bold text-lg leading-tight">{stepTitle}</h2>
              {step > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div key={i} className={cn('h-1 rounded-full transition-all', i <= step - 1 ? 'bg-primary w-6' : 'bg-muted w-3')} />
                  ))}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} disabled={aiLoading || isCreating} className="p-2 rounded-xl hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PLAN_TYPES.map(pt => (
                    <button key={pt.type} onClick={() => { setSelectedType(pt.type); setStep(1); }}
                      className={cn('flex flex-col items-center justify-center gap-2 p-5 rounded-3xl border text-center transition-all hover:scale-[1.02] active:scale-[0.98]',
                        selectedType === pt.type ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' : 'border-border/50 bg-card hover:bg-muted')}>
                      <span className="text-4xl mb-1">{pt.emoji}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider">{pt.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step > 0 && (
              <motion.div key={`step${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {step === 1 && (
                  <div className="flex items-center gap-4 p-4 rounded-3xl bg-muted/50 mb-6 border border-border/50">
                    <div className="w-12 h-12 rounded-2xl bg-card flex items-center justify-center shadow-sm text-2xl">{typeInfo?.emoji}</div>
                    <div>
                      <p className="font-bold">{typeInfo?.label}</p>
                      <p className="text-xs text-muted-foreground">Let's start with the basics.</p>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                   {currentFields.map(f => (
                     <FieldInput key={f.id} field={f} value={step === 1 ? formData[f.id] : specificData[f.id]} onChange={v => step === 1 ? setField(f.id, v) : setSpecific(f.id, v)} />
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step > 0 && (
          <div className="px-6 py-5 border-t border-border/40 flex-shrink-0 bg-card">
            {step < totalSteps ? (
              <button
                disabled={step === 1 && !formData.title?.trim()}
                onClick={() => setStep(s => s + 1)}
                className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
              >
                Next Step <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={handleCreate} disabled={aiLoading || isCreating}
                className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-foreground text-background font-bold text-sm hover:bg-foreground/90 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                {aiLoading || isCreating ? (
                  <><LoadingSpinner inline className="w-5 h-5 animate-spin" /> Generating AI Master Plan...</>
                ) : (
                  <><Sparkles className="w-5 h-5 text-yellow-400" /> Generate AI Plan</>
                )}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function FieldInput({ field, value, onChange }) {
  const base = "w-full bg-card border-2 border-border/50 hover:border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all";

  return (
    <div>
      <label className="block text-xs font-bold text-foreground/80 mb-2 uppercase tracking-wider ml-1">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </label>
      {field.type === 'textarea' ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder}
          rows={3} className={cn(base, 'resize-none')} />
      ) : field.type === 'select' ? (
        <select value={value || ''} onChange={e => onChange(e.target.value)} className={base}>
          <option value="">Select...</option>
          {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : field.type === 'multiselect' ? (
        <div className="flex flex-wrap gap-2">
           {field.options?.map(o => {
             const selected = Array.isArray(value) && value.includes(o);
             return (
               <button key={o} onClick={() => {
                 const current = Array.isArray(value) ? value : [];
                 onChange(selected ? current.filter(v => v !== o) : [...current, o]);
               }} className={cn("px-4 py-2 rounded-xl border-2 transition-all text-xs font-bold", selected ? "bg-primary/10 border-primary text-primary" : "border-border/50 hover:border-border bg-card")}>
                 {o}
               </button>
             );
           })}
        </div>
      ) : (
        <input type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
          value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder} className={base} />
      )}
    </div>
  );
}
