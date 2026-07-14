import { create } from 'zustand';

export interface AppState {
  // Simple counter demo
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;

  // User profile
  userName: string;
  setUserName: (name: string) => void;

  // Preferences
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
}

/**
 * App-wide store powered by Zustand. Use anywhere with a selector:
 *   const count = useAppStore(s => s.count);
 *   const increment = useAppStore(s => s.increment);
 */
export const useAppStore = create<AppState>(set => ({
  count: 0,
  increment: () => set(s => ({ count: s.count + 1 })),
  decrement: () => set(s => ({ count: Math.max(0, s.count - 1) })),
  reset: () => set({ count: 0 }),

  userName: 'Guest',
  setUserName: userName => set({ userName }),

  notificationsEnabled: true,
  toggleNotifications: () =>
    set(s => ({ notificationsEnabled: !s.notificationsEnabled })),
}));
