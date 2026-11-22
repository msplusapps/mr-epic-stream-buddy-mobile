import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Play, Pause, Music, Download, Trash2, Check, Volume2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/store/useThemeStore';
import { useAudioStore } from '@/store/useAudioStore';
import { SoundAsset } from '@/types';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { triggerHaptic } from '@/utils/haptics';

interface SoundCardProps {
  sound: SoundAsset;
  onLongPress?: () => void;
  isDownloaded?: boolean;
  onDownload?: () => void;
  onRemove?: () => void;
  showStoreActions?: boolean;
}

export const SoundCard: React.FC<SoundCardProps> = ({
  sound,
  onLongPress,
  isDownloaded = false,
  onDownload,
  onRemove,
  showStoreActions = false,
}) => {
  const { theme } = useThemeStore();
  const { currentSound, isPlaying, playSound, positionMs, durationMs } = useAudioStore();

  const isCurrent = currentSound?.id === sound.id;
  const isPlayingThis = isCurrent && isPlaying;

  const handlePlayToggle = async () => {
    triggerHaptic('medium');
    await playSound(sound);
  };

  const progressPercent =
    isPlayingThis && durationMs > 0 ? Math.min(100, (positionMs / durationMs) * 100) : 0;

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Card
      active={isPlayingThis}
      variant={isPlayingThis ? 'glow' : 'default'}
      style={styles.card}
    >
      <View style={styles.contentWrap}>
        {/* Top Info Line */}
        <View style={styles.topRow}>
          {/* Big Play / Preview Trigger Button */}
          <Pressable
            onPress={handlePlayToggle}
            style={({ pressed }) => [
              styles.iconBox,
              {
                backgroundColor: isPlayingThis ? '#9333ea' : 'rgba(255, 255, 255, 0.08)',
                borderColor: isPlayingThis ? '#c084fc' : 'rgba(255, 255, 255, 0.15)',
              },
              pressed && { transform: [{ scale: 0.94 }] },
            ]}
          >
            {isPlayingThis ? (
              <Pause size={20} color="#ffffff" />
            ) : (
              <Play size={20} color="#ffffff" style={{ marginLeft: 3 }} />
            )}
          </Pressable>

          <View style={styles.infoCol}>
            <View style={styles.titleBadgeRow}>
              <Text
                numberOfLines={1}
                style={[
                  styles.name,
                  { color: isPlayingThis ? '#c084fc' : '#ffffff' },
                ]}
              >
                {sound.name}
              </Text>
              <Badge label={sound.category || 'General'} variant="primary" />
            </View>

            {sound.description ? (
              <Text numberOfLines={1} style={styles.desc}>
                {sound.description}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Live Playback progress bar */}
        {isPlayingThis && (
          <View style={styles.playbackSection}>
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: '#c084fc',
                  },
                ]}
              />
            </View>
            <View style={styles.timeRow}>
              <View style={styles.speakerIndicator}>
                <Volume2 size={12} color="#34d399" />
                <Text style={styles.speakerText}>Playing through speaker</Text>
              </View>
              <Text style={styles.timeText}>
                {formatTime(positionMs)} / {formatTime(durationMs || 3500)}
              </Text>
            </View>
          </View>
        )}

        {/* Bottom Actions Row: Preview Button + Store / Library Action Controls */}
        <View style={styles.bottomActionsRow}>
          {/* Preview Button */}
          <Pressable
            onPress={handlePlayToggle}
            style={({ pressed }) => [
              styles.previewPill,
              isPlayingThis && styles.previewPillActive,
              pressed && { opacity: 0.8 },
            ]}
          >
            {isPlayingThis ? (
              <Pause size={13} color="#c084fc" />
            ) : (
              <Play size={13} color="rgba(255, 255, 255, 0.7)" style={{ marginLeft: 1 }} />
            )}
            <Text
              style={[
                styles.previewPillText,
                isPlayingThis && { color: '#c084fc', fontWeight: '800' },
              ]}
            >
              {isPlayingThis ? 'Pause' : 'Preview'}
            </Text>
          </Pressable>

          {/* Store Actions: Download or In-Library + Remove */}
          {showStoreActions && (
            <View style={styles.actionsRight}>
              {isDownloaded ? (
                <View style={styles.downloadedActionsGroup}>
                  <View style={styles.downloadedBadge}>
                    <Check size={12} color="#34d399" strokeWidth={3} />
                    <Text style={styles.downloadedBadgeText}>In Library</Text>
                  </View>
                  {onRemove && (
                    <Pressable
                      onPress={onRemove}
                      style={({ pressed }) => [
                        styles.removeSmallBtn,
                        pressed && { opacity: 0.7 },
                      ]}
                      hitSlop={8}
                    >
                      <Trash2 size={13} color="#f87171" />
                      <Text style={styles.removeSmallBtnText}>Remove</Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                onDownload && (
                  <Pressable
                    onPress={onDownload}
                    style={({ pressed }) => [
                      styles.downloadBtnWrap,
                      pressed && { transform: [{ scale: 0.96 }] },
                    ]}
                  >
                    <LinearGradient
                      colors={['#9333ea', '#d946ef']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.downloadBtn}
                    >
                      <Download size={14} color="#ffffff" strokeWidth={2.5} />
                      <Text style={styles.downloadBtnText}>Download</Text>
                    </LinearGradient>
                  </Pressable>
                )
              )}
            </View>
          )}

          {/* Library Actions: Remove from Library button (when in My Library view) */}
          {!showStoreActions && onRemove && (
            <Pressable
              onPress={onRemove}
              style={({ pressed }) => [
                styles.removeLibraryBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Trash2 size={13} color="#f87171" />
              <Text style={styles.removeLibraryText}>Remove from Library</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginVertical: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(24, 15, 46, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  contentWrap: {
    width: '100%',
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  desc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
  },
  playbackSection: {
    gap: 4,
    paddingVertical: 2,
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  speakerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  speakerText: {
    fontSize: 10,
    color: '#34d399',
    fontWeight: '600',
  },
  timeText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
  },
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  previewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewPillActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#c084fc',
  },
  previewPillText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadedActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  downloadedBadgeText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  removeSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  removeSmallBtnText: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: '700',
  },
  downloadBtnWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  downloadBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  removeLibraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  removeLibraryText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
  },
});
