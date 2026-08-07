"use client";

import { useRef } from 'react';
import { useAppStore } from '@/store/useStore';
import { api } from '@/lib/api';

export function useClickstream() {
  const sessionId = useAppStore((state) => state.sessionId);
  const consentGiven = useAppStore((state) => state.consentGiven);
  const hoverStartTime = useRef<Record<string, number>>({});

  const trackClick = async (productId: string) => {
    if (!consentGiven) return;
    try {
      await api.recordEvent(sessionId, 'CLICK', productId, 0);
    } catch (e) {
      console.warn('Clickstream dispatch error', e);
    }
  };

  const trackHoverStart = (productId: string) => {
    if (!consentGiven) return;
    hoverStartTime.current[productId] = Date.now();
  };

  const trackHoverEnd = async (productId: string) => {
    if (!consentGiven) return;
    const start = hoverStartTime.current[productId];
    if (start) {
      const dwellMs = Date.now() - start;
      delete hoverStartTime.current[productId];

      // Only dispatch if dwell time > 1.5 seconds (significant interest)
      if (dwellMs >= 1500) {
        try {
          await api.recordEvent(sessionId, 'HOVER', productId, dwellMs);
        } catch (e) {
          console.warn('Clickstream hover dispatch error', e);
        }
      }
    }
  };

  return { trackClick, trackHoverStart, trackHoverEnd };
}
