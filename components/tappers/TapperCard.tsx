import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Trophy, Trash2 } from 'lucide-react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { TapperCounter } from '@/types';
import { Card } from '@/components/common/Card';
import { triggerHaptic } from '@/utils/haptics';
import { formatCompactNumber, formatRelativeTime } from '@/utils/formatters';

interface TapperCardProps {
  tapper: TapperCounter;
  rank: number;
  onTap: (id: number, currentCount: number) => void;
  onDelete?: (id: number) => void;
}

export const TapperCard: React.FC<TapperCardProps> = ({
  tapper,
  rank,
  onTap,
  onDelete,
}) => {
  const { theme } = useThemeStore();
  const [localCount, setLocalCount] = useState(tapper.count);
  const [isPressing, setIsPressing] = useState(false);

  // Sync with prop when updated
  React.useEffect(() => {
    setLocalCount(tapper.count);
  }, [tapper.count]);

  const handleTap = () => {
    triggerHaptic('heavy');
    setLocalCount((prev) => prev + 1);
    onTap(tapper.id, localCount);
  };

  const getRankColor = () => {
    if (rank === 1) return '#ffd700'; // Gold
    if (rank === 2) return '#c0c0c0'; // Silver
    if (rank === 3) return '#cd7f32'; // Bronze
    return theme.textMuted;
  };

  return (
    <Card variant="glow" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.rankBadge}>
          <Text style={[styles.rankText, { color: getRankColor() }]}>
            #{rank}
          </Text>
        </View>

        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {tapper.name}
          </Text>
          <Text style={[styles.timeText, { color: theme.textMuted }]}>
            Active {formatRelativeTime(tapper.lastTime)}
          </Text>
        </View>

        {onDelete && (
          <Pressable
            onPress={() => onDelete(tapper.id)}
            style={({ pressed }) => [styles.delBtn, pressed && { opacity: 0.5 }]}
          >
            <Trash2 size={16} color={theme.danger} />
          </Pressable>
        )}
      </View>

      <View style={styles.counterRow}>
        <View>
          <Text style={[styles.countLabel, { color: theme.textDim }]}>
            TOTAL TAPS
          </Text>
          <Text style={[styles.countValue, { color: theme.primary }]}>
            {formatCompactNumber(localCount)}
          </Text>
        </View>

        <Pressable
          onPress={handleTap}
          onPressIn={() => setIsPressing(true)}
          onPressOut={() => setIsPressing(false)}
          style={({ pressed }) => [
            styles.tapButtonWrapper,
            (pressed || isPressing) && styles.tapButtonPressed,
          ]}
        >
          <LinearGradient
            colors={[theme.primary, theme.vibrant]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tapButtonGradient}
          >
            <Flame size={20} color="#000" />
            <Text style={styles.tapButtonText}>+1 TAP</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '900',
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
    marginTop: 2,
  },
  delBtn: {
    padding: 6,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  countValue: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  tapButtonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  tapButtonPressed: {
    transform: [{ scale: 0.94 }],
  },
  tapButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  tapButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
