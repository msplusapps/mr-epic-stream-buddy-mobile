import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoading, isAuthenticated, isOnboarded } = useAuthStore();
  const { theme } = useThemeStore();

  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    // Spin animation for circular loader
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Fade & scale entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    if (isLoading) return;

    const timer = setTimeout(() => {
      if (!isOnboarded) {
        router.replace('/onboarding');
      } else if (!isAuthenticated) {
        router.replace('/(auth)/login');
      } else {
        router.replace('/(tabs)/dashboard');
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, isOnboarded]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: '#070414' }]}>
      {/* Background Cosmic Violet Glow Arcs */}
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.28)', 'transparent', 'rgba(217, 70, 239, 0.22)']}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topCurvedGlow} />
      <View style={styles.bottomCurvedGlow} />

      {/* Main Center Branding */}
      <Animated.View
        style={[
          styles.centerBox,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('@/assets/brand_logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <Text style={styles.brandTitle}>Mr Epic</Text>
        <Text style={styles.brandSubtitle}>Stream Buddy</Text>

        <Text style={styles.tagline}>...Stream Smarter, Grow Bigger!</Text>
      </Animated.View>

      {/* Bottom Loading Indicator */}
      <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 36 }]}>
        <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
          <View style={styles.spinnerHead} />
        </Animated.View>
        <Text style={styles.loadingText}>Loading your world...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCurvedGlow: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    filter: 'blur(60px)',
  },
  bottomCurvedGlow: {
    position: 'absolute',
    bottom: -100,
    right: -80,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(217, 70, 239, 0.16)',
    filter: 'blur(70px)',
  },
  centerBox: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoImage: {
    width: 130,
    height: 130,
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#c084fc',
    letterSpacing: 0.3,
    marginTop: -2,
  },
  tagline: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginTop: 18,
    letterSpacing: 0.2,
  },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    gap: 12,
  },
  spinner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: 'rgba(192, 132, 252, 0.25)',
    borderTopColor: '#c084fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerHead: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
    position: 'absolute',
    top: 0,
  },
  loadingText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
