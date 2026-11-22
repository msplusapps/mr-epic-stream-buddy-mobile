import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Wrench,
  Zap,
  Flame,
  DollarSign,
  CheckSquare,
  Activity,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Sliders,
} from 'lucide-react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { api } from '@/services/api';
import { Card } from '@/components/common/Card';
import { triggerHaptic } from '@/utils/haptics';

export default function StreamerToolsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();

  // Fetch real stream metrics
  const { data: stats, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats(),
  });

  // Fetch tappers
  const { data: tappers = [] } = useQuery({
    queryKey: ['tappers'],
    queryFn: () => api.getTappers(),
  });

  const activeTapper = tappers[0] || { id: 1, name: 'TikTok Live Hype', count: 0 };
  const [localTaps, setLocalTaps] = useState(activeTapper.count || 0);

  useEffect(() => {
    if (activeTapper.count !== undefined) {
      setLocalTaps(activeTapper.count);
    }
  }, [activeTapper.count]);

  const handleQuickTap = () => {
    triggerHaptic('heavy');
    setLocalTaps((prev) => prev + 1);
    if (activeTapper.id) {
      api.tapCounter(activeTapper.id, localTaps).catch(() => {});
    }
  };

  const totalEarnings = stats?.income?.total ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: '#070414', paddingTop: insets.top }]}>
      {/* Tools Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <View style={styles.headerBadgeRow}>
            <Wrench size={14} color="#c084fc" />
            <Text style={styles.headerBadgeText}>STREAM COMPANION</Text>
          </View>
          <Text style={styles.headerTitle}>Streamer Tools</Text>
        </View>

        <Pressable
          onPress={() => {
            triggerHaptic('light');
            router.push('/(tabs)/settings');
          }}
          style={styles.settingsBtn}
        >
          <Sliders size={18} color="#ffffff" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              triggerHaptic('light');
              refetch();
            }}
            tintColor="#c084fc"
            colors={['#c084fc']}
          />
        }
      >
        {/* Tool 1: Interactive TikTok Live Hype Tapper */}
        <Card style={styles.toolCard}>
          <View style={styles.toolHeader}>
            <View style={[styles.toolIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
              <Zap size={22} color="#ec4899" />
            </View>
            <View style={styles.toolInfo}>
              <Text style={styles.toolName}>TikTok Live Hype Tapper</Text>
              <Text style={styles.toolDesc}>Boost stream momentum & send real-time hype taps</Text>
            </View>
          </View>

          {/* Quick Tap Action Bar */}
          <View style={styles.tapperActionRow}>
            <View style={styles.tapStatBox}>
              <Text style={styles.tapStatNum}>{localTaps}</Text>
              <Text style={styles.tapStatLabel}>Live Taps</Text>
            </View>

            <Pressable
              onPress={handleQuickTap}
              style={({ pressed }) => [
                styles.boostTapBtnWrap,
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
            >
              <LinearGradient
                colors={['#ec4899', '#d946ef']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.boostTapBtn}
              >
                <Flame size={16} color="#ffffff" fill="#ffffff" />
                <Text style={styles.boostTapText}>TAP BOOST +1</Text>
              </LinearGradient>
            </Pressable>
          </View>

          <Pressable
            onPress={() => {
              triggerHaptic('selection');
              router.push('/(tabs)/tappers');
            }}
            style={styles.cardFooterBtn}
          >
            <Text style={styles.cardFooterText}>Manage All Counters</Text>
            <ArrowRight size={14} color="#c084fc" />
          </Pressable>
        </Card>

        {/* Tool 2: Stream Earnings & Revenue Tracker */}
        <Card style={styles.toolCard}>
          <View style={styles.toolHeader}>
            <View style={[styles.toolIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <DollarSign size={22} color="#10b981" />
            </View>
            <View style={styles.toolInfo}>
              <Text style={styles.toolName}>Stream Earnings & Tips</Text>
              <Text style={styles.toolDesc}>Track Bits, Subs, SuperChats, and Donations</Text>
            </View>
          </View>

          <View style={styles.earningsSummaryRow}>
            <View style={styles.earningStat}>
              <Text style={styles.earningStatSymbol}>$</Text>
              <Text style={styles.earningStatValue}>{Number(totalEarnings).toLocaleString()}</Text>
              <Text style={styles.earningStatLabel}>Total Stream Revenue</Text>
            </View>
            <View style={styles.trendingBadge}>
              <TrendingUp size={14} color="#34d399" />
              <Text style={styles.trendingBadgeText}>Active</Text>
            </View>
          </View>

          <Pressable
            onPress={() => {
              triggerHaptic('selection');
              router.push('/(tabs)/income');
            }}
            style={styles.cardFooterBtn}
          >
            <Text style={styles.cardFooterText}>Log Tips & Revenue Breakdown</Text>
            <ArrowRight size={14} color="#c084fc" />
          </Pressable>
        </Card>

        {/* Tool 3: Pre-Stream Checklist */}
        <Card style={styles.toolCard}>
          <View style={styles.toolHeader}>
            <View style={[styles.toolIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <CheckSquare size={22} color="#3b82f6" />
            </View>
            <View style={styles.toolInfo}>
              <Text style={styles.toolName}>Pre-Stream Checklist</Text>
              <Text style={styles.toolDesc}>Ensure audio, mic, OBS scenes & lighting are armed</Text>
            </View>
          </View>

          <View style={styles.checklistPillsRow}>
            <View style={styles.checkMiniPill}>
              <Text style={styles.checkMiniPillText}>✓ Audio</Text>
            </View>
            <View style={styles.checkMiniPill}>
              <Text style={styles.checkMiniPillText}>✓ Mic Levels</Text>
            </View>
            <View style={styles.checkMiniPill}>
              <Text style={styles.checkMiniPillText}>✓ OBS Key</Text>
            </View>
            <View style={styles.checkMiniPill}>
              <Text style={styles.checkMiniPillText}>✓ Alerts</Text>
            </View>
          </View>

          <Pressable
            onPress={() => {
              triggerHaptic('selection');
              router.push('/(tabs)/todo');
            }}
            style={styles.cardFooterBtn}
          >
            <Text style={styles.cardFooterText}>Open Pre-Stream Tasks</Text>
            <ArrowRight size={14} color="#c084fc" />
          </Pressable>
        </Card>

        {/* Tool 4: Live Activity & Audits */}
        <Card style={styles.toolCard}>
          <View style={styles.toolHeader}>
            <View style={[styles.toolIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Activity size={22} color="#c084fc" />
            </View>
            <View style={styles.toolInfo}>
              <Text style={styles.toolName}>Live Activity Log</Text>
              <Text style={styles.toolDesc}>Real-time triggers, sound FX history, and station feed</Text>
            </View>
          </View>

          <Pressable
            onPress={() => {
              triggerHaptic('selection');
              router.push('/(tabs)/activity');
            }}
            style={styles.cardFooterBtn}
          >
            <Text style={styles.cardFooterText}>View Activity Stream</Text>
            <ArrowRight size={14} color="#c084fc" />
          </Pressable>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitles: {
    flex: 1,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#c084fc',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  toolCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(24, 15, 46, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    gap: 14,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  toolDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 2,
  },
  tapperActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tapStatBox: {
    gap: 2,
  },
  tapStatNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  tapStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.5,
  },
  boostTapBtnWrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  boostTapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  boostTapText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  earningsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  earningStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    flexWrap: 'wrap',
  },
  earningStatSymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: '#34d399',
  },
  earningStatValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  earningStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 6,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendingBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '700',
  },
  checklistPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkMiniPill: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  checkMiniPillText: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardFooterText: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '700',
  },
});
