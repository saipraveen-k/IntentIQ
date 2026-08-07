'use client';

import React, { useState } from 'react';
import { Sparkles, Check, Heart, GraduationCap, Crown, Users, Dumbbell, Wallet, Utensils } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { api } from '../../lib/api';

export const PERSONAS = [
  { id: 'healthy', name: 'Healthy Lifestyle', icon: Heart, badgeClass: 'bg-[#DFF7E2] text-[#065F46] border-[#BBF7D0]' },
  { id: 'student', name: 'College Student', icon: GraduationCap, badgeClass: 'bg-[#D7ECFF] text-[#1E40AF] border-[#BFDBFE]' },
  { id: 'luxury', name: 'Luxury Gourmet', icon: Crown, badgeClass: 'bg-[#DCCEF9] text-[#4C1D95] border-[#DDD6FE]' },
  { id: 'family', name: 'Family Shopping', icon: Users, badgeClass: 'bg-[#FFE7D6] text-[#9A3412] border-[#FFEDD5]' },
  { id: 'fitness', name: 'Fitness High-Protein', icon: Dumbbell, badgeClass: 'bg-[#F8D8E8] text-[#831843] border-[#FBCFE8]' },
  { id: 'budget', name: 'Budget Deals', icon: Wallet, badgeClass: 'bg-[#FFF3C4] text-[#854D0E] border-[#FEF08A]' },
  { id: 'weekend', name: 'Weekend Cooking', icon: Utensils, badgeClass: 'bg-[#FFE4E6] text-[#9F1239] border-[#FECDD3]' },
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Shopping Persona Switcher
          </h3>
        </div>
        <span className="text-xs text-gray-400">Instant AI intent adaptation</span>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {PERSONAS.map((p) => {
          const Icon = p.icon;
          const isSelected = (activePersona || 'healthy') === p.id;
          const isLoading = loadingPersona === p.id;

          return (
            <button
              key={p.id}
              onClick={() => handleSelectPersona(p.id)}
              disabled={isLoading}
              className={`px-4 py-2.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-2 shrink-0 ${
                isSelected
                  ? `${p.badgeClass} shadow-sm ring-2 ring-gray-900/10 scale-[1.02]`
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{p.name}</span>
              {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

