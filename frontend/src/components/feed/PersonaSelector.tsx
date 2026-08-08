'use client';

import React, { useState } from 'react';
import { Sparkles, Check, Heart, GraduationCap, Crown, Users, Dumbbell, Wallet, Utensils } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { api } from '../../lib/api';

export const PERSONAS = [
  { id: 'healthy', name: 'Healthy', icon: Heart, desc: 'Organic produce & clean eats' },
  { id: 'student', name: 'Student', icon: GraduationCap, desc: 'Budget-friendly meals' },
  { id: 'luxury', name: 'Gourmet', icon: Crown, desc: 'Premium artisanal foods' },
  { id: 'family', name: 'Family', icon: Users, desc: 'Bulk staples & dairy' },
  { id: 'fitness', name: 'Fitness', icon: Dumbbell, desc: 'High protein & recovery' },
  { id: 'budget', name: 'Budget', icon: Wallet, desc: 'Best value & deals' },
  { id: 'weekend', name: 'Cooking', icon: Utensils, desc: 'Baking & gourmet spices' },
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
          <Sparkles className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">
            Choose your shopping style
          </h3>
        </div>
        <span className="text-xs text-gray-500">Personalize your recommendations</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {PERSONAS.map((p) => {
          const Icon = p.icon;
          const isSelected = (activePersona || 'healthy') === p.id;
          const isLoading = loadingPersona === p.id;

          return (
            <button
              key={p.id}
              onClick={() => handleSelectPersona(p.id)}
              disabled={isLoading}
              className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-28 ${
                isSelected
                  ? 'bg-black text-white border-black shadow-md'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`p-2 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <Icon className="w-4 h-4" />
                </span>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-xs">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>

              <div>
                <span className="text-sm font-semibold block truncate">{p.name}</span>
                <span className="text-xs line-clamp-1 mt-0.5 opacity-70">{p.desc}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
