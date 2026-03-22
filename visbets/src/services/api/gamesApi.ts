import { backendClient } from './backendClient';

export interface GameSummary {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  startTime: string;
}

export interface BoxScore {
  gameId: number;
  homeTeam: string;
  awayTeam: string;
  players: {
    id: number;
    name: string;
    team: string;
    points: number;
    rebounds: number;
    assists: number;
    minutes: string;
  }[];
}

export const gamesApi = {
  getTodaysGames: async (): Promise<GameSummary[]> => {
    const { data } = await backendClient.get('/api/games/today');
    return data;
  },

  getBoxScore: async (gameId: number): Promise<BoxScore> => {
    const { data } = await backendClient.get(`/api/games/${gameId}/boxscore`);
    return data;
  },

  getGameProps: async (gameId: number): Promise<any> => {
    const { data } = await backendClient.get(`/api/games/${gameId}/props`);
    return data;
  },
};
