import { useEffect } from 'react';
import axios from 'axios';

// Get or create anonymous session ID
export const getSessionId = () => {
  let sessionId = localStorage.getItem('nexora_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('nexora_session_id', sessionId);
  }
  return sessionId;
};

// Global axios interceptor for session
axios.interceptors.request.use(config => {
  config.headers['x-session-id'] = getSessionId();
  return config;
});

export const trackEvent = async (event, data) => {
  try {
    await axios.post('/api/preferences/track', {
      sessionId: getSessionId(),
      event,
      data
    });
  } catch (error) {
    console.warn('Failed to track preference event', error);
  }
};

const usePreferenceTracking = (event, data, trigger = true) => {
  useEffect(() => {
    if (trigger) {
      trackEvent(event, data);
    }
  }, [trigger, JSON.stringify(data)]);
};

export default usePreferenceTracking;
