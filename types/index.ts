export type MediaCategory = 'sfx' | 'music' | 'ambient' | 'voice' | 'other' | 'General';

export interface SoundAsset {
  id: number;
  name: string;
  file_path: string;
  description: string;
  category: string;
  download_url: string;
  thumbnail: string | null;
  created_at: string;
}

export interface LicenseKey {
  id: number;
  license_key: string;
  is_active: number | boolean;
  expires_at: string | null;
  created_at: string;
}

export interface TodoItem {
  id: number;
  task: string;
  completed: number | boolean;
  created_at: string;
  updated_at?: string;
}

export interface IncomeRecord {
  id: number;
  type: string;
  amount: number | string;
  note?: string;
  timestamp: number;
  created_at: string;
}

export interface TapperCounter {
  id: number;
  name: string;
  count: number;
  lastTime: number | null;
  created_at: string;
}

export interface SuggestionItem {
  id: number;
  email: string;
  section: string;
  suggestion: string;
  status: 'pending' | 'reviewed' | 'implemented';
  created_at: string;
}

export interface SupportChannel {
  id: number;
  type: string;
  label: string;
  value: string;
  url: string;
  sort_order: number;
  created_at: string;
}

export interface DashboardStats {
  sounds: {
    total: number;
    storageMB: number;
    recent: Array<{
      id: number;
      name: string;
      category: string;
      created_at: string;
    }>;
  };
  licenses: {
    total: number;
    active: number;
    expired: number;
  };
  income: {
    total: number;
    entriesCount: number;
  };
  tappers: {
    totalTaps: number;
    countersCount: number;
  };
  todos: {
    total: number;
    pending: number;
    completed: number;
  };
  suggestions: {
    total: number;
    pending: number;
  };
  supportChannels: number;
  theme: string;
  server: {
    status: string;
    version: string;
    timestamp: number;
  };
}

export interface AuthUser {
  id?: number;
  username: string;
  email?: string;
  role: string;
  appName?: string;
  token?: string;
}

export interface ThemePalette {
  id: string;
  name: string;
  primary: string;
  vibrant: string;
  bg: string;
  card: string;
  border: string;
  success: string;
  danger: string;
  warning: string;
  text: string;
  textDim: string;
  textMuted: string;
}
