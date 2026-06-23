// NexORA — useFetch Hook
// Generic data-fetching hook with loading, error, and data state.

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * @param {Function} fetchFn - Async function that returns an Axios response
 * @param {Array} deps - Dependency array (like useEffect)
 * @param {object} options
 * @param {boolean} options.immediate - If false, fetch is not called on mount
 * @returns {{ data, isLoading, error, refetch }}
 */
const useFetch = (fetchFn, deps = [], { immediate = true } = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const execute = useCallback(async (...args) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchFn(...args);
      setData(response.data?.data ?? response.data);
      return response.data?.data ?? response.data;
    } catch (err) {
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        const message = err.response?.data?.message || err.message || 'Request failed';
        setError(message);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) {
      execute();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps]);

  return { data, isLoading, error, refetch: execute };
};

export default useFetch;
