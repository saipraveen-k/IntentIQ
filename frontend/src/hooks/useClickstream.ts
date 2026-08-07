"use client";

import { useRef } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';

export function useClickstream() {
  const sessionId = useStore((state) => state.sessionId);
  const hoverStartTime = useRef<Record<string, number>>({});

  const trackClick = async (productId: string) => {
    try {
      await api.sendTelemetry(sessionId, 'CLICK', productId, 0);
    } catch (e) {
      console.warn('Clickstream dispatch error', e);
    }
  };

  const trackHoverStart = (productId: string) => {
    hoverStartTime.current[productId] = Date.now();
  };

  const trackHoverEnd = async (productId: string) => {
    const start = hoverStartTime.current[productId];
    if (start) {
      const dwellMs = Date.now() - start;
      delete hoverStartTime.current[productId];

      // Dispatch telemetry if dwell time >= 1500ms
      if (dwellMs >= 1500) {
        try {
          await api.sendTelemetry(sessionId, 'HOVER', productId, dwellMs);
        } catch (e) {
          console.warn('Clickstream hover dispatch error', e);
        }
      }
    }
  };

  return { trackClick, trackHoverStart, trackHoverEnd };
}
