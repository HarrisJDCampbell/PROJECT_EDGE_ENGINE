import { backendClient } from './backendClient';

export interface OddsEvent {
  id: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  bookmakers: {
    key: string;
    title: string;
    markets: {
      key: string;
      outcomes: { name: string; price: number; point?: number }[];
    }[];
  }[];
}

export const oddsApi = {
  getNBAOdds: async (): Promise<OddsEvent[]> => {
    const { data } = await backendClient.get('/api/odds/nba');
    return data;
  },

  getQuota: async (): Promise<{ remaining: number; used: number }> => {
    const { data } = await backendClient.get('/api/odds/quota');
    return data;
  },
};
