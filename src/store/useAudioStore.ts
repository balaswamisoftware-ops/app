import { create } from 'zustand';

/**
 * Admin-managed devotional audio clip, fetched from the server at launch so it
 * can be changed without shipping a new build. Defaults to disabled (fail-safe).
 */
export interface AudioConfig {
  enabled: boolean;
  url: string;
  title: string;
}

interface AudioState extends AudioConfig {
  setAudio: (cfg: Partial<AudioConfig>) => void;
}

export const useAudioStore = create<AudioState>(set => ({
  enabled: false,
  url: '',
  title: '',
  setAudio: cfg => set(cfg),
}));
