/**
 * Player Detail Screen
 *
 * Modern, interactive player analytics with consolidated sections,
 * gesture-based interactions, and smooth animations.
 *
 * Route: /player/[id]?market=PTS&gameId=123
 */

import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PlayerDetailScreenV2 } from '../../src/components/player-v2';
import type { StatType } from '../../src/components/player-v2';

const AVAILABLE_STATS: StatType[] = ['PTS', 'REB', 'AST', 'PRA', '3PM'];

export default function PlayerDetailScreen() {
  const { id, market, gameId, playerName, headshotUrl } = useLocalSearchParams<{
    id: string;
    market?: string;
    gameId?: string;
    playerName?: string;
    headshotUrl?: string;
  }>();

  // id may be a numeric API-Sports id or a URL-encoded player name
  const playerId = parseInt(id || '0', 10);
  const resolvedPlayerName = playerName || (isNaN(playerId) ? decodeURIComponent(id || '') : undefined);
  const initialStatType = (market && AVAILABLE_STATS.includes(market as StatType))
    ? (market as StatType)
    : 'PTS';
  const gameIdNum = gameId ? parseInt(gameId, 10) : undefined;

  return (
    <PlayerDetailScreenV2
      playerId={isNaN(playerId) ? 0 : playerId}
      initialStatType={initialStatType}
      gameId={gameIdNum}
      playerName={resolvedPlayerName}
      headshotUrl={headshotUrl}
    />
  );
}
