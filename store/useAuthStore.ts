import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AuthUser } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;
  token: string | null;
  user: AuthUser | null;
  activatedKey: string | null;
  apiKey: string | null;
  setAuth: (user: AuthUser, token: string) => Promise<void>;
  setLicenseKey: (key: string) => Promise<void>;
  loginWithApiKey: (apiKey: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const TOKEN_KEY = 'streambuddy_auth_token';
const USER_KEY = 'streambuddy_auth_user';
const ONBOARDED_KEY = 'streambuddy_onboarded';
const LICENSE_KEY = 'streambuddy_activated_license';
const API_KEY_KEY = 'streambuddy_api_key';

const secureSet = async (key: string, value: string) => {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(key, value);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {}
};

const secureGet = async (key: string) => {
  try {
    if (Platform.OS !== 'web') {
      return await SecureStore.getItemAsync(key);
    }
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const secureDelete = async (key: string) => {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(key);
    } else {
      localStorage.removeItem(key);
    }
  } catch {}
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  isOnboarded: false,
  token: null,
  user: null,
  activatedKey: null,
  apiKey: null,

  setAuth: async (user: AuthUser, token: string) => {
    set({ isAuthenticated: true, user, token, apiKey: token });
    await secureSet(TOKEN_KEY, token);
    await secureSet(API_KEY_KEY, token);
    await secureSet(USER_KEY, JSON.stringify(user));
  },

  setLicenseKey: async (key: string) => {
    const user: AuthUser = {
      id: 1,
      username: 'Promise Peter Akpan',
      role: 'streamer',
    };
    set({ activatedKey: key, apiKey: key, isAuthenticated: true, user });
    await secureSet(LICENSE_KEY, key);
    await secureSet(API_KEY_KEY, key);
    await secureSet(USER_KEY, JSON.stringify(user));
  },

  loginWithApiKey: async (apiKey: string) => {
    const trimmed = apiKey.trim();
    const user: AuthUser = {
      id: 1,
      username: 'Promise Peter Akpan',
      role: 'streamer',
    };
    set({
      isAuthenticated: true,
      apiKey: trimmed,
      activatedKey: trimmed,
      token: trimmed,
      user,
    });
    await secureSet(API_KEY_KEY, trimmed);
    await secureSet(LICENSE_KEY, trimmed);
    await secureSet(TOKEN_KEY, trimmed);
    await secureSet(USER_KEY, JSON.stringify(user));
  },

  completeOnboarding: async () => {
    set({ isOnboarded: true });
    await secureSet(ONBOARDED_KEY, 'true');
  },

  logout: async () => {
    set({
      isAuthenticated: false,
      user: null,
      token: null,
      activatedKey: null,
      apiKey: null,
    });
    await secureDelete(TOKEN_KEY);
    await secureDelete(USER_KEY);
    await secureDelete(LICENSE_KEY);
    await secureDelete(API_KEY_KEY);
  },

  checkAuth: async () => {
    try {
      const onboarded = await secureGet(ONBOARDED_KEY);
      const token = await secureGet(TOKEN_KEY);
      const userStr = await secureGet(USER_KEY);
      const license = await secureGet(LICENSE_KEY);
      const apiKey = await secureGet(API_KEY_KEY);

      const isOnboarded = onboarded === 'true';
      let user: AuthUser | null = null;
      if (userStr) {
        try {
          user = JSON.parse(userStr);
        } catch {}
      }

      const activeKey = apiKey || license || token;

      set({
        isOnboarded,
        token: activeKey || null,
        apiKey: activeKey || null,
        user: user || (activeKey ? { id: 1, username: 'Promise Peter Akpan', role: 'streamer' } : null),
        activatedKey: activeKey || null,
        isAuthenticated: !!activeKey,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));
