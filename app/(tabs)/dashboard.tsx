import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Volume2,
  VolumeX,
  Zap,
  DollarSign,
  CheckSquare,
  Play,
  Flame,
  Plus,
  Sliders,
  FolderOpen,
  ShoppingBag,
  GripVertical,
} from 'lucide-react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { useAudioStore } from '@/store/useAudioStore';
import { useSoundLibraryStore } from '@/store/useSoundLibraryStore';
import { api } from '@/services/api';
import { Card } from '@/components/common/Card';
import { SoundAsset } from '@/types';
import { API_BASE_URL, APP_NAME } from '@/constants/config';
import { triggerHaptic } from '@/utils/haptics';
import { DraggableSoundGrid } from '@/components/soundboard/DraggableSoundGrid';

const { width } = Dimensions.get('window');

// Dynamic application display name from environment or configuration
const EXPO_PUBLIC_APP_NAME =
  process.env.EXPO_PUBLIC_APP_NAME || APP_NAME || 'Epic Musicals Stream Buddy';

// Active sound pad colors: vibrant green for playing pads
const ACTIVE_PAD_COLOR = ['#10b981', '#059669'];

export default function StreamerConsoleDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { playSound, stopSound, currentSound, isPlaying } = useAudioStore();
  const { isDownloaded, downloadedSoundIds, reorderSounds } = useSoundLibraryStore();

  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isDraggingPad, setIsDraggingPad] = useState(false);

  // Dynamic idle pad color derived from the user's active theme selected in Settings
  const IDLE_PAD_COLOR = [theme.primary, theme.vibrant || theme.primary];

  // Equalizer bar animations & pad blinking animation
  const eqAnim1 = useRef(new Animated.Value(6)).current;
  const eqAnim2 = useRef(new Animated.Value(14)).current;
  const eqAnim3 = useRef(new Animated.Value(10)).current;
  const eqAnim4 = useRef(new Animated.Value(18)).current;
  const eqAnim5 = useRef(new Animated.Value(8)).current;
  const padBlinkAnim = useRef(new Animated.Value(1)).current;

  // Local live trigger feed
  const [recentFeed, setRecentFeed] = useState<string[]>([
    'Soundboard armed · API connected',
  ]);

  // Fetch real stream metrics from API
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats(),
  });

  // ONLY fetch sounds directly from the backend API
  const {
    data: sounds = [],
    isLoading: isLoadingSounds,
    refetch: refetchSounds,
  } = useQuery({
    queryKey: ['sounds'],
    queryFn: () => api.getSounds(),
  });

  // Fetch real tappers from API
  const { data: tappers = [] } = useQuery({
    queryKey: ['tappers'],
    queryFn: () => api.getTappers(),
  });

  const activeTapper = tappers[0] || { id: 1, name: 'TikTok Live Hype', count: 0 };
  const [localTaps, setLocalTaps] = useState(activeTapper.count || 0);

  useEffect(() => {
    if (activeTapper.count !== undefined) {
      setLocalTaps(activeTapper.count);
    }
  }, [activeTapper.count]);

  // Animate EQ and active pad blinking when sound is playing
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(padBlinkAnim, { toValue: 0.4, duration: 1150, useNativeDriver: true }),
          Animated.timing(padBlinkAnim, { toValue: 1, duration: 1150, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(eqAnim1, { toValue: 24, duration: 250, useNativeDriver: false }),
          Animated.timing(eqAnim1, { toValue: 6, duration: 250, useNativeDriver: false }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(eqAnim2, { toValue: 28, duration: 320, useNativeDriver: false }),
          Animated.timing(eqAnim2, { toValue: 8, duration: 320, useNativeDriver: false }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(eqAnim3, { toValue: 20, duration: 200, useNativeDriver: false }),
          Animated.timing(eqAnim3, { toValue: 5, duration: 200, useNativeDriver: false }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(eqAnim4, { toValue: 26, duration: 280, useNativeDriver: false }),
          Animated.timing(eqAnim4, { toValue: 10, duration: 280, useNativeDriver: false }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(eqAnim5, { toValue: 22, duration: 230, useNativeDriver: false }),
          Animated.timing(eqAnim5, { toValue: 7, duration: 230, useNativeDriver: false }),
        ])
      ).start();
    } else {
      padBlinkAnim.setValue(1);
      eqAnim1.setValue(6);
      eqAnim2.setValue(12);
      eqAnim3.setValue(8);
      eqAnim4.setValue(14);
      eqAnim5.setValue(6);
    }
  }, [isPlaying]);

  // Trigger Sound directly from API
  const handleTriggerApiSound = (sound: SoundAsset) => {
    triggerHaptic('medium');
    playSound(sound);

    setRecentFeed((prev) => [
      `FX triggered · ${sound.name}`,
      ...prev.slice(0, 3),
    ]);
  };

  // Instant Tap
  const handleLiveTap = () => {
    triggerHaptic('heavy');
    setLocalTaps((prev) => prev + 1);

    if (activeTapper.id) {
      api.tapCounter(activeTapper.id, localTaps).catch(() => { });
    }

    setRecentFeed((prev) => [
      `Tapper +1 · ${activeTapper.name}`,
      ...prev.slice(0, 3),
    ]);
  };

  const totalSoundCount = sounds.length;

  // Custom ordered sounds mapping to user's saved pad order
  const downloadedSounds = useMemo(() => {
    const soundMap = new Map<number, SoundAsset>(sounds.map((s) => [s.id, s]));
    const result: SoundAsset[] = [];

    // Follow the saved custom order from downloadedSoundIds
    for (const id of downloadedSoundIds) {
      const s = soundMap.get(id);
      if (s) {
        result.push(s);
        soundMap.delete(id);
      }
    }

    // Add any remaining downloaded sounds that weren't indexed yet
    for (const s of sounds) {
      if (isDownloaded(s.id) && soundMap.has(s.id)) {
        result.push(s);
      }
    }

    return result;
  }, [sounds, downloadedSoundIds, isDownloaded]);

  const handleReorderPads = (newSounds: SoundAsset[]) => {
    const newIds = newSounds.map((s) => s.id);
    reorderSounds(newIds);
  };

  const totalEarnings = stats?.income?.total ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg || '#070414', paddingTop: insets.top }]}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={[styles.stationBadge, { borderColor: theme.border || 'rgba(168, 85, 247, 0.25)' }]}>
          <View style={styles.livePulseDot} />
          <Text style={styles.stationBadgeText}>{EXPO_PUBLIC_APP_NAME}</Text>
        </View>

        <View style={styles.headerRight}>
          {isPlaying && (
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                stopSound();
              }}
              style={styles.stopButton}
            >
              <VolumeX size={16} color="#ef4444" />
            </Pressable>
          )}

          <Pressable
            onPress={() => {
              triggerHaptic('light');
              router.push('/(tabs)/profile');
            }}
            style={styles.profileBtn}
          >
            <Sliders size={18} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        scrollEnabled={!isDraggingPad}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Live Audio Deck & Waveform Equalizer Card */}
        <Card style={styles.waveDeckCard}>
          <View style={styles.deckTopRow}>
            <View style={styles.deckInfo}>
              <Text style={styles.deckCurrentTitle} numberOfLines={1}>
                {currentSound ? currentSound.name : (totalSoundCount > 0 ? 'Tap an API pad to trigger sound effect' : 'No sounds in cloud library')}
              </Text>
            </View>

            {/* Live animated EQ visualizer */}
            <View style={styles.liveEqBars}>
              <Animated.View style={[styles.eqBar, { height: eqAnim1, backgroundColor: '#21e6d2' }]} />
              <Animated.View style={[styles.eqBar, { height: eqAnim2, backgroundColor: '#5f6cff' }]} />
              <Animated.View style={[styles.eqBar, { height: eqAnim3, backgroundColor: '#a855f7' }]} />
              <Animated.View style={[styles.eqBar, { height: eqAnim4, backgroundColor: '#ec4899' }]} />
              <Animated.View style={[styles.eqBar, { height: eqAnim5, backgroundColor: '#f59e0b' }]} />
            </View>
          </View>

          {/* Live Stream Trigger Feed Line */}
          <View style={styles.feedLine}>
            <View style={styles.feedDot} />
            <Text style={styles.feedText} numberOfLines={1}>
              {recentFeed[0]}
            </Text>
          </View>
        </Card>

        {/* Section Header: Hotkey Soundboard */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Volume2 size={16} color={theme.primary || '#c084fc'} />
            <Text style={styles.sectionTitle}>Soundboard</Text>
            <View style={styles.activeCountBadge}>
              <Text style={styles.activeCountText}>{downloadedSounds.length} INSTALLED</Text>
            </View>
          </View>

          {downloadedSounds.length > 1 && (
            <Pressable
              onPress={() => {
                triggerHaptic('selection');
                setIsReorderMode(!isReorderMode);
              }}
              style={[
                styles.arrangeToggleBtn,
                isReorderMode && {
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                },
              ]}
            >
              <GripVertical
                size={13}
                color={isReorderMode ? '#ffffff' : theme.primary || '#c084fc'}
              />
              <Text
                style={[
                  styles.arrangeToggleText,
                  { color: isReorderMode ? '#ffffff' : theme.primary || '#c084fc' },
                ]}
              >
                {isReorderMode ? 'Done' : 'Sort Pads'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Loading State */}
        {isLoadingSounds && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={theme.primary || '#c084fc'} />
            <Text style={styles.loadingText}>Fetching sounds from API endpoint...</Text>
          </View>
        )}

        {/* Dynamic Sounds Grid: Drag & Drop reorderable pads */}
        {!isLoadingSounds && downloadedSounds.length > 0 && (
          <DraggableSoundGrid
            sounds={downloadedSounds}
            currentSound={currentSound}
            isPlaying={isPlaying}
            padBlinkAnim={padBlinkAnim}
            theme={theme}
            isReorderMode={isReorderMode}
            setIsReorderMode={setIsReorderMode}
            onTriggerSound={handleTriggerApiSound}
            onReorder={handleReorderPads}
            setIsDraggingParent={setIsDraggingPad}
          />
        )}

        {/* Empty State: Shown when no sounds are in the library */}
        {!isLoadingSounds && downloadedSounds.length === 0 && (
          <Card style={styles.emptyCard}>
            <ShoppingBag size={36} color="#a855f7" />
            <Text style={styles.emptyTitle}>Soundboard Library Empty</Text>
            <Text style={styles.emptySub}>
              You have not downloaded any sound effects to your library yet. Browse the Sound FX Store to preview and download sounds to your live pads!
            </Text>
            <Pressable
              onPress={() => {
                triggerHaptic('medium');
                router.push('/store');
              }}
              style={styles.emptyBtn}
            >
              <ShoppingBag size={15} color="#ffffff" />
              <Text style={styles.emptyBtnText}>Browse Sound FX Store 🛒</Text>
            </Pressable>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  stationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(33, 230, 210, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(33, 230, 210, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#21e6d2',
  },
  stationBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#21e6d2',
    letterSpacing: 0.8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  stopBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ef4444',
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 18,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  metricBox: {
    flex: 1,
    backgroundColor: 'rgba(24, 15, 46, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  metricSymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: '#34d399',
    marginRight: 2,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
    marginTop: 2,
  },
  metricEqRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 8,
    height: 14,
  },
  eqDot: {
    width: 4,
    borderRadius: 2,
  },
  waveDeckCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(20, 12, 40, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    gap: 12,
  },
  deckTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deckInfo: {
    flex: 1,
    marginRight: 10,
  },
  deckStatusLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#c084fc',
    letterSpacing: 0.8,
  },
  deckCurrentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 3,
  },
  liveEqBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 30,
    paddingHorizontal: 8,
  },
  eqBar: {
    width: 5,
    borderRadius: 3,
  },
  feedLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  feedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
  },
  feedText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeCountBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  activeCountText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
  },
  arrangeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  arrangeToggleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sectionActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storeHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#9333ea',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  storeHeaderBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#c084fc',
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  padGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  soundPadWrap: {
    width: (width - 60) / 3,
    height: 86,
  },
  animatedPadWrap: {
    flex: 1,
  },
  soundPad: {
    flex: 1,
    borderRadius: 16,
    padding: 10,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  soundPadDefault: {
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.22)',
  },
  soundPadActiveGreen: {
    borderWidth: 2,
    borderColor: '#34d399',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  padTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  padHotkey: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.5,
  },
  padHotkeyActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  padPlayingIndicatorGreen: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  padTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 16,
  },
  padTitleActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(24, 15, 46, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  emptySub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  emptyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#c084fc',
  },
  tapperSection: {
    gap: 10,
  },
  bigTapButtonWrap: {
    width: '100%',
    shadowColor: '#d946ef',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  bigTapButton: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  tapContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tapIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapInfoWrap: {
    flex: 1,
    marginLeft: 12,
  },
  tapPrompt: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  tapSubPrompt: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    marginTop: 2,
  },
  tapCountPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tapCountText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  toolChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  toolChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
});
