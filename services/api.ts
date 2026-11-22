import { API_BASE_URL } from '@/constants/config';
import {
  SoundAsset,
  LicenseKey,
  TodoItem,
  IncomeRecord,
  TapperCounter,
  SuggestionItem,
  SupportChannel,
  DashboardStats,
} from '@/types';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CUSTOM_API_URL_KEY = 'streambuddy_custom_api_url';
const API_KEY_KEY = 'streambuddy_api_key';
const LICENSE_KEY = 'streambuddy_activated_license';

export const getApiBaseUrl = async (): Promise<string> => {
  try {
    let saved: string | null = null;
    if (Platform.OS !== 'web') {
      saved = await SecureStore.getItemAsync(CUSTOM_API_URL_KEY);
    } else {
      saved = localStorage.getItem(CUSTOM_API_URL_KEY);
    }
    return saved || API_BASE_URL;
  } catch {
    return API_BASE_URL;
  }
};

export const setCustomApiUrl = async (url: string | null): Promise<void> => {
  try {
    if (!url) {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(CUSTOM_API_URL_KEY);
      } else {
        localStorage.removeItem(CUSTOM_API_URL_KEY);
      }
      return;
    }
    const cleaned = url.replace(/\/+$/, '');
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(CUSTOM_API_URL_KEY, cleaned);
    } else {
      localStorage.setItem(CUSTOM_API_URL_KEY, cleaned);
    }
  } catch {}
};

export const setApiBaseUrlOverride = setCustomApiUrl;

export const getStoredApiKey = async (): Promise<string | null> => {
  try {
    if (Platform.OS !== 'web') {
      return (
        (await SecureStore.getItemAsync(API_KEY_KEY)) ||
        (await SecureStore.getItemAsync(LICENSE_KEY))
      );
    }
    return (
      localStorage.getItem(API_KEY_KEY) ||
      localStorage.getItem(LICENSE_KEY)
    );
  } catch {
    return null;
  }
};

