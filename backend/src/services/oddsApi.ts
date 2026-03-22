/**
 * TheOddsAPI Service
 * Wraps https://the-odds-api.com with caching.
 */

import axios, { AxiosError, AxiosResponse } from 'axios';
import { getOrFetch, oddsTTL, TTL } from '../cache/gameCache';
import { updateFromHeaders, isLow as isQuotaLow, getStatus as getQuotaStatus } from '../cache/oddsQuota';

const client = axios.create({
  baseURL: 'https://api.the-odds-api.com/v4',
  timeout: 15000,
});

// Store remaining quota from last response
let _quotaRemaining = -1;
let _quotaUsed = -1;

client.interceptors.response.use((res: AxiosResponse) => {
  const remaining = res.headers['x-requests-remaining'];
  const used = res.headers['x-requests-used'];
  if (remaining !== undefined) _quotaRemaining = Number(remaining);
  if (used !== undefined) _quotaUsed = Number(used);
  // Update quota tracker module
  updateFromHeaders(res.headers as Record<string, string | string[] | undefined>);
  return res;
});

// Retry once on transient failures (network errors, 5xx, timeout)
client.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config;
  if (!config || (config as any).__retried) return Promise.reject(error);
  const status = error.response?.status;
  const isRetryable = !status || status >= 500 || error.code === 'ECONNABORTED';
  if (!isRetryable) return Promise.reject(error);
  (config as any).__retried = true;
  await new Promise((r) => setTimeout(r, 1000));
  return client.request(config);
});

// ── Type definitions ──────────────────────────────────────────────────────────

export interface OddsOutcome {
  name: string;
  price: number;
  point?: number;
}

export interface OddsMarket {
  key: string;
  last_update: string;
  outcomes: OddsOutcome[];
}

export interface OddsBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsMarket[];
}

export interface NBAOddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsBookmaker[];
}

export interface PlayerPropOutcome {
  name: string;
  description: string;
  price: number;
  point?: number;
}

export interface PlayerPropMarket {
  key: string;
  last_update: string;
  outcomes: PlayerPropOutcome[];
}

export interface PlayerPropsEvent {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: PlayerPropMarket[];
  }>;
}

// ── API functions ─────────────────────────────────────────────────────────────

const BOOKMAKERS = 'fanduel,draftkings,betmgm,caesars,espnbet';
const PROP_MARKETS = [
  'player_points',
  'player_rebounds',
  'player_assists',
  'player_threes',
  'player_steals',
  'player_blocks',
].join(',');

export async function getNBAOdds(): Promise<NBAOddsEvent[]> {
  return getOrFetch(
    'odds-api:nba-odds',
    oddsTTL(),
    async () => {
      const res = await client.get('/sports/basketball_nba/odds', {
        params: {
          apiKey: process.env.ODDS_API_KEY,
          regions: 'us',
          markets: 'h2h,spreads,totals',
          bookmakers: BOOKMAKERS,
          oddsFormat: 'american',
        },
      });
      return (res.data ?? []) as NBAOddsEvent[];
    }
  );
}

export async function getNBAPlayerProps(eventId: string): Promise<PlayerPropsEvent | null> {
  return getOrFetch(
    `odds-api:player-props:${eventId}`,
    oddsTTL(),
    async () => {
      try {
        const res = await client.get(`/sports/basketball_nba/events/${eventId}/odds`, {
          params: {
            apiKey: process.env.ODDS_API_KEY,
            regions: 'us',
            markets: PROP_MARKETS,
            bookmakers: BOOKMAKERS,
            oddsFormat: 'american',
          },
        });
        return res.data as PlayerPropsEvent;
      } catch (err: any) {
        if (err?.response?.status === 404) return null;
        throw err;
      }
    }
  );
}

export function getOddsUsageStats(): { remaining: number; used: number; isLow: boolean } {
  return { remaining: _quotaRemaining, used: _quotaUsed, isLow: isQuotaLow() };
}

export { isQuotaLow, getQuotaStatus };
