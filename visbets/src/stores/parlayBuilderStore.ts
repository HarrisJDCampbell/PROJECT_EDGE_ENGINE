/**
 * Parlay Builder Store
 * Manages state for building custom parlays
 */

import { create } from 'zustand';
import { Player } from '../services/api/types';

export type StatType = 'PTS' | 'REB' | 'AST' | 'PRA' | '3PM' | 'STL' | 'BLK' | 'TO';

export interface ParlayLeg {
  id: string;
  player: Player;
  statType: StatType;
  line: number;
  isOver: boolean;
  imageUrl?: string;
}

interface ParlayBuilderState {
  legs: ParlayLeg[];
  searchQuery: string;
  isSearching: boolean;

  // Actions
  addLeg: (player: Player, imageUrl?: string) => void;
  removeLeg: (legId: string) => void;
  updateLeg: (legId: string, updates: Partial<Omit<ParlayLeg, 'id' | 'player'>>) => void;
  setSearchQuery: (query: string) => void;
  setIsSearching: (isSearching: boolean) => void;
  clearParlay: () => void;
  hasPlayer: (playerId: number) => boolean;
}

const MAX_PARLAY_LEGS = 10;

export const useParlayBuilderStore = create<ParlayBuilderState>((set, get) => ({
  legs: [],
  searchQuery: '',
  isSearching: false,

  addLeg: (player: Player, imageUrl?: string) => {
    const state = get();
    // Prevent duplicate players
    if (state.legs.some((leg) => leg.player.id === player.id)) return;
    // Enforce max leg count
    if (state.legs.length >= MAX_PARLAY_LEGS) return;

    const newLeg: ParlayLeg = {
      id: `${player.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      player,
      statType: 'PTS',
      line: 20,
      isOver: true,
      imageUrl,
    };
    set((s) => ({ legs: [...s.legs, newLeg] }));
  },

  removeLeg: (legId: string) => {
    set((state) => ({
      legs: state.legs.filter((leg) => leg.id !== legId),
    }));
  },

  updateLeg: (legId: string, updates: Partial<Omit<ParlayLeg, 'id' | 'player'>>) => {
    set((state) => ({
      legs: state.legs.map((leg) =>
        leg.id === legId ? { ...leg, ...updates } : leg
      ),
    }));
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setIsSearching: (isSearching: boolean) => {
    set({ isSearching });
  },

  clearParlay: () => {
    set({ legs: [], searchQuery: '' });
  },

  hasPlayer: (playerId: number) => {
    return get().legs.some((leg) => leg.player.id === playerId);
  },
}));
