import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/store/useThemeStore';
import { triggerHaptic } from '@/utils/haptics';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const { theme } = useThemeStore();

  const handlePress = () => {
    if (disabled || loading) return;
    triggerHaptic(variant === 'danger' ? 'warning' : 'medium');
    onPress();
  };

  const getHeight = () => {
    if (size === 'sm') return 38;
    if (size === 'lg') return 56;
    return 48;
  };

  const getFontSize = () => {
    if (size === 'sm') return 13;
    if (size === 'lg') return 16;
    return 14;
  };

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.container,
          { height: getHeight(), opacity: disabled ? 0.5 : pressed ? 0.88 : 1 },
          style,
        ]}
      >
        <LinearGradient
          colors={[theme.primary, theme.vibrant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { height: getHeight() }]}
        >
          {loading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <View style={styles.contentRow}>
              {icon && <View style={styles.iconWrap}>{icon}</View>}
              <Text
                style={[
                  styles.primaryText,
                  { fontSize: getFontSize() },
                  textStyle,
                ]}
              >
                {title}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  const getVariantStyles = () => {
    if (variant === 'danger') {
      return {
        backgroundColor: 'rgba(255, 77, 77, 0.12)',
        borderColor: theme.danger,
        textColor: theme.danger,
      };
    }
    if (variant === 'secondary') {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderColor: 'rgba(255, 255, 255, 0.14)',
        textColor: '#ffffff',
      };
    }
    // outline
    return {
      backgroundColor: 'transparent',
      borderColor: theme.border,
      textColor: theme.primary,
    };
  };

  const vStyle = getVariantStyles();

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.outlineButton,
        {
          height: getHeight(),
          backgroundColor: vStyle.backgroundColor,
          borderColor: vStyle.borderColor,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vStyle.textColor} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text
            style={[
              styles.btnText,
              { color: vStyle.textColor, fontSize: getFontSize() },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  outlineButton: {
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    marginRight: 8,
  },
  primaryText: {
    color: '#000000',
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  btnText: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
