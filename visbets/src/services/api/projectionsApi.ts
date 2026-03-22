/**
 * Projections API
 * Fetches real projected props from the backend.
 */

import { backendClient } from './backendClient';

export type StatKey = 'points' | 'totReb' | 'assists' | 'tpm' | 'steals' | 'blocks';
export type StatDisplay = 'PTS' | 'REB' | 'AST' | '3PM' | 'STL' | 'BLK';

export interface ProjectedProp {
  id: string;
  playerName: string;
  playerApiSportsId: number | null;
  teamName: string;
  opponent: string;
  isHome: boolean;
  gameTime: string;
  stat: StatKey;
  statDisplay: StatDisplay;
  line: number;
  projection: number;
  stdDev: number;
  pOver: number;             // 0–1 probability of going over
  impliedPOver: number;      // market's implied probability
  edge: number;              // pOver - impliedPOver
  direction: 'over' | 'under';
  visbetsScore: number;      // 0–100
  confidence: 'low' | 'medium' | 'high';
  sampleSize: number;
  overOdds: number | null;
  underOdds: number | null;
  bookmaker: string | null;
  modelVersion: string;
  headshotUrl: string | null;
  bookLines?: Record<string, number | null>;
}

export interface TodaysProjectionsResponse {
  projections: ProjectedProp[];
  count: number;
  modelVersion: string;
  generatedAt: string;
}

export const projectionsApi = {
  async getTodaysProjections(preferredBookmaker?: string): Promise<TodaysProjectionsResponse> {
    const { data } = await backendClient.get<TodaysProjectionsResponse>(
      '/api/projections/today',
      preferredBookmaker ? { params: { bookmaker: preferredBookmaker } } : undefined
    );
    return data;
  },
};
