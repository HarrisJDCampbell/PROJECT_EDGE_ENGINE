import { SPORTSBOOKS } from '../utils/constants';

export function getSportsbookName(id: string): string {
  const book = SPORTSBOOKS.find((b) => b.id === id);
  return book?.name ?? id.toUpperCase();
}

export function getSportsbookShortLabel(id: string): string {
  const labels: Record<string, string> = {
    prizepicks: 'PP', draftkings: 'DK', underdog: 'UD',
    fanduel: 'FD', betmgm: 'MGM', caesars: 'CZR',
    pointsbet: 'PB', betrivers: 'BR', espnbet: 'ESPN', hardrock: 'HR',
  };
  return labels[id] ?? id.substring(0, 2).toUpperCase();
}
