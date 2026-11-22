import { Platform } from 'react-native';

export const APP_NAME =
  process.env.EXPO_PUBLIC_APP_NAME || 'Epic Musicals Stream Buddy';

export const APP_INFO = {
  name: APP_NAME,
  tagline: 'Ultra-Modern Stream Companion & Command Center',
  version: '1.0.0',
  release: 'Starlight',
  consoleVersion: 'v3.0 Pro',
};

// Platform-aware default API URL with .env configuration
const getLocalApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    if (Platform.OS === 'android' && envUrl.includes('localhost')) {
      return envUrl.replace('localhost', '10.0.2.2');
    }
    return envUrl;
  }

  // Fallback to configured host
  const defaultHost = '192.168.0.100';
  return `http://${defaultHost}/projects/mr_epic_stream_buddy/api`;
};

export const API_BASE_URL = getLocalApiUrl();

export const DEFAULT_API_KEY =
  process.env.EXPO_PUBLIC_DEFAULT_API_KEY ||
  '63f4868774174671057e221b67f3d821b98a235b52d5373b';

export const CATEGORIES = [
  { id: 'all', label: 'All Assets', icon: 'Sparkles' },
  { id: 'sfx', label: 'SFX Effects', icon: 'Zap' },
  { id: 'music', label: 'Music Tracks', icon: 'Music' },
  { id: 'ambient', label: 'Ambient Loops', icon: 'CloudRain' },
  { id: 'voice', label: 'Voice Bites', icon: 'Mic' },
  { id: 'other', label: 'Other Media', icon: 'Film' },
];

export const INCOME_TYPES = [
  'Donation',
  'Twitch Bits',
  'Twitch Subs',
  'YouTube SuperChat',
  'YouTube Membership',
  'Kick Subscriptions',
  'Sponsorship',
  'Merch Sales',
  'Affiliate',
  'Other',
];
