'use client';
import { useAuth } from './useAuth';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useEventLogger() {
  const { token } = useAuth();

  const logEvent = async ({ productId, eventType, queryText, resultsShown, sessionId }) => {
    if (!token) {
      console.warn("Event logging skipped: user not authenticated.");
      return;
    }

    try {
      // Clean base URL to prevent duplicated /api/v1
      const cleanBaseUrl = API_URL.endsWith('/api/v1') 
        ? API_URL.substring(0, API_URL.length - 7) 
        : API_URL;

      await axios.post(
        `${cleanBaseUrl}/api/v1/event`,
        {
          product_id: productId ? String(productId) : null,
          event_type: eventType,
          session_id: sessionId || 'default_session',
          query_text: queryText || null,
          results_shown: resultsShown || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      console.error("Failed to log event:", err);
    }
  };

  return { logEvent };
}
