import { create } from 'zustand';
import { fetchMyCertificates } from '../services/certificateService';
import type { MyCertificates } from '../types/certificate';

interface CertificateState {
  data: MyCertificates | null;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  reset: () => void;
}

/**
 * The devotee's certificates, shared by the Home "ready" card, the level-up
 * celebration and the Certificates screen so they never disagree.
 */
export const useCertificateStore = create<CertificateState>(set => ({
  data: null,
  loading: false,
  error: null,
  load: async () => {
    set({ loading: true, error: null });
    try {
      set({ data: await fetchMyCertificates() });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Could not load your certificates.' });
    } finally {
      set({ loading: false });
    }
  },
  reset: () => set({ data: null, loading: false, error: null }),
}));

/** How many certificates the devotee can download right now. */
export function readyCount(data: MyCertificates | null): number {
  if (!data?.enabled) return 0;
  return data.levels.filter(l => l.certificate !== null).length;
}
