import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { triggerHaptic } from '@/utils/haptics';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'glow' | 'flat';
  active?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  active = false,
}) => {
  const { theme } = useThemeStore();

  const getBorderColor = () => {
    if (active) return theme.primary;
    if (variant === 'glow') return theme.border;
    return 'rgba(255, 255, 255, 0.08)';
  };

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: getBorderColor(),
          shadowColor: variant === 'glow' || active ? theme.primary : '#000',
        },
        variant === 'glow' && styles.glow,
        active && { borderColor: theme.primary },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          triggerHaptic('light');
          onPress();
        }}
        style={({ pressed }) => [
          styles.pressable,
          pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginVertical: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  glow: {
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
});
