import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, ArrowRight } from 'lucide-react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { triggerHaptic } from '@/utils/haptics';

const ONBOARDING_SLIDES = [
  {
    titleFirst: 'Instant Sound',
    titleSecond: 'Effects & FX!',
    description:
      'Trigger special effects, airhorns, drops and reactions with one tap right from your phone.',
  },
  {
    titleFirst: 'TikTok Tappers &',
    titleSecond: 'Hype Counters!',
    description:
      'Count your stream taps in real time, track totals per session, and keep your momentum visible.',
  },
  {
    titleFirst: 'Stream Earnings &',
    titleSecond: 'Run of Show!',
    description:
      'Record donations, tips and gifts as they land, and checklist pre-stream tasks mid-broadcast.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { completeOnboarding } = useAuthStore();
  const [slideIndex, setSlideIndex] = useState(0);

  const handleFinish = async () => {
    triggerHaptic('medium');
    await completeOnboarding();
    router.replace('/(auth)/login');
  };

  const handleNext = async () => {
    triggerHaptic('light');
    if (slideIndex < ONBOARDING_SLIDES.length - 1) {
      setSlideIndex((prev) => prev + 1);
    } else {
      await handleFinish();
    }
  };

  const currentSlide = ONBOARDING_SLIDES[slideIndex];

  return (
    <View style={[styles.container, { backgroundColor: '#070414', paddingTop: insets.top }]}>
      {/* Background Ambient Glow */}
      <LinearGradient
        colors={['rgba(147, 51, 234, 0.22)', 'transparent', 'rgba(217, 70, 239, 0.16)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Bar with Skip */}
      <View style={styles.topBar}>
        <View style={{ width: 40 }} />
        <Pressable
          onPress={handleFinish}
          style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Hero Visual: 3D Streamer Character with Glowing Play Bubble */}
      <View style={styles.heroSection}>
        <View style={styles.characterContainer}>
          <Image
            source={require('@/assets/streamer_hero.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />

          {/* Floating glowing Play Button Bubble */}
          <LinearGradient
            colors={['#c084fc', '#9333ea']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.playBubble}
          >
            <Play size={20} color="#ffffff" fill="#ffffff" />
          </LinearGradient>
        </View>
      </View>

      {/* Content Area */}
      <View style={[styles.contentArea, { paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.textContainer}>
          <Text style={styles.titleFirst}>{currentSlide.titleFirst}</Text>
          <Text style={styles.titleSecond}>{currentSlide.titleSecond}</Text>
          <Text style={styles.subtitle}>{currentSlide.description}</Text>
        </View>

        {/* 3 Pagination Indicator Dots */}
        <View style={styles.paginationRow}>
          {ONBOARDING_SLIDES.map((_, i) => {
            const isActive = i === slideIndex;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  isActive
                    ? {
                      backgroundColor: '#d946ef',
                      width: 24,
                      borderRadius: 6,
                    }
                    : {
                      backgroundColor: 'rgba(192, 132, 252, 0.25)',
                      width: 8,
                      borderRadius: 4,
                    },
                ]}
              />
            );
          })}
        </View>

        {/* Full-width Next Button */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextBtnWrap,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
        >
          <LinearGradient
            colors={['#9333ea', '#a855f7', '#d946ef']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextGradientBtn}
          >
            <Text style={styles.nextBtnText}>
              {slideIndex === ONBOARDING_SLIDES.length - 1 ? 'Launch Soundboard' : 'Next'}
            </Text>
            <ArrowRight size={18} color="#ffffff" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 14,
    fontWeight: '600',
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  characterContainer: {
    position: 'relative',
    width: 280,
    height: 310,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: 260,
    height: 290,
  },
  playBubble: {
    position: 'absolute',
    top: 55,
    right: 15,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  contentArea: {
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 22,
  },
  textContainer: {
    alignItems: 'center',
  },
  titleFirst: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  titleSecond: {
    fontSize: 28,
    fontWeight: '900',
    color: '#e879f9',
    letterSpacing: 0.4,
    textAlign: 'center',
    marginTop: -2,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 300,
  },
  paginationRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    height: 8,
  },
  nextBtnWrap: {
    width: '100%',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 6,
  },
  nextGradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 27,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
});