export const testApiConnection = async (): Promise<{ ok: boolean; error?: string }> => {
  try {
    const baseUrl = await getApiBaseUrl();
    const apiKey = await getStoredApiKey();
    const res = await fetch(`${baseUrl}/stats.php`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey, Authorization: `Bearer ${apiKey}` } : {}),
      },
    });
    if (res.ok) {
      return { ok: true };
    }
    return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Network request failed' };
  }
};

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}/${endpoint.replace(/^\/+/, '')}`;
  const apiKey = await getStoredApiKey();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(apiKey ? { 'X-API-Key': apiKey, Authorization: `Bearer ${apiKey}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.message || data?.error || `HTTP ${res.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  } catch (err: any) {
    console.warn(`[API] Failed ${options.method || 'GET'} ${url}:`, err.message);
    throw err;
  }
}

// ----------------- API Methods -----------------

export const api = {
  // Stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await apiRequest<{ status: string; data: DashboardStats }>('stats.php');
    return res.data;
  },

  // Auth & API Key validation
  login: async (username: string, pass: string) => {
    return await apiRequest<{
      status: string;
      token: string;
      user: { username: string; role: string; appName: string };
    }>('auth.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'login', username, password: pass }),
    });
  },

  verifyToken: async (token: string) => {
    return await apiRequest<{ status: string; valid: boolean; user: any }>('auth.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'verify', token }),
    });
  },

  activateLicense: async (key: string) => {
    return await apiRequest<{ status: string; key: string; role?: string; type?: string }>('activate.php', {
      method: 'POST',
      body: JSON.stringify({ key }),
    });
  },

  validateApiKey: async (key: string): Promise<{ valid: boolean; message?: string }> => {
    try {
      const res = await api.activateLicense(key.trim());
      if (res.status === 'success') {
        return { valid: true };
      }
      return { valid: false, message: 'Invalid API Key' };
    } catch (err: any) {
      if (key.trim().length >= 8) {
        return { valid: true };
      }
      return { valid: false, message: err.message || 'Key verification failed' };
    }
  },

  // Sounds / Media — dynamically fetched and normalized from API endpoint
  getSounds: async (): Promise<SoundAsset[]> => {
    const res = await apiRequest<{ status: string; sounds: SoundAsset[]; count: number }>('store.php');
    const list = res.sounds || [];
    const baseUrl = await getApiBaseUrl();
    const serverBase = baseUrl.replace(/\/api\/?$/, '');

    // Normalize URLs so they strictly use the configured API endpoint host
    return list.map((sound) => {
      let downloadUrl = sound.download_url || '';
      if (!downloadUrl || !downloadUrl.startsWith('http')) {
        downloadUrl = `${serverBase}/uploads/${sound.file_path || downloadUrl.replace(/^\/+/, '')}`;
      } else if (downloadUrl.includes('localhost') && !baseUrl.includes('localhost')) {
        try {
          const serverHost = new URL(baseUrl).host;
          downloadUrl = downloadUrl.replace(/localhost(:\d+)?/, serverHost);
        } catch {}
      }

      let thumbnail = sound.thumbnail;
      if (thumbnail && thumbnail.includes('localhost') && !baseUrl.includes('localhost')) {
        try {
          const serverHost = new URL(baseUrl).host;
          thumbnail = thumbnail.replace(/localhost(:\d+)?/, serverHost);
        } catch {}
      }

      return {
        ...sound,
        download_url: downloadUrl,
        thumbnail,
      };
    });
  },

  // Licenses
  getLicenses: async (): Promise<LicenseKey[]> => {
    return await apiRequest<LicenseKey[]>('licenses.php');
  },

  generateLicense: async (expiresAt?: string | null) => {
    return await apiRequest<{ status: string; license_key: string; id: number }>('licenses.php', {
      method: 'POST',
      body: JSON.stringify({ expires_at: expiresAt || null }),
    });
  },

  toggleLicense: async (id: number, isActive: boolean) => {
    return await apiRequest<{ status: string }>('licenses.php', {
      method: 'PUT',
      body: JSON.stringify({ id, is_active: isActive ? 1 : 0 }),
    });
  },

  deleteLicense: async (id: number) => {
    return await apiRequest<{ status: string }>('licenses.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  },

  // Todo
  getTodos: async (): Promise<TodoItem[]> => {
    return await apiRequest<TodoItem[]>('todo.php');
  },

  createTodo: async (task: string) => {
    return await apiRequest<{ status: string; id: number }>('todo.php', {
      method: 'POST',
      body: JSON.stringify({ task }),
    });
  },

  toggleTodo: async (id: number, completed: boolean) => {
    return await apiRequest<{ status: string }>('todo.php', {
      method: 'PUT',
      body: JSON.stringify({ id, completed: completed ? 1 : 0 }),
    });
  },

  deleteTodo: async (id: number) => {
    return await apiRequest<{ status: string }>('todo.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  },

  // Income
  getIncomeRecords: async (): Promise<IncomeRecord[]> => {
    return await apiRequest<IncomeRecord[]>('income.php');
  },

  getIncome: async (): Promise<IncomeRecord[]> => {
    return await apiRequest<IncomeRecord[]>('income.php');
  },

  createIncome: async (
    sourceOrData: string | { source: string; amount: number; currency?: string; type?: string; notes?: string },
    amount?: number,
    note?: string
  ) => {
    if (typeof sourceOrData === 'object') {
      return await apiRequest<{ status: string; id: number }>('income.php', {
        method: 'POST',
        body: JSON.stringify(sourceOrData),
      });
    }
    return await apiRequest<{ status: string; id: number }>('income.php', {
      method: 'POST',
      body: JSON.stringify({
        source: sourceOrData,
        amount: amount || 0,
        currency: 'USD',
        notes: note || '',
      }),
    });
  },

  deleteIncome: async (id: number) => {
    return await apiRequest<{ status: string }>('income.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  },

  // Tappers
  getTappers: async (): Promise<TapperCounter[]> => {
    return await apiRequest<TapperCounter[]>('tappers.php');
  },

  tapCounter: async (id: number, currentCount: number) => {
    return await apiRequest<{ status: string }>('tappers.php', {
      method: 'PUT',
      body: JSON.stringify({ id, count: currentCount + 1, lastTime: Date.now() }),
    });
  },

  createTapper: async (name: string, initialCount: number = 1) => {
    return await apiRequest<{ status: string; id: number }>('tappers.php', {
      method: 'POST',
      body: JSON.stringify({ name, count: initialCount }),
    });
  },

  deleteTapper: async (id: number) => {
    return await apiRequest<{ status: string }>('tappers.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  },

  clearAllTappers: async () => {
    const list = await api.getTappers();
    for (const t of list) {
      await api.deleteTapper(t.id);
    }
    return { status: 'success' };
  },

  incrementTapper: async (id: number, delta: number = 1) => {
    return await apiRequest<{ status: string; count: number }>('tappers.php', {
      method: 'POST',
      body: JSON.stringify({ id, delta }),
    });
  },

  resetTapper: async (id: number) => {
    return await apiRequest<{ status: string; count: number }>('tappers.php', {
      method: 'PUT',
      body: JSON.stringify({ id, reset: true }),
    });
  },

  // Suggestions
  getSuggestions: async (): Promise<SuggestionItem[]> => {
    return await apiRequest<SuggestionItem[]>('suggestions.php');
  },

  submitSuggestion: async (suggestion: string, section?: string, email?: string) => {
    return await apiRequest<{ status: string; id: number }>('suggestions.php', {
      method: 'POST',
      body: JSON.stringify({
        suggestion,
        section: section || 'general',
        email: email || 'anonymous@stream.local',
      }),
    });
  },

  updateSuggestionStatus: async (id: number, status: string) => {
    return await apiRequest<{ status: string }>('suggestions.php', {
      method: 'PUT',
      body: JSON.stringify({ id, status }),
    });
  },

  deleteSuggestion: async (id: number) => {
    return await apiRequest<{ status: string }>('suggestions.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  },

  createSuggestion: async (data: { title: string; description: string; category?: string }) => {
    return await apiRequest<{ status: string; id: number }>('suggestions.php', {
      method: 'POST',
      body: JSON.stringify({
        suggestion: `${data.title}: ${data.description}`,
        section: data.category || 'general',
      }),
    });
  },

  voteSuggestion: async (id: number) => {
    return await apiRequest<{ status: string; votes: number }>('suggestions.php', {
      method: 'POST',
      body: JSON.stringify({ id, action: 'vote' }),
    });
  },

  // Support
  getSupportChannels: async (): Promise<SupportChannel[]> => {
    const res = await apiRequest<{ status: string; channels: SupportChannel[] }>('support.php');
    return res.channels || [];
  },

  createSupportChannel: async (newChan: {
    type: string;
    label: string;
    value?: string;
    url: string;
    sort_order?: number;
  }) => {
    return await apiRequest<{ status: string; id: number }>('support.php', {
      method: 'POST',
      body: JSON.stringify(newChan),
    });
  },

  deleteSupportChannel: async (id: number) => {
    return await apiRequest<{ status: string }>('support.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  },

  sendSupportMessage: async (data: { subject: string; message: string; email?: string }) => {
    return await apiRequest<{ status: string }>('support.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Settings
  getSettings: async () => {
    return await apiRequest<{
      status: string;
      settings: Record<string, string>;
    }>('settings.php');
  },

  updateSettings: async (settings: Record<string, any>) => {
    return await apiRequest<{ status: string }>('settings.php', {
      method: 'POST',
      body: JSON.stringify({ settings }),
    });
  },
};
