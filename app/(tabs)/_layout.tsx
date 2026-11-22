import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ShoppingBag,
  Wrench,
  Volume2,
  Music,
  Settings,
} from 'lucide-react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { triggerHaptic } from '@/utils/haptics';

export default function TabLayout() {
  const { theme } = useThemeStore();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.primary || '#c084fc',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.45)',
        tabBarStyle: {
          backgroundColor: '#0c061d',
          borderTopColor: theme.border || 'rgba(168, 85, 247, 0.2)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 86 : 68 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 8,
          paddingTop: 8,
          shadowColor: theme.primary || '#a855f7',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
          elevation: 16,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.3,
          marginTop: 2,
        },
      }}
      screenListeners={{
        tabPress: () => {
          triggerHaptic('selection');
        },
      }}
    >
      {/* 1. Store */}
      <Tabs.Screen
        name="store"
        options={{
          title: 'Store',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabPill : undefined}>
              <ShoppingBag size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      {/* 2. Tools */}
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabPill : undefined}>
              <Wrench size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      {/* 3. Center Elevated FX (Home) */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'FX',
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerButtonWrap}>
              <LinearGradient
                colors={
                  focused
                    ? [theme.primary, theme.vibrant || theme.primary]
                    : ['#4c1d95', '#6b21a8', '#7e22ce']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.centerButton, focused && styles.centerButtonActive]}
              >
                <View style={styles.centerButtonInner}>
                  <Volume2 size={16} color="#ffffff" strokeWidth={2.8} />
                  <Text style={styles.centerFxText}>FX</Text>
                </View>
              </LinearGradient>
            </View>
          ),
        }}
      />

      {/* 4. Music (Soundboard Library) */}
      <Tabs.Screen
        name="library"
        options={{
          title: 'Music',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabPill : undefined}>
              <Music size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      {/* 5. Settings */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabPill : undefined}>
              <Settings size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      {/* Auxiliary screens kept accessible via navigation without cluttering bottom bar */}
      <Tabs.Screen
        name="tappers"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="income"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="todo"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="create_placeholder"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeTabPill: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.16)',
  },
  centerButtonWrap: {
    top: -12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2.5,
    borderColor: '#0c061d',
  },
  centerButtonActive: {
    borderColor: '#c084fc',
    shadowColor: '#d946ef',
    shadowOpacity: 0.7,
    shadowRadius: 14,
    transform: [{ scale: 1.05 }],
  },
  centerButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  centerFxText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
