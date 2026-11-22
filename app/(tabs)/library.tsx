import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  Modal,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  Music,
  FolderOpen,
  Play,
  Pause,
  Repeat,
  RotateCcw,
  RotateCw,
  Trash2,
  ExternalLink,
  Plus,
  Film,
  Search,
  Volume2,
  X,
  Sparkles,
  Radio,
  Headphones,
  Sliders,
  ShieldCheck,
  Disc,
} from 'lucide-react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { useAudioStore } from '@/store/useAudioStore';
import { useLocalMediaStore, LocalMediaFile } from '@/store/useLocalMediaStore';
import { Card } from '@/components/common/Card';
import { InputField } from '@/components/forms/InputField';
import { triggerHaptic } from '@/utils/haptics';

const { width } = Dimensions.get('window');

type MusicHubSection = 'local' | 'spotify' | 'audiomack' | 'youtube';

interface CuratedPlaylist {
  title: string;
  genre: string;
  description: string;
  iconName: string;
  appUri: string;
  webUrl: string;
}

export default function StreamerMusicHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const {
    currentSound,
    isPlaying,
    positionMs,
    durationMs,
    isLooping,
    togglePlayPause,
    stopSound,
    playSound,
    seekTo,
    toggleLoop,
  } = useAudioStore();

  const { files, addFile, removeFile, clearFiles } = useLocalMediaStore();

  const [activeSection, setActiveSection] = useState<MusicHubSection>('local');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<LocalMediaFile | null>(null);

  // Video player hook for previewing local video files
  const videoSource = selectedVideo ? selectedVideo.uri : null;
  const videoPlayer = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.play();
  });

  // Animated EQ bars for active playback
  const eqAnim1 = useRef(new Animated.Value(6)).current;
  const eqAnim2 = useRef(new Animated.Value(14)).current;
  const eqAnim3 = useRef(new Animated.Value(10)).current;
  const eqAnim4 = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(eqAnim1, { toValue: 22, duration: 240, useNativeDriver: false }),
          Animated.timing(eqAnim1, { toValue: 6, duration: 240, useNativeDriver: false }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(eqAnim2, { toValue: 26, duration: 310, useNativeDriver: false }),
          Animated.timing(eqAnim2, { toValue: 8, duration: 310, useNativeDriver: false }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(eqAnim3, { toValue: 18, duration: 200, useNativeDriver: false }),
          Animated.timing(eqAnim3, { toValue: 5, duration: 200, useNativeDriver: false }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(eqAnim4, { toValue: 24, duration: 270, useNativeDriver: false }),
          Animated.timing(eqAnim4, { toValue: 10, duration: 270, useNativeDriver: false }),
        ])
      ).start();
    } else {
      eqAnim1.setValue(6);
      eqAnim2.setValue(12);
      eqAnim3.setValue(8);
      eqAnim4.setValue(14);
    }
  }, [isPlaying]);

  // Helper to launch app scheme or fall back to web URL
  const launchExternalUrl = async (appUri: string, webUrl: string) => {
    triggerHaptic('medium');
    try {
      const canOpen = await Linking.canOpenURL(appUri).catch(() => false);
      if (canOpen) {
        await Linking.openURL(appUri);
        return;
      }
      await Linking.openURL(webUrl);
    } catch {
      await Linking.openURL(webUrl).catch(() => {
        Alert.alert('Unable to Open Link', 'Please check your browser settings or internet connection.');
      });
    }
  };

  // Pick local audio or video file from device
  const handlePickLocalMedia = async () => {
    triggerHaptic('light');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*', 'video/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVideo =
          asset.mimeType?.startsWith('video/') ||
          /\.(mp4|mov|mkv|webm|avi|m4v|3gp)$/i.test(asset.name);

        const newFile: LocalMediaFile = {
          id: 'local_' + Date.now(),
          name: asset.name,
          uri: asset.uri,
          size: asset.size,
          mimeType: asset.mimeType || (isVideo ? 'video/mp4' : 'audio/mpeg'),
          type: isVideo ? 'video' : 'audio',
          addedAt: Date.now(),
        };

        await addFile(newFile);
        triggerHaptic('success');
      }
    } catch (err: any) {
      console.warn('Document picker error:', err);
      Alert.alert('File Picker Error', err?.message || 'Could not pick file');
    }
  };

  // Play local audio track
  const handlePlayLocalFile = (file: LocalMediaFile) => {
    triggerHaptic('medium');
    if (file.type === 'video') {
      // Pause any active audio stream and open video viewer
      stopSound();
      setSelectedVideo(file);
      return;
    }

    // Play local audio via useAudioStore (loudspeaker enabled)
    playSound({
      id: parseInt(file.id.replace('local_', ''), 10) || Date.now(),
      name: file.name,
      file_path: file.uri,
      description: 'Local Device Audio Track',
      category: 'Local Music',
      download_url: file.uri,
      thumbnail: null,
      created_at: new Date().toISOString(),
    });
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format time (ms -> m:ss)
  const formatTime = (ms: number) => {
    if (!ms || ms <= 0) return '0:00';
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Progress percentage
  const progressPercent = durationMs > 0 ? Math.min(100, (positionMs / durationMs) * 100) : 0;

  // Curated Spotify Playlists for Streamers
  const spotifyCurations: CuratedPlaylist[] = [
    {
      title: 'Streamer Lofi Beats',
      genre: 'Chillhop / Instrumental',
      description: 'Copyright-safe chill background beats for talking & gaming streams',
      iconName: 'Headphones',
      appUri: 'spotify:search:streamer%20lofi%20beats',
      webUrl: 'https://open.spotify.com/search/streamer%20lofi%20beats',
    },
    {
      title: 'Gaming Energy EDM & Trap',
      genre: 'High-Tempo Gaming',
      description: 'Upbeat electronic beats to hype up clutch moments and chat',
      iconName: 'Sparkles',
      appUri: 'spotify:search:gaming%20edm',
      webUrl: 'https://open.spotify.com/search/gaming%20edm',
    },
    {
      title: 'No Copyright Stream Music',
      genre: 'DMCA Safe',
      description: 'Verified royalty-free stream tracks safe for VODs and clips',
      iconName: 'ShieldCheck',
      appUri: 'spotify:search:no%20copyright%20stream%20music',
      webUrl: 'https://open.spotify.com/search/no%20copyright%20stream%20music',
    },
    {
      title: 'Synthwave & Retrowave 80s',
      genre: 'Retro Future',
      description: 'Neon synth basslines for cyber and late night streams',
      iconName: 'Radio',
      appUri: 'spotify:search:synthwave%20radio',
      webUrl: 'https://open.spotify.com/search/synthwave%20radio',
    },
  ];

  // Curated Audiomack Playlists for Streamers
  const audiomackCurations: CuratedPlaylist[] = [
    {
      title: 'Trending Stream Anthems',
      genre: 'Hip-Hop / Rap / Viral',
      description: 'Hottest trending tracks on Audiomack for viral TikTok & Kick streams',
      iconName: 'Disc',
      appUri: 'audiomack://trending',
      webUrl: 'https://audiomack.com/trending',
    },
    {
      title: 'Royalty-Free Beats & Freestyles',
      genre: 'Instrumental',
      description: 'Underground instrumental beats for live talk, rap & chill sessions',
      iconName: 'Headphones',
      appUri: 'audiomack://search?q=royalty%20free%20beats',
      webUrl: 'https://audiomack.com/search?q=royalty%20free%20beats',
    },
    {
      title: 'Afrobeat & Live Rhythms',
      genre: 'Afrobeat / Dancehall',
      description: 'High energy African and Caribbean dance tracks for live hype vibes',
      iconName: 'Sparkles',
      appUri: 'audiomack://songs/afrobeat',
      webUrl: 'https://audiomack.com/songs/afrobeat',
    },
  ];

  // Curated YouTube Music Playlists for Streamers
  const youtubeCurations: CuratedPlaylist[] = [
    {
      title: 'NoCopyrightSounds (NCS)',
      genre: '100% Stream Safe EDM',
      description: 'World-famous NCS copyright-free tracks safe for all streaming platforms',
      iconName: 'ShieldCheck',
      appUri: 'youtubemusic://search?q=nocopyrightsounds',
      webUrl: 'https://music.youtube.com/search?q=nocopyrightsounds',
    },
    {
      title: 'StreamBeats by Harris Heller',
      genre: 'DMCA-Safe BGM',
      description: 'Original music produced specifically for creators and live streamers',
      iconName: 'Disc',
      appUri: 'youtubemusic://search?q=stream+beats+harris+heller',
      webUrl: 'https://music.youtube.com/search?q=stream+beats+harris+heller',
    },
    {
      title: 'Lofi Girl - Chill Beats Live',
      genre: 'Lofi Radio',
      description: 'Iconic lofi study and stream radio stream for cozy broadcasts',
      iconName: 'Headphones',
      appUri: 'youtubemusic://search?q=lofi+girl',
      webUrl: 'https://music.youtube.com/search?q=lofi+girl',
    },
    {
      title: 'Epic Gaming Radio Mix',
      genre: 'Bass & Glitch Hop',
      description: 'Adrenaline pumping gameplay tunes for FPS and battle royale streams',
      iconName: 'Radio',
      appUri: 'youtubemusic://search?q=epic+gaming+music',
      webUrl: 'https://music.youtube.com/search?q=epic+gaming+music',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg || '#070414', paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerTitle}>Stream Music Hub</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textDim || 'rgba(255,255,255,0.6)' }]}>
            Local Music & Video · Spotify · Audiomack · YouTube Music
          </Text>
        </View>

        {isPlaying && (
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              stopSound();
            }}
            style={styles.headerStopBtn}
          >
            <View style={styles.pulsingRedDot} />
            <Text style={styles.headerStopText}>STOP</Text>
          </Pressable>
        )}
      </View>

      {/* 4-Section Segment Switcher */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabSwitcherScroll}
      >
        {/* 1. Local Files */}
        <Pressable
          onPress={() => {
            triggerHaptic('selection');
            setActiveSection('local');
          }}
          style={[
            styles.sectionTabBtn,
            activeSection === 'local' && [
              styles.sectionTabBtnActive,
              { backgroundColor: theme.primary, borderColor: theme.primary },
            ],
          ]}
        >
          <FolderOpen
            size={16}
            color={activeSection === 'local' ? '#ffffff' : 'rgba(255,255,255,0.6)'}
          />
          <Text
            style={[
              styles.sectionTabText,
              activeSection === 'local' && styles.sectionTabTextActive,
            ]}
          >
            Local Files ({files.length})
          </Text>
        </Pressable>

        {/* 2. Spotify */}
        <Pressable
          onPress={() => {
            triggerHaptic('selection');
            setActiveSection('spotify');
          }}
          style={[
            styles.sectionTabBtn,
            activeSection === 'spotify' && [
              styles.sectionTabBtnActive,
              { backgroundColor: '#1DB954', borderColor: '#1DB954' },
            ],
          ]}
        >
          <Disc
            size={16}
            color={activeSection === 'spotify' ? '#ffffff' : '#1DB954'}
          />
          <Text
            style={[
              styles.sectionTabText,
              activeSection === 'spotify' && styles.sectionTabTextActive,
            ]}
          >
            Spotify
          </Text>
        </Pressable>

        {/* 3. Audiomack */}
        <Pressable
          onPress={() => {
            triggerHaptic('selection');
            setActiveSection('audiomack');
          }}
          style={[
            styles.sectionTabBtn,
            activeSection === 'audiomack' && [
              styles.sectionTabBtnActive,
              { backgroundColor: '#FFA200', borderColor: '#FFA200' },
            ],
          ]}
        >
          <Headphones
            size={16}
            color={activeSection === 'audiomack' ? '#ffffff' : '#FFA200'}
          />
          <Text
            style={[
              styles.sectionTabText,
              activeSection === 'audiomack' && styles.sectionTabTextActive,
            ]}
          >
            Audiomack
          </Text>
        </Pressable>

        {/* 4. YouTube Music */}
        <Pressable
          onPress={() => {
            triggerHaptic('selection');
            setActiveSection('youtube');
          }}
          style={[
            styles.sectionTabBtn,
            activeSection === 'youtube' && [
              styles.sectionTabBtnActive,
              { backgroundColor: '#FF0000', borderColor: '#FF0000' },
            ],
          ]}
        >
          <Radio
            size={16}
            color={activeSection === 'youtube' ? '#ffffff' : '#FF0000'}
          />
          <Text
            style={[
              styles.sectionTabText,
              activeSection === 'youtube' && styles.sectionTabTextActive,
            ]}
          >
            YouTube Music
          </Text>
        </Pressable>
      </ScrollView>

      {/* Main Body Content based on active section */}
      <ScrollView
        contentContainerStyle={[
          styles.mainContentScroll,
          { paddingBottom: currentSound ? insets.bottom + 170 : insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= SECTION 1: LOCAL MEDIA ================= */}
        {activeSection === 'local' && (
          <View style={styles.sectionContainer}>
            {/* Pick Media Action Card */}
            <Pressable
              onPress={handlePickLocalMedia}
              style={({ pressed }) => [
                styles.uploadCardWrap,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <LinearGradient
                colors={[theme.primary || '#9333ea', theme.vibrant || '#d946ef']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.uploadCardGradient}
              >
                <View style={styles.uploadCardLeft}>
                  <View style={styles.uploadIconCircle}>
                    <Plus size={22} color="#ffffff" strokeWidth={3} />
                  </View>
                  <View style={styles.uploadCardInfo}>
                    <Text style={styles.uploadCardTitle}>Add Local Music or Video</Text>
                    <Text style={styles.uploadCardSub}>
                      MP3, WAV, AAC, M4A, FLAC, MP4, MOV, MKV
                    </Text>
                  </View>
                </View>
                <View style={styles.uploadBadge}>
                  <Text style={styles.uploadBadgeText}>CHOOSE FILE</Text>
                </View>
              </LinearGradient>
            </Pressable>

            {/* Local Playlist Header */}
            <View style={styles.subHeaderRow}>
              <View style={styles.subHeaderLeft}>
                <Music size={16} color={theme.primary || '#c084fc'} />
                <Text style={styles.subHeaderTitle}>Your Device Media Playlist</Text>
              </View>
              {files.length > 0 && (
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      'Clear Playlist',
                      'Remove all media files from this playlist? (Your actual device files will not be deleted)',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Clear All', style: 'destructive', onPress: clearFiles },
                      ]
                    );
                  }}
                >
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              )}
            </View>

            {/* List of Picked Media Files */}
            {files.length === 0 ? (
              <Card style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <FolderOpen size={36} color={theme.primary || '#c084fc'} />
                </View>
                <Text style={styles.emptyTitle}>No Media Added Yet</Text>
                <Text style={styles.emptySub}>
                  Tap "+ Add Local Music or Video" above to select audio tracks or video clips from your phone storage to play live during stream.
                </Text>
              </Card>
            ) : (
              files.map((file) => {
                const isThisPlaying =
                  currentSound?.download_url === file.uri ||
                  (currentSound as any)?.file_path === file.uri;
                const isVideo = file.type === 'video';

                return (
                  <Card
                    key={file.id}
                    style={[
                      styles.mediaItemCard,
                      isThisPlaying && [
                        styles.mediaItemCardActive,
                        { borderColor: '#10b981' },
                      ],
                    ]}
                  >
                    <View style={styles.mediaItemRow}>
                      {/* Media Icon & Type Tag */}
                      <View
                        style={[
                          styles.mediaTypeIconBox,
                          isVideo
                            ? { backgroundColor: 'rgba(56, 189, 248, 0.15)' }
                            : { backgroundColor: 'rgba(168, 85, 247, 0.15)' },
                        ]}
                      >
                        {isVideo ? (
                          <Film size={20} color="#38bdf8" />
                        ) : (
                          <Music size={20} color="#c084fc" />
                        )}
                        <Text
                          style={[
                            styles.mediaTypeTag,
                            { color: isVideo ? '#38bdf8' : '#c084fc' },
                          ]}
                        >
                          {isVideo ? 'VIDEO' : 'AUDIO'}
                        </Text>
                      </View>

                      {/* Info */}
                      <View style={styles.mediaItemInfo}>
                        <Text style={styles.mediaItemName} numberOfLines={1}>
                          {file.name}
                        </Text>
                        <Text style={styles.mediaItemMeta}>
                          {formatFileSize(file.size)} {file.mimeType ? `· ${file.mimeType}` : ''}
                        </Text>
                      </View>

                      {/* Action buttons */}
                      <View style={styles.mediaItemActions}>
                        <Pressable
                          onPress={() => handlePlayLocalFile(file)}
                          style={[
                            styles.mediaPlayBtn,
                            isThisPlaying
                              ? { backgroundColor: '#10b981' }
                              : { backgroundColor: theme.primary || '#9333ea' },
                          ]}
                        >
                          {isThisPlaying && isPlaying ? (
                            <Pause size={16} color="#ffffff" />
                          ) : (
                            <Play size={16} color="#ffffff" fill="#ffffff" />
                          )}
                        </Pressable>

                        <Pressable
                          onPress={() => {
                            triggerHaptic('light');
                            removeFile(file.id);
                          }}
                          style={styles.mediaDeleteBtn}
                        >
                          <Trash2 size={16} color="rgba(255, 255, 255, 0.45)" />
                        </Pressable>
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* ================= SECTION 2: SPOTIFY ================= */}
        {activeSection === 'spotify' && (
          <View style={styles.sectionContainer}>
            {/* Spotify Hero Banner */}
            <Card style={[styles.heroBrandCard, { borderColor: 'rgba(29, 185, 84, 0.3)' }]}>
              <View style={styles.heroBrandTop}>
                <View style={styles.heroBrandLeft}>
                  <View style={[styles.brandIconCircle, { backgroundColor: '#1DB954' }]}>
                    <Disc size={24} color="#ffffff" />
                  </View>
                  <View>
                    <Text style={styles.brandTitle}>Spotify Streaming</Text>
                    <Text style={styles.brandSubtitle}>
                      Live background music for your streams
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => launchExternalUrl('spotify://', 'https://open.spotify.com')}
                  style={[styles.launchAppBtn, { backgroundColor: '#1DB954' }]}
                >
                  <Text style={styles.launchAppText}>Open App</Text>
                  <ExternalLink size={13} color="#ffffff" />
                </Pressable>
              </View>

              {/* Search or Paste Link Launcher */}
              <View style={styles.urlLauncherBox}>
                <InputField
                  placeholder="Search Spotify song or paste track/playlist URL..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  icon={<Search size={16} color="#1DB954" />}
                />
                <Pressable
                  onPress={() => {
                    const q = searchQuery.trim();
                    if (!q) {
                      launchExternalUrl('spotify://', 'https://open.spotify.com');
                      return;
                    }
                    if (q.startsWith('http') || q.startsWith('spotify:')) {
                      launchExternalUrl(q, q);
                    } else {
                      launchExternalUrl(
                        `spotify:search:${encodeURIComponent(q)}`,
                        `https://open.spotify.com/search/${encodeURIComponent(q)}`
                      );
                    }
                  }}
                  style={[styles.searchSubmitBtn, { backgroundColor: '#1DB954' }]}
                >
                  <Text style={styles.searchSubmitBtnText}>Launch in Spotify</Text>
                </Pressable>
              </View>
            </Card>

            {/* Curated Stream Playlists */}
            <Text style={styles.curatedSectionHeader}>Streamer Recommended Playlists</Text>
            {spotifyCurations.map((item, idx) => (
              <Card key={idx} style={styles.curatedCard}>
                <View style={styles.curatedRow}>
                  <View style={[styles.curatedIconBox, { backgroundColor: 'rgba(29, 185, 84, 0.15)' }]}>
                    <Headphones size={20} color="#1DB954" />
                  </View>
                  <View style={styles.curatedInfo}>
                    <Text style={styles.curatedTitle}>{item.title}</Text>
                    <Text style={styles.curatedGenre}>{item.genre}</Text>
                    <Text style={styles.curatedDesc}>{item.description}</Text>
                  </View>
                  <Pressable
                    onPress={() => launchExternalUrl(item.appUri, item.webUrl)}
                    style={[styles.playExternalBtn, { backgroundColor: '#1DB954' }]}
                  >
                    <Play size={14} color="#ffffff" fill="#ffffff" />
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* ================= SECTION 3: AUDIOMACK ================= */}
        {activeSection === 'audiomack' && (
          <View style={styles.sectionContainer}>
            {/* Audiomack Hero Banner */}
            <Card style={[styles.heroBrandCard, { borderColor: 'rgba(255, 162, 0, 0.3)' }]}>
              <View style={styles.heroBrandTop}>
                <View style={styles.heroBrandLeft}>
                  <View style={[styles.brandIconCircle, { backgroundColor: '#FFA200' }]}>
                    <Headphones size={24} color="#000000" />
                  </View>
                  <View>
                    <Text style={styles.brandTitle}>Audiomack Streaming</Text>
                    <Text style={styles.brandSubtitle}>
                      Trending beats, hip-hop, afrobeat & mixtapes
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => launchExternalUrl('audiomack://', 'https://audiomack.com')}
                  style={[styles.launchAppBtn, { backgroundColor: '#FFA200' }]}
                >
                  <Text style={[styles.launchAppText, { color: '#000000' }]}>Open App</Text>
                  <ExternalLink size={13} color="#000000" />
                </Pressable>
              </View>

              {/* Search or Paste Link Launcher */}
              <View style={styles.urlLauncherBox}>
                <InputField
                  placeholder="Search Audiomack for songs, beats, or artists..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  icon={<Search size={16} color="#FFA200" />}
                />
                <Pressable
                  onPress={() => {
                    const q = searchQuery.trim();
                    if (!q) {
                      launchExternalUrl('audiomack://', 'https://audiomack.com');
                      return;
                    }
                    if (q.startsWith('http') || q.startsWith('audiomack:')) {
                      launchExternalUrl(q, q);
                    } else {
                      launchExternalUrl(
                        `audiomack://search?q=${encodeURIComponent(q)}`,
                        `https://audiomack.com/search?q=${encodeURIComponent(q)}`
                      );
                    }
                  }}
                  style={[styles.searchSubmitBtn, { backgroundColor: '#FFA200' }]}
                >
                  <Text style={[styles.searchSubmitBtnText, { color: '#000000' }]}>
                    Launch in Audiomack
                  </Text>
                </Pressable>
              </View>
            </Card>

            {/* Curated Audiomack Playlists */}
            <Text style={styles.curatedSectionHeader}>Streamer Recommended Playlists</Text>
            {audiomackCurations.map((item, idx) => (
              <Card key={idx} style={styles.curatedCard}>
                <View style={styles.curatedRow}>
                  <View style={[styles.curatedIconBox, { backgroundColor: 'rgba(255, 162, 0, 0.15)' }]}>
                    <Disc size={20} color="#FFA200" />
                  </View>
                  <View style={styles.curatedInfo}>
                    <Text style={styles.curatedTitle}>{item.title}</Text>
                    <Text style={[styles.curatedGenre, { color: '#FFA200' }]}>{item.genre}</Text>
                    <Text style={styles.curatedDesc}>{item.description}</Text>
                  </View>
                  <Pressable
                    onPress={() => launchExternalUrl(item.appUri, item.webUrl)}
                    style={[styles.playExternalBtn, { backgroundColor: '#FFA200' }]}
                  >
                    <Play size={14} color="#000000" fill="#000000" />
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* ================= SECTION 4: YOUTUBE MUSIC ================= */}
        {activeSection === 'youtube' && (
          <View style={styles.sectionContainer}>
            {/* YouTube Music Hero Banner */}
            <Card style={[styles.heroBrandCard, { borderColor: 'rgba(255, 0, 0, 0.3)' }]}>
              <View style={styles.heroBrandTop}>
                <View style={styles.heroBrandLeft}>
                  <View style={[styles.brandIconCircle, { backgroundColor: '#FF0000' }]}>
                    <Radio size={24} color="#ffffff" />
                  </View>
                  <View>
                    <Text style={styles.brandTitle}>YouTube Music</Text>
                    <Text style={styles.brandSubtitle}>
                      NCS, StreamBeats, 24/7 Gaming Radios & Playlists
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => launchExternalUrl('youtubemusic://', 'https://music.youtube.com')}
                  style={[styles.launchAppBtn, { backgroundColor: '#FF0000' }]}
                >
                  <Text style={styles.launchAppText}>Open App</Text>
                  <ExternalLink size={13} color="#ffffff" />
                </Pressable>
              </View>

              {/* Search or Paste Link Launcher */}
              <View style={styles.urlLauncherBox}>
                <InputField
                  placeholder="Search YouTube Music for stream radio or tracks..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  icon={<Search size={16} color="#FF0000" />}
                />
                <Pressable
                  onPress={() => {
                    const q = searchQuery.trim();
                    if (!q) {
                      launchExternalUrl('youtubemusic://', 'https://music.youtube.com');
                      return;
                    }
                    if (q.startsWith('http') || q.startsWith('youtubemusic:')) {
                      launchExternalUrl(q, q);
                    } else {
                      launchExternalUrl(
                        `youtubemusic://search?q=${encodeURIComponent(q)}`,
                        `https://music.youtube.com/search?q=${encodeURIComponent(q)}`
                      );
                    }
                  }}
                  style={[styles.searchSubmitBtn, { backgroundColor: '#FF0000' }]}
                >
                  <Text style={styles.searchSubmitBtnText}>Launch in YouTube Music</Text>
                </Pressable>
              </View>
            </Card>

            {/* Curated YouTube Music Playlists */}
            <Text style={styles.curatedSectionHeader}>Streamer Recommended Playlists</Text>
            {youtubeCurations.map((item, idx) => (
              <Card key={idx} style={styles.curatedCard}>
                <View style={styles.curatedRow}>
                  <View style={[styles.curatedIconBox, { backgroundColor: 'rgba(255, 0, 0, 0.15)' }]}>
                    <Radio size={20} color="#FF0000" />
                  </View>
                  <View style={styles.curatedInfo}>
                    <Text style={styles.curatedTitle}>{item.title}</Text>
                    <Text style={[styles.curatedGenre, { color: '#FF0000' }]}>{item.genre}</Text>
                    <Text style={styles.curatedDesc}>{item.description}</Text>
                  </View>
                  <Pressable
                    onPress={() => launchExternalUrl(item.appUri, item.webUrl)}
                    style={[styles.playExternalBtn, { backgroundColor: '#FF0000' }]}
                  >
                    <Play size={14} color="#ffffff" fill="#ffffff" />
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Active Player Dock (When Local Audio is playing) */}
      {currentSound && (
        <View
          style={[
            styles.activePlayerDock,
            {
              backgroundColor: '#110726',
              borderColor: theme.border || 'rgba(168, 85, 247, 0.35)',
              bottom: insets.bottom + 70,
            },
          ]}
        >
          {/* Progress Bar Track */}
          <Pressable
            onPress={(e) => {
              if (durationMs > 0) {
                const clickX = e.nativeEvent.locationX;
                const ratio = Math.max(0, Math.min(1, clickX / (width - 40)));
                seekTo(ratio * durationMs);
              }
            }}
            style={styles.scrubTrack}
          >
            <View style={[styles.scrubFill, { width: `${progressPercent}%`, backgroundColor: theme.primary || '#a855f7' }]} />
          </Pressable>

          {/* Player Main Info & Controls */}
          <View style={styles.dockRow}>
            {/* Left: Waveform & Title */}
            <View style={styles.dockLeft}>
              <View style={styles.liveEqWrap}>
                <Animated.View style={[styles.eqMiniBar, { height: eqAnim1, backgroundColor: '#34d399' }]} />
                <Animated.View style={[styles.eqMiniBar, { height: eqAnim2, backgroundColor: theme.primary || '#a855f7' }]} />
                <Animated.View style={[styles.eqMiniBar, { height: eqAnim3, backgroundColor: '#38bdf8' }]} />
                <Animated.View style={[styles.eqMiniBar, { height: eqAnim4, backgroundColor: '#f43f5e' }]} />
              </View>
              <View style={styles.dockTitles}>
                <Text style={styles.dockTrackName} numberOfLines={1}>
                  {currentSound.name}
                </Text>
                <Text style={styles.dockTimeText}>
                  {formatTime(positionMs)} / {formatTime(durationMs)} · PHONE SPEAKER
                </Text>
              </View>
            </View>

            {/* Right: Controls */}
            <View style={styles.dockControls}>
              {/* -10s */}
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  seekTo(Math.max(0, positionMs - 10000));
                }}
                style={styles.dockMiniBtn}
              >
                <RotateCcw size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>

              {/* Play / Pause */}
              <Pressable
                onPress={() => {
                  triggerHaptic('medium');
                  togglePlayPause();
                }}
                style={[styles.dockMainPlayBtn, { backgroundColor: theme.primary || '#9333ea' }]}
              >
                {isPlaying ? (
                  <Pause size={18} color="#ffffff" />
                ) : (
                  <Play size={18} color="#ffffff" fill="#ffffff" />
                )}
              </Pressable>

              {/* +10s */}
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  seekTo(Math.min(durationMs, positionMs + 10000));
                }}
                style={styles.dockMiniBtn}
              >
                <RotateCw size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>

              {/* Loop Repeat Toggle */}
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  toggleLoop();
                }}
                style={[
                  styles.dockMiniBtn,
                  isLooping && { backgroundColor: 'rgba(52, 211, 153, 0.25)', borderRadius: 6 },
                ]}
              >
                <Repeat size={16} color={isLooping ? '#34d399' : 'rgba(255,255,255,0.45)'} />
              </Pressable>

              {/* Stop & Dismiss */}
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  stopSound();
                }}
                style={styles.dockMiniBtn}
              >
                <X size={18} color="rgba(255,255,255,0.6)" />
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Video Player Modal (When a local video file is chosen) */}
      <Modal
        visible={!!selectedVideo}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedVideo(null)}
      >
        <View style={styles.videoModalContainer}>
          <View style={styles.videoModalHeader}>
            <View style={styles.videoModalTitleWrap}>
              <Film size={18} color="#38bdf8" />
              <Text style={styles.videoModalTitle} numberOfLines={1}>
                {selectedVideo?.name}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                setSelectedVideo(null);
              }}
              style={styles.videoModalCloseBtn}
            >
              <X size={20} color="#ffffff" />
            </Pressable>
          </View>

          <View style={styles.videoPlayerWrap}>
            {selectedVideo && (
              <VideoView
                player={videoPlayer}
                style={styles.videoView}
                nativeControls
                contentFit="contain"
              />
            )}
          </View>

          <View style={styles.videoModalFooter}>
            <View style={styles.videoBadge}>
              <Text style={styles.videoBadgeText}>LOCAL STREAM VIDEO CLIP</Text>
            </View>
            <Text style={styles.videoFooterTip}>
              Use native player controls to adjust volume, scrub, or enter fullscreen during live broadcast.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  headerStopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pulsingRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  headerStopText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '900',
  },
  tabSwitcherScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  sectionTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  sectionTabBtnActive: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sectionTabText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTabTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  mainContentScroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  sectionContainer: {
    gap: 14,
  },
  uploadCardWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  uploadCardGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  uploadCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCardInfo: {
    flex: 1,
  },
  uploadCardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  uploadCardSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  uploadBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  uploadBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  subHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subHeaderTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  clearText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
    gap: 10,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  mediaItemCard: {
    padding: 12,
  },
  mediaItemCardActive: {
    borderWidth: 1.5,
    backgroundColor: '#0a1d17',
  },
  mediaItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mediaTypeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaTypeTag: {
    fontSize: 8,
    fontWeight: '900',
    marginTop: 2,
  },
  mediaItemInfo: {
    flex: 1,
  },
  mediaItemName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  mediaItemMeta: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500',
  },
  mediaItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mediaPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  heroBrandCard: {
    padding: 16,
    gap: 14,
  },
  heroBrandTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBrandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  brandIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  brandSubtitle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  launchAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  launchAppText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  urlLauncherBox: {
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchSubmitBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  curatedSectionHeader: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: -4,
  },
  curatedCard: {
    padding: 14,
  },
  curatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  curatedIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  curatedInfo: {
    flex: 1,
  },
  curatedTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  curatedGenre: {
    color: '#1DB954',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  curatedDesc: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  playExternalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePlayerDock: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  scrubTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  scrubFill: {
    height: '100%',
  },
  dockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  liveEqWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 24,
  },
  eqMiniBar: {
    width: 3.5,
    borderRadius: 2,
  },
  dockTitles: {
    flex: 1,
  },
  dockTrackName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  dockTimeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  dockControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dockMiniBtn: {
    padding: 6,
  },
  dockMainPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoModalContainer: {
    flex: 1,
    backgroundColor: '#05020a',
  },
  videoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoModalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  videoModalTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  videoModalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayerWrap: {
    width: '100%',
    height: 280,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoView: {
    width: '100%',
    height: '100%',
  },
  videoModalFooter: {
    padding: 20,
    gap: 8,
  },
  videoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  videoBadgeText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '900',
  },
  videoFooterTip: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    lineHeight: 18,
  },
});
