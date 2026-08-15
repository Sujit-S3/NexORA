import { useCallback, useEffect, useState } from 'react';
import api, { apiConfigurationError } from '@services/api';

export default function ApiStatusBanner() {
  const [error, setError] = useState(apiConfigurationError);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      await api.get('/health');
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Store services are temporarily unavailable.');
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  if (!error) return null;

  return (
    <div role="alert" className="fixed inset-x-0 top-20 z-[90] border-y border-red-500/30 bg-[#2b0b0b]/95 px-4 py-3 text-center text-sm text-red-100 backdrop-blur-md">
      <span>Store services are unavailable. Cart, wishlist, catalog, and checkout changes are paused. {error}</span>
      <button type="button" onClick={check} disabled={checking} className="ml-3 font-bold text-white underline disabled:opacity-50">
        {checking ? 'Checking...' : 'Retry'}
      </button>
    </div>
  );
}
