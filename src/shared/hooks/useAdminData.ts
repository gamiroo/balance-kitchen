// hooks/useAdminData.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { captureErrorSafe } from '@/shared/lib/utils/error-utils';
import { logger } from '@/shared/lib/logging/logger';

interface UseAdminDataOptions {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  refreshInterval?: number;
}

export function useAdminData<T>(endpoint: string, options: UseAdminDataOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setIsValidating(true);
      setError(null);
      
      logger.debug('Fetching admin data', { endpoint, isRefresh });
      
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Include cookies for authentication
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        logger.debug('Admin data fetched successfully', { 
          endpoint, 
          dataLength: Array.isArray(result.data) ? result.data.length : 'single' 
        });
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (err: unknown) {
      captureErrorSafe(err, {
        action: 'fetch_admin_data',
        endpoint,
        hook: 'useAdminData'
      });
      
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      logger.error('Failed to fetch admin data', {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
        endpoint
      });
    } finally {
      setLoading(false);
      setIsValidating(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Revalidate on focus
  useEffect(() => {
    if (!options.revalidateOnFocus) return;
    
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchData(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchData, options.revalidateOnFocus]);

  // Revalidate on reconnect
  useEffect(() => {
    if (!options.revalidateOnReconnect) return;
    
    const handleOnline = () => {
      fetchData(true);
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchData, options.revalidateOnReconnect]);

  // Refresh interval
  useEffect(() => {
    if (!options.refreshInterval) return;
    
    const interval = setInterval(() => {
      fetchData(true);
    }, options.refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchData, options.refreshInterval]);

  return { 
    data, 
    loading, 
    error, 
    isValidating,
    refetch: () => fetchData() 
  };
}
