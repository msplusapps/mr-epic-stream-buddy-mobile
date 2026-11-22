import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/store/useThemeStore';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  progressPercent?: number;
  accentColor?: string;
  style?: ViewStyle;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  progressPercent,
  accentColor,
  style,
  onPress,
}) => {
  const { theme } = useThemeStore();
  const highlight = accentColor || theme.primary;

  return (
    <Card
      onPress={onPress}
      variant="glow"
      style={[styles.container, style]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: `${highlight}18`, borderColor: `${highlight}30` },
          ]}
        >
          {icon}
        </View>
        <Text style={[styles.title, { color: theme.textMuted }]}>{title}</Text>
      </View>

      <Text style={[styles.value, { color: highlight }]}>{value}</Text>

      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.textDim }]}>
          {subtitle}
        </Text>
      )}

      {typeof progressPercent === 'number' && (
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[theme.primary, theme.vibrant]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressFill,
              { width: `${Math.min(100, Math.max(0, progressPercent))}%` },
            ]}
          />
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    minHeight: 125,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 4,
  },
  progressTrack: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});
