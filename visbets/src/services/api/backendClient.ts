/**
 * Backend API Client
 * Axios instance with Supabase JWT auth + 401/403 handling.
 */

import axios, { AxiosError } from 'axios';
import { API_CONFIG } from '../../utils/constants';
import { supabase } from '../../lib/supabase';

export const backendClient = axios.create({
  baseURL: API_CONFIG.BACKEND_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Token cache to avoid calling getSession() on every request ──────────────
let _cachedToken: string | null = null;
let _tokenExpiresAt = 0; // epoch ms
let _tokenRefreshPromise: Promise<string | null> | null = null;

async function getAccessToken(): Promise<string | null> {
  // Return cached token if still valid (with 60s buffer)
  if (_cachedToken && Date.now() < _tokenExpiresAt - 60_000) {
    return _cachedToken;
  }

  // Deduplicate concurrent refresh calls — if a refresh is already in flight,
  // all callers share the same promise instead of racing.
  if (_tokenRefreshPromise) {
    return _tokenRefreshPromise;
  }

  _tokenRefreshPromise = (async () => {
    try {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Session missing (e.g. SecureStore unavailable during cold start) — attempt refresh
        const { data } = await supabase.auth.refreshSession();
        session = data.session;
      }

      if (session?.access_token) {
        _cachedToken = session.access_token;
        _tokenExpiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + 3600_000;
        return _cachedToken;
      }

      _cachedToken = null;
      _tokenExpiresAt = 0;
      return null;
    } finally {
      _tokenRefreshPromise = null;
    }
  })();

  return _tokenRefreshPromise;
}

/** Clear the cached token (call on sign-out or 401) */
export function clearTokenCache(): void {
  _cachedToken = null;
  _tokenExpiresAt = 0;
}

// Attach current Supabase session token to every request
backendClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 (expired/invalid token) and 403 (upgrade_required)
backendClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error: string; required_tier?: string }>) => {
    if (error.response?.status === 401) {
      // Token was rejected — clear cache and retry once with a fresh token
      clearTokenCache();
      const originalRequest = error.config;
      if (originalRequest && !(originalRequest as any)._retry) {
        (originalRequest as any)._retry = true;
        const token = await getAccessToken();
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return backendClient(originalRequest);
        }
      }
      // If retry also failed, the auth listener will handle sign-out
    }

    if (error.response?.status === 403) {
      const body = error.response.data;
      if (body?.error === 'upgrade_required') {
        const upgradeError = new Error('upgrade_required') as any;
        upgradeError.requiredTier = body.required_tier;
        return Promise.reject(upgradeError);
      }
    }

    return Promise.reject(error);
  }
);
