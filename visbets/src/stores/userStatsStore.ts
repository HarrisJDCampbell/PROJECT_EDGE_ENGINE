/**
 * User Stats Store
 * Tracks user activity metrics like props viewed, etc.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserStatsState {
  propsViewed: number;

  // Actions
  incrementPropsViewed: () => void;
  resetStats: () => void;
}

export const useUserStatsStore = create<UserStatsState>()(
  persist(
    (set, get) => ({
      propsViewed: 0,

      incrementPropsViewed: () => {
        set({ propsViewed: get().propsViewed + 1 });
      },

      resetStats: () => {
        set({ propsViewed: 0 });
      },
    }),
    {
      name: 'visbets-user-stats',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
