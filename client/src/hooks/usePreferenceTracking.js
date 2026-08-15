import { useEffect } from 'react';
import api from '@services/api';

// Get or create anonymous session ID
export const getSessionId = () => {
  let sessionId = localStorage.getItem('nexora_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('nexora_session_id', sessionId);
  }
  return sessionId;
};

export const trackEvent = async (event, data) => {
  try {
    await api.post('/preferences/track', {
      sessionId: getSessionId(),
      event,
      data
    }, { headers: { 'x-session-id': getSessionId() } });
  } catch (error) {
    console.warn('Failed to track preference event', error);
  }
};

const usePreferenceTracking = (event, data, trigger = true) => {
  const serializedData = JSON.stringify(data);
  useEffect(() => {
    if (trigger) {
      trackEvent(event, JSON.parse(serializedData || 'null'));
    }
  }, [event, serializedData, trigger]);
};

export default usePreferenceTracking;
