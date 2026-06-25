import { useQuery, useMutation } from '@tanstack/react-query';
import { safeFetch } from '@/lib/safeFetch';
import { useState, useEffect } from 'react';

/**
 * Global offline detection hook
 */
export function useIsOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const onOffline = () => setIsOffline(true);
    const onOnline = () => setIsOffline(false);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);
  return isOffline;
}

/**
 * Maps standard network errors to user-friendly messages
 */
export function mapApiError(error) {
  const msg = error.message || '';
  if (msg.includes('HTTP_401') || msg.includes('HTTP_403')) return 'Access denied. Please check your permissions or API key.';
  if (msg.includes('HTTP_404')) return 'Requested data was not found.';
  if (msg.includes('HTTP_429')) return 'Too many requests. Please slow down and try again later.';
  if (msg.includes('HTTP_50') || msg.includes('HTTP_502') || msg.includes('HTTP_503') || msg.includes('HTTP_504')) return 'The server is temporarily unavailable. Please try again.';
  if (msg.includes('Timeout') || msg.includes('Request timed out') || msg.includes('timed out')) return 'The connection timed out. Please check your internet and try again.';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) return 'Network error. Please check your internet connection.';
  return msg || 'An unexpected error occurred.';
}

/**
 * A robust wrapper around useQuery for standardizing GET requests across the app.
 * Features:
 * - Exponential backoff retries (default: 2)
 * - Automatic abort signal passing
 * - Standardized error mapping
 * - Offline detection
 */
export function useApiQuery({
  queryKey,
  url,
  options = {}, // fetch options (headers, etc.)
  timeoutMs = 12000,
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 mins default
  cacheTime = 30 * 60 * 1000,
  retry = 2,
  queryFn, // Optional custom fetcher. If missing, uses safeFetch.
}) {
  const isOffline = useIsOffline();

  const defaultQueryFn = async ({ signal }) => {
    try {
      return await safeFetch(url, { ...options, signal }, timeoutMs);
    } catch (err) {
      if (err.name !== 'AbortError') {
        const customErr = new Error(mapApiError(err));
        customErr.original = err;
        throw customErr;
      }
      throw err; // React Query handles AbortError correctly
    }
  };

  const query = useQuery({
    queryKey,
    queryFn: queryFn || defaultQueryFn,
    enabled: enabled && !isOffline,
    staleTime,
    gcTime: cacheTime,
    retry: (failureCount, error) => {
      // Don't retry 401/403/404s
      const msg = error?.original?.message || error?.message || '';
      if (msg.includes('HTTP_401') || msg.includes('HTTP_403') || msg.includes('HTTP_404')) return false;
      return failureCount < retry;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });

  return {
    ...query,
    isOffline,
    isEmpty: query.isSuccess && (!query.data || (Array.isArray(query.data) && query.data.length === 0) || (typeof query.data === 'object' && Object.keys(query.data).length === 0)),
  };
}

/**
 * A robust wrapper around useMutation for standardizing POST/PUT/DELETE requests.
 */
export function useApiMutation({
  mutationFn,
  retry = 1,
  onSuccess,
  onError,
}) {
  const isOffline = useIsOffline();

  const wrappedMutationFn = async (variables) => {
    if (isOffline) throw new Error('You are currently offline. Please reconnect and try again.');
    try {
      return await mutationFn(variables);
    } catch (err) {
      if (err.name !== 'AbortError') {
        const customErr = new Error(mapApiError(err));
        customErr.original = err;
        throw customErr;
      }
      throw err;
    }
  };

  const mutation = useMutation({
    mutationFn: wrappedMutationFn,
    retry: (failureCount, error) => {
      const msg = error?.original?.message || error?.message || '';
      if (msg.includes('HTTP_401') || msg.includes('HTTP_403') || msg.includes('HTTP_404') || msg.includes('offline')) return false;
      return failureCount < retry;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    onSuccess,
    onError,
  });

  return {
    ...mutation,
    isOffline,
  };
}
