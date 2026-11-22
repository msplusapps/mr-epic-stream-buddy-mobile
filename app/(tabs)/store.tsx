import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ArrowLeft,
  ShoppingBag,
  Music,
  CheckCircle2,
  Play,
  Pause,
  X,
  Sparkles,
} from 'lucide-react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { useAudioStore } from '@/store/useAudioStore';
import { useSoundLibraryStore } from '@/store/useSoundLibraryStore';
import { api } from '@/services/api';
import { InputField } from '@/components/forms/InputField';
import { SoundCard } from '@/components/media/SoundCard';
import { EmptyState } from '@/components/common/EmptyState';
import { triggerHaptic } from '@/utils/haptics';

const STORE_CATEGORIES = [
  { id: 'all', label: 'All FX' },
  { id: 'hype', label: 'Hype 🔥' },
  { id: 'meme', label: 'Memes 😂' },
  { id: 'alerts', label: 'Alerts 🔔' },
  { id: 'gaming', label: 'Gaming 🎮' },
  { id: 'reactions', label: 'Reactions 💬' },
  { id: 'general', label: 'General 🎵' },
];

export default function SoundFxStoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { currentSound, isPlaying, togglePlayPause, stopSound } = useAudioStore();
  const { downloadedSoundIds, isDownloaded, downloadSound, removeSound } = useSoundLibraryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Query sounds strictly from API endpoint store.php
  const {
    data: sounds = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['sounds'],
    queryFn: () => api.getSounds(),
  });

  const filteredSounds = useMemo(() => {
    return sounds.filter((s) => {
      const matchCat =
        selectedCategory === 'all' ||
        (s.category && s.category.toLowerCase().includes(selectedCategory.toLowerCase()));
      const matchSearch =
        !searchQuery.trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [sounds, selectedCategory, searchQuery]);

  const downloadedCount = downloadedSoundIds.length;

  return (
    <View style={[styles.container, { backgroundColor: '#070414', paddingTop: insets.top }]}>
      {/* Store Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <View style={styles.headerBadgeRow}>
            <ShoppingBag size={15} color="#c084fc" />
            <Text style={styles.headerBadgeText}>SOUND FX STORE</Text>
          </View>
          <Text style={styles.headerTitle}>Stream FX Catalog</Text>
        </View>

        {/* In-Library Counter Pill */}
        <Pressable
          onPress={() => {
            triggerHaptic('light');
            router.push('/(tabs)/library');
          }}
          style={styles.libraryPill}
        >
          <CheckCircle2 size={13} color="#34d399" />
          <Text style={styles.libraryPillText}>
            {downloadedCount} in library
          </Text>
        </Pressable>
      </View>

      {/* Hero Banner / Subtitle */}
      <View style={styles.storeBanner}>
        <View style={styles.bannerInfo}>
          <Text style={styles.bannerHeading}>Preview & Download Sound Effects</Text>
          <Text style={styles.bannerSub}>
            Tap Preview to listen before downloading. Downloaded FX are automatically mapped to your live stream soundboard.
          </Text>
        </View>
        <Sparkles size={28} color="#c084fc" style={{ opacity: 0.8 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <InputField
          placeholder="Search sound effects, memes, hype clips..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={<Search size={18} color="#c084fc" />}
          style={{ fontSize: 13 }}
        />

        {/* Categories Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {STORE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedCategory(cat.id);
                }}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Loading state */}
      {isLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#c084fc" />
          <Text style={styles.loadingText}>Loading sound effects from store...</Text>
        </View>
      )}

      {/* Sound List */}
      <FlatList
        data={filteredSounds}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <SoundCard
            sound={item}
            showStoreActions={true}
            isDownloaded={isDownloaded(item.id)}
            onDownload={() => downloadSound(item)}
            onRemove={() => removeSound(item.id)}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: currentSound ? insets.bottom + 140 : insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              triggerHaptic('light');
              refetch();
            }}
            tintColor="#c084fc"
            colors={['#c084fc']}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={<Music size={32} color="#c084fc" />}
              title="No Sounds Found"
              description={
                searchQuery || selectedCategory !== 'all'
                  ? 'No store FX match your current search.'
                  : 'The Sound FX Store currently has no assets uploaded to the API.'
              }
            />
          ) : undefined
        }
      />

      {/* Floating Mini Player when Audio is Active */}
      {currentSound && (
        <View
          style={[
            styles.floatingMiniPlayer,
            { bottom: insets.bottom + 70 },
          ]}
        >
          <View style={styles.miniPlayerLeft}>
            <View style={styles.miniPlayingIcon}>
              <Music size={18} color="#c084fc" />
            </View>
            <View style={styles.miniInfo}>
              <Text style={styles.miniTitle} numberOfLines={1}>
                {currentSound.name}
              </Text>
              <Text style={styles.miniStatus}>
                {isPlaying ? 'PREVIEWING THROUGH PHONE SPEAKER' : 'PAUSED'}
              </Text>
            </View>
          </View>

          <View style={styles.miniControls}>
            <Pressable
              onPress={() => {
                triggerHaptic('medium');
                togglePlayPause();
              }}
              style={styles.controlBtn}
            >
              {isPlaying ? (
                <Pause size={18} color="#000000" />
              ) : (
                <Play size={18} color="#000000" style={{ marginLeft: 2 }} />
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                triggerHaptic('light');
                stopSound();
              }}
              style={styles.stopBtn}
            >
              <X size={18} color="rgba(255, 255, 255, 0.5)" />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#c084fc',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  libraryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  libraryPillText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  storeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(147, 51, 234, 0.12)',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
  },
  bannerInfo: {
    flex: 1,
    marginRight: 12,
  },
  bannerHeading: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },
  bannerSub: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    lineHeight: 15,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 6,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryPillActive: {
    backgroundColor: '#9333ea',
    borderColor: '#c084fc',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  floatingMiniPlayer: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#180f2e',
    borderWidth: 1.5,
    borderColor: '#c084fc',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  miniPlayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  miniPlayingIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniInfo: {
    flex: 1,
  },
  miniTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  miniStatus: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  miniControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#c084fc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtn: {
    padding: 6,
  },
});
