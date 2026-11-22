import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Settings, Shield, Sparkles } from 'lucide-react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { triggerHaptic } from '@/utils/haptics';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showSettings?: boolean;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showSettings = true,
  rightAction,
}) => {
  const { theme } = useThemeStore();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.logoRow}>
          <Image
            source={require('@/assets/brand_logo.png')}
            style={styles.logoThumb}
            resizeMode="contain"
          />
          <View>
            <View style={styles.brandRow}>
              <Text style={[styles.brandText, { color: theme.primary }]}>
                MR EPIC STREAM BUDDY
              </Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          </View>
        </View>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.textDim }]}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.right}>
        {rightAction ? (
          rightAction
        ) : showSettings ? (
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              router.push('/settings');
            }}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: theme.card, borderColor: theme.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Settings size={20} color={theme.textDim} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  left: {
    flex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoThumb: {
    width: 36,
    height: 36,
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  innerHole: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(77, 255, 136, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#4dff88',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4dff88',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
