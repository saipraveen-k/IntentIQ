'use client';

import React, { useState } from 'react';
import { Sparkles, Check, Heart, GraduationCap, Crown, Users, Dumbbell, Wallet, Utensils } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { api } from '../../lib/api';

export const PERSONAS = [
  { id: 'healthy', name: 'Healthy Lifestyle', icon: Heart, desc: 'Organic produce, cold pressed detox juice & clean eats', color: 'emerald' },
  { id: 'student', name: 'College Student', icon: GraduationCap, desc: 'Quick microwave meals, energy drinks & budget snacks', color: 'blue' },
  { id: 'luxury', name: 'Luxury Gourmet', icon: Crown, desc: 'Imported artisanal cheeses, truffle oil & fine foods', color: 'amber' },
  { id: 'family', name: 'Family Shopping', icon: Users, desc: 'Bulk pantry staples, organic dairy & breakfast goods', color: 'indigo' },
  { id: 'fitness', name: 'Fitness Enthusiast', icon: Dumbbell, desc: 'High protein whey, egg whites & clean recovery snacks', color: 'purple' },
  { id: 'budget', name: 'Budget Essential', icon: Wallet, desc: 'Maximum discount value, store brands & pantry deals', color: 'cyan' },
  { id: 'weekend', name: 'Weekend Cooking', icon: Utensils, desc: 'Baking ingredients, gourmet marinades & spices', color: 'rose' },
];

export function PersonaSelector({ onPersonaChange }: { onPersonaChange?: () => void }) {
  const { sessionId, activePersona, setActivePersona, setActiveIntent } = useStore();
  const [loadingPersona, setLoadingPersona] = useState<string | null>(null);

  const handleSelectPersona = async (personaId: string) => {
    setLoadingPersona(personaId);
    try {
      const res = await api.switchPersona(sessionId, personaId);
      setActivePersona(personaId);
      if (res.active_intent_label) {
        setActiveIntent(res.active_intent_label, res.intent_confidence || 0.95);
      }
      if (onPersonaChange) {
        onPersonaChange();
      }
    } catch (e) {
      console.warn('Persona switch notice:', e);
    } finally {
      setLoadingPersona(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Interactive Persona Demonstrator
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">Select persona to test instant AI adaptation</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {PERSONAS.map((p) => {
          const Icon = p.icon;
          const isSelected = (activePersona || 'healthy') === p.id;
          const isLoading = loadingPersona === p.id;

          return (
            <button
              key={p.id}
              onClick={() => handleSelectPersona(p.id)}
              disabled={isLoading}
              className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-24 ${
                isSelected
                  ? 'bg-slate-800/90 border-blue-500/50 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs font-bold text-white block truncate">{p.name}</span>
                <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{p.desc}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
