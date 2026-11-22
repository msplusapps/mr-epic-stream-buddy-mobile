import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface LocalMediaFile {
  id: string;
  name: string;
  uri: string;
  size?: number;
  mimeType?: string;
  type: 'audio' | 'video';
  addedAt: number;
}

interface LocalMediaStore {
  files: LocalMediaFile[];
  activeFile: LocalMediaFile | null;
  setActiveFile: (file: LocalMediaFile | null) => void;
  addFile: (file: LocalMediaFile) => Promise<void>;
  removeFile: (id: string) => Promise<void>;
  clearFiles: () => Promise<void>;
  loadSavedFiles: () => Promise<void>;
}

const STORAGE_KEY = 'streambuddy_local_media_files';

export const useLocalMediaStore = create<LocalMediaStore>((set, get) => ({
  files: [],
  activeFile: null,

  setActiveFile: (file: LocalMediaFile | null) => {
    set({ activeFile: file });
  },

  addFile: async (file: LocalMediaFile) => {
    const existing = get().files.filter((f) => f.uri !== file.uri);
    const updated = [file, ...existing];
    set({ files: updated, activeFile: file });

    try {
      const serialized = JSON.stringify(updated);
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(STORAGE_KEY, serialized);
      } else {
        localStorage.setItem(STORAGE_KEY, serialized);
      }
    } catch { }
  },

  removeFile: async (id: string) => {
    const updated = get().files.filter((f) => f.id !== id);
    const currentActive = get().activeFile;
    set({
      files: updated,
      activeFile: currentActive?.id === id ? null : currentActive,
    });

    try {
      const serialized = JSON.stringify(updated);
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(STORAGE_KEY, serialized);
      } else {
        localStorage.setItem(STORAGE_KEY, serialized);
      }
    } catch { }
  },

  clearFiles: async () => {
    set({ files: [], activeFile: null });
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(STORAGE_KEY);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch { }
  },

  loadSavedFiles: async () => {
    try {
      let raw: string | null = null;
      if (Platform.OS !== 'web') {
        raw = await SecureStore.getItemAsync(STORAGE_KEY);
      } else {
        raw = localStorage.getItem(STORAGE_KEY);
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          set({ files: parsed });
        }
      }
    } catch { }
  },
}));
