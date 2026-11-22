import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  style,
}) => {
  const { theme } = useThemeStore();

  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: 'rgba(77, 255, 136, 0.12)', text: theme.success, border: 'rgba(77, 255, 136, 0.3)' };
      case 'warning':
        return { bg: 'rgba(255, 179, 77, 0.12)', text: theme.warning, border: 'rgba(255, 179, 77, 0.3)' };
      case 'danger':
        return { bg: 'rgba(255, 77, 77, 0.12)', text: theme.danger, border: 'rgba(255, 77, 77, 0.3)' };
      case 'neutral':
        return { bg: 'rgba(255, 255, 255, 0.08)', text: theme.textDim, border: 'rgba(255, 255, 255, 0.12)' };
      case 'primary':
      default:
        return { bg: 'rgba(77, 168, 255, 0.12)', text: theme.primary, border: theme.border };
    }
  };

  const c = getColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.bg, borderColor: c.border },
        style,
      ]}
    >
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
