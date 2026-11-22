import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { SoundAsset } from '@/types';
import { triggerHaptic } from '@/utils/haptics';

interface SoundLibraryState {
  downloadedSoundIds: number[];
  isLoaded: boolean;
  isDownloaded: (soundId: number) => boolean;
  downloadSound: (sound: SoundAsset) => Promise<void>;
  removeSound: (soundId: number) => Promise<void>;
  reorderSounds: (newIds: number[]) => Promise<void>;
  loadLibrary: () => Promise<void>;
  clearLibrary: () => Promise<void>;
}

const STORAGE_KEY = 'streambuddy_downloaded_sounds';

const storageGet = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS !== 'web') {
      return await SecureStore.getItemAsync(key);
    }
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const storageSet = async (key: string, value: string): Promise<void> => {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(key, value);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {}
};

export const useSoundLibraryStore = create<SoundLibraryState>((set, get) => ({
  downloadedSoundIds: [],
  isLoaded: false,

  isDownloaded: (soundId: number) => {
    return get().downloadedSoundIds.includes(soundId);
  },

  downloadSound: async (sound: SoundAsset) => {
    const current = get().downloadedSoundIds;
    if (current.includes(sound.id)) return;

    triggerHaptic('success');
    const updated = [...current, sound.id];
    set({ downloadedSoundIds: updated });
    await storageSet(STORAGE_KEY, JSON.stringify(updated));
  },

  removeSound: async (soundId: number) => {
    const current = get().downloadedSoundIds;
    triggerHaptic('warning');
    const updated = current.filter((id) => id !== soundId);
    set({ downloadedSoundIds: updated });
    await storageSet(STORAGE_KEY, JSON.stringify(updated));
  },

  loadLibrary: async () => {
    try {
      const raw = await storageGet(STORAGE_KEY);
      if (raw) {
        const ids = JSON.parse(raw);
        if (Array.isArray(ids)) {
          set({ downloadedSoundIds: ids, isLoaded: true });
          return;
        }
      }

      // First run: seed with default sounds (e.g. IDs 2, 3, 4, 5, 6, 7) so the soundboard has initial clips
      const defaultIds = [2, 3, 4, 5, 6, 7];
      set({ downloadedSoundIds: defaultIds, isLoaded: true });
      await storageSet(STORAGE_KEY, JSON.stringify(defaultIds));
    } catch {
      set({ isLoaded: true });
    }
  },

  reorderSounds: async (newIds: number[]) => {
    set({ downloadedSoundIds: newIds });
    await storageSet(STORAGE_KEY, JSON.stringify(newIds));
  },

  clearLibrary: async () => {
    set({ downloadedSoundIds: [] });
    await storageSet(STORAGE_KEY, JSON.stringify([]));
  },
}));

// Load library on module initialization
useSoundLibraryStore.getState().loadLibrary().catch(() => {});
