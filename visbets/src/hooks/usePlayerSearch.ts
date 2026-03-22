import { useState, useEffect, useRef } from 'react';
import { backendClient } from '../services/api/backendClient';

export interface PlayerSearchResult {
  id: number;
  name: string;
  team?: string;
  headshotUrl?: string | null;
}

export function usePlayerSearch(query: string, debounceMs = 250) {
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timer = setTimeout(async () => {
      // Abort previous in-flight request to prevent stale results
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const { data } = await backendClient.get('/api/players/search', {
          params: { name: query.trim() },
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setResults(data.results ?? []);
        }
      } catch (err: any) {
        if (err?.name !== 'CanceledError' && err?.name !== 'AbortError') {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controllerRef.current?.abort();
    };
  }, [query, debounceMs]);

  return { results, isSearching };
}
