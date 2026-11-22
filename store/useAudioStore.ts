import { create } from 'zustand';
import { Platform } from 'react-native';
import { SoundAsset } from '@/types';
import { triggerHaptic } from '@/utils/haptics';

interface AudioState {
  currentSound: SoundAsset | null;
  isPlaying: boolean;
  durationMs: number;
  positionMs: number;
  volume: number;
  isLooping: boolean;
  toggleLoop: () => void;
  seekTo: (positionMs: number) => Promise<void>;
  playSound: (sound: SoundAsset) => Promise<void>;
  stopSound: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  setVolume: (vol: number) => Promise<void>;
}

// Active playback instances
let activePlayerInstance: any = null;
let activeHtmlAudio: any = null;
let activeStatusSubscription: any = null;
let mockTimer: any = null;
let isAudioModeConfigured = false;

/**
 * Configure system audio mode to ensure sound plays loudly through phone speakers,
 * even when the phone physical silent/vibrate switch is enabled!
 */
export async function configureAudioMode(): Promise<void> {
  if (Platform.OS === 'web') return;

  // 1. Configure expo-audio AudioModule (Expo SDK 58 native engine)
  try {
    const { AudioModule } = require('expo-audio');
    if (AudioModule && typeof AudioModule.setAudioModeAsync === 'function') {
      if (typeof AudioModule.setIsAudioActiveAsync === 'function') {
        await AudioModule.setIsAudioActiveAsync(true).catch(() => { });
      }
      await AudioModule.setAudioModeAsync({
        playsInSilentMode: true,           // iOS: plays even with silent/mute switch flipped!
        shouldRouteThroughEarpiece: false,  // CRITICAL: Forces loudspeaker, NOT call earpiece!
        interruptionMode: 'duckOthers',
        allowsRecording: false,            // Prevents audio session from switching to telephone call mode!
        shouldPlayInBackground: true,
      });
      isAudioModeConfigured = true;
    }
  } catch (e) {
    // Continue
  }
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentSound: null,
  isPlaying: false,
  durationMs: 0,
  positionMs: 0,
  volume: 1.0,
  isLooping: false,

  toggleLoop: () => {
    const next = !get().isLooping;
    set({ isLooping: next });
    if (activeHtmlAudio) {
      activeHtmlAudio.loop = next;
    }
    if (activePlayerInstance && 'loop' in activePlayerInstance) {
      activePlayerInstance.loop = next;
    }
  },

  seekTo: async (positionMs: number) => {
    const sec = positionMs / 1000;
    if (activeHtmlAudio) {
      activeHtmlAudio.currentTime = sec;
      set({ positionMs });
      return;
    }
    if (activePlayerInstance) {
      try {
        if (typeof activePlayerInstance.seekTo === 'function') {
          await activePlayerInstance.seekTo(sec);
        } else if (typeof activePlayerInstance.setPositionAsync === 'function') {
          await activePlayerInstance.setPositionAsync(positionMs);
        }
        set({ positionMs });
      } catch { }
    }
  },

  playSound: async (sound: SoundAsset) => {
    const state = get();

    // If currently playing this exact sound, toggle pause
    if (state.currentSound?.id === sound.id && state.isPlaying) {
      await state.togglePlayPause();
      return;
    }

    // Stop and clean up any previously active playback
    await state.stopSound();

    // Ensure audio hardware mode is routed to phone speaker with silent-mode bypass
    await configureAudioMode();

    const targetUrl =
      sound.download_url ||
      (sound as any).uri ||
      (sound as any).file_url ||
      '';
    console.log('[AudioStore] Starting sound playback:', sound.name, targetUrl);

    // 1. Web Platform (HTML5 Audio Element — 100% reliable speaker output)
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
      try {
        const audio = new window.Audio(targetUrl);
        audio.volume = state.volume;
        audio.muted = false;

        audio.onloadedmetadata = () => {
          set({ durationMs: (audio.duration || 0) * 1000 });
        };

        audio.ontimeupdate = () => {
          set({
            positionMs: (audio.currentTime || 0) * 1000,
            durationMs: (audio.duration || 0) * 1000,
          });
        };

        audio.onended = () => {
          if (get().isLooping) {
            audio.currentTime = 0;
            audio.play().catch(() => { });
            set({ isPlaying: true, positionMs: 0 });
          } else {
            set({ isPlaying: false, positionMs: 0 });
          }
        };

        audio.onerror = (e) => {
          console.warn('[AudioStore] Web Audio error:', e);
          set({ isPlaying: false });
        };

        await audio.play();
        activeHtmlAudio = audio;

        set({
          currentSound: sound,
          isPlaying: true,
          positionMs: 0,
        });
        return;
      } catch (err) {
        console.warn('[AudioStore] Web Audio playback failed:', err);
      }
    }

    // 2. Native expo-audio (Modern Expo SDK 58 engine)
    let expoAudioSuccess = false;
    try {
      const expoAudio = require('expo-audio');
      if (expoAudio && (typeof expoAudio.createAudioPlayer === 'function' || expoAudio.AudioModule)) {
        const { createAudioPlayer, AudioModule } = expoAudio;

        // Ensure audio mode is applied right before playback
        if (AudioModule && typeof AudioModule.setAudioModeAsync === 'function') {
          await AudioModule.setAudioModeAsync({
            playsInSilentMode: true,
            shouldRouteThroughEarpiece: false,
            interruptionMode: 'duckOthers',
            allowsRecording: false,
            shouldPlayInBackground: true,
          }).catch(() => { });
        }

        // CRITICAL: downloadFirst MUST BE FALSE!
        // When downloadFirst is true, initialSource is null, meaning play() starts with no source.
        // With downloadFirst: false, the remote URL is loaded immediately.
        const player = createAudioPlayer(targetUrl, {
          updateInterval: 200,
          downloadFirst: false,
          keepAudioSessionActive: true,
          allowsExternalPlayback: true,
        });

        player.muted = false;
        player.volume = state.volume ?? 1.0;

        activePlayerInstance = player;

        // Attach event listener for playback progress & completion
        if (typeof player.addListener === 'function') {
          activeStatusSubscription = player.addListener('playbackStatusUpdate', (status: any) => {
            if (!status) return;

            const isPlayingNow = status.playing ?? status.isPlaying ?? false;
            const curSeconds = status.currentTime ?? 0;
            const durSeconds = status.duration ?? 0;

            if (status.didJustFinish) {
              if (get().isLooping) {
                if (typeof player.play === 'function') {
                  if (typeof player.seekTo === 'function') {
                    player.seekTo(0);
                  }
                  player.play();
                }
                set({ isPlaying: true, positionMs: 0 });
              } else {
                set({ isPlaying: false, positionMs: 0 });
              }
            } else if (durSeconds > 0) {
              set({
                isPlaying: isPlayingNow,
                positionMs: Math.round(curSeconds * 1000),
                durationMs: Math.round(durSeconds * 1000),
              });
            } else {
              set({ isPlaying: isPlayingNow });
            }
          });
        }

        // Start playback
        player.play();

        set({
          currentSound: sound,
          isPlaying: true,
          positionMs: 0,
          durationMs: 3500, // initial estimate while buffering
        });

        expoAudioSuccess = true;
        return;
      }
    } catch (err) {
      console.warn('[AudioStore] expo-audio failed:', err);
    }

    // 3. Fallback timer if audio playback could not be started
    triggerHaptic('medium');
    const estimatedDuration = 3000;
    let elapsed = 0;

    clearInterval(mockTimer);
    mockTimer = setInterval(() => {
      elapsed += 200;
      if (elapsed >= estimatedDuration) {
        clearInterval(mockTimer);
        set({ isPlaying: false, positionMs: 0 });
      } else {
        set({ positionMs: elapsed });
      }
    }, 200);

    set({
      currentSound: sound,
      isPlaying: true,
      durationMs: estimatedDuration,
      positionMs: 0,
    });
  },

  stopSound: async () => {
    clearInterval(mockTimer);

    if (activeStatusSubscription) {
      try {
        if (typeof activeStatusSubscription.remove === 'function') {
          activeStatusSubscription.remove();
        }
      } catch { }
      activeStatusSubscription = null;
    }

    if (activeHtmlAudio) {
      try {
        activeHtmlAudio.pause();
        activeHtmlAudio.currentTime = 0;
      } catch { }
      activeHtmlAudio = null;
    }

    if (activePlayerInstance) {
      try {
        if (typeof activePlayerInstance.pause === 'function') {
          activePlayerInstance.pause();
        }
        if (typeof activePlayerInstance.release === 'function') {
          activePlayerInstance.release();
        } else if (typeof activePlayerInstance.stopAsync === 'function') {
          await activePlayerInstance.stopAsync();
          await activePlayerInstance.unloadAsync();
        }
      } catch { }
      activePlayerInstance = null;
    }

    set({
      isPlaying: false,
      currentSound: null,
      positionMs: 0,
    });
  },

  togglePlayPause: async () => {
    const { isPlaying, currentSound } = get();

    if (!currentSound) return;

    if (activeHtmlAudio) {
      if (isPlaying) {
        activeHtmlAudio.pause();
        set({ isPlaying: false });
      } else {
        await activeHtmlAudio.play();
        set({ isPlaying: true });
      }
      return;
    }

    if (activePlayerInstance) {
      try {
        if (isPlaying) {
          if (typeof activePlayerInstance.pause === 'function') {
            activePlayerInstance.pause();
          } else if (typeof activePlayerInstance.pauseAsync === 'function') {
            await activePlayerInstance.pauseAsync();
          }
          set({ isPlaying: false });
        } else {
          if (typeof activePlayerInstance.play === 'function') {
            activePlayerInstance.play();
          } else if (typeof activePlayerInstance.playAsync === 'function') {
            await activePlayerInstance.playAsync();
          }
          set({ isPlaying: true });
        }
        return;
      } catch { }
    }

    // Fallback simulation toggle
    if (isPlaying) {
      clearInterval(mockTimer);
      set({ isPlaying: false });
    } else {
      triggerHaptic('light');
      set({ isPlaying: true });
    }
  },

  setVolume: async (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    set({ volume: clamped });

    if (activeHtmlAudio) {
      activeHtmlAudio.volume = clamped;
    }
    if (activePlayerInstance) {
      try {
        if ('volume' in activePlayerInstance) {
          activePlayerInstance.volume = clamped;
        } else if (typeof activePlayerInstance.setVolume === 'function') {
          activePlayerInstance.setVolume(clamped);
        } else if (typeof activePlayerInstance.setVolumeAsync === 'function') {
          await activePlayerInstance.setVolumeAsync(clamped);
        }
      } catch { }
    }
  },
}));

// Run audio configuration once on module load
configureAudioMode().catch(() => { });
