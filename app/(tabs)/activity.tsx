import React, { useState } from 'react';
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
import {
  Volume2,
  DollarSign,
  Zap,
  CheckSquare,
  KeyRound,
  Radio,
  ArrowRight,
  Clock,
} from 'lucide-react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { api } from '@/services/api';
import { Card } from '@/components/common/Card';
import { triggerHaptic } from '@/utils/haptics';

export default function ActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const [filter, setFilter] = useState<'all' | 'sound' | 'income' | 'tapper' | 'todo'>('all');

  const { data: stats, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats(),
  });

  const { data: income = [] } = useQuery({
    queryKey: ['income'],
    queryFn: () => api.getIncome(),
  });

  const { data: tappers = [] } = useQuery({
    queryKey: ['tappers'],
    queryFn: () => api.getTappers(),
  });

  const { data: todos = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: () => api.getTodos(),
  });

  // Construct real event entries from station data
  const events = [
    {
      id: 'srv-1',
      type: 'server',
      title: 'Console Station Online',
      desc: 'Connected to host at 192.168.0.100 (MySQL & Audio Engine active)',
      time: 'Live',
      icon: Radio,
      color: '#10b981',
      tag: 'SYSTEM',
    },
    ...income.slice(0, 4).map((inc, i) => ({
      id: `inc-${inc.id || i}`,
      type: 'income',
      title: `Logged $${Number(inc.amount).toFixed(2)} (${inc.type || 'Donation'})`,
      desc: inc.note ? `Note: ${inc.note}` : 'Stream revenue recorded',
      time: 'Today',
      icon: DollarSign,
      color: '#34d399',
      tag: 'REVENUE',
    })),
    ...tappers.slice(0, 3).map((tap, i) => ({
      id: `tap-${tap.id || i}`,
      type: 'tapper',
      title: `${tap.name}: ${tap.count} Total Taps`,
      desc: 'Active live stream counter milestone',
      time: 'Recent',
      icon: Zap,
      color: '#f472b6',
      tag: 'HYPE',
    })),
    ...todos.filter((t) => !!t.completed).slice(0, 3).map((td, i) => ({
      id: `td-${td.id || i}`,
      type: 'todo',
      title: `Task Completed: ${td.task}`,
      desc: 'Pre-stream checklist item verified',
      time: 'Verified',
      icon: CheckSquare,
      color: '#60a5fa',
      tag: 'CHECKLIST',
    })),
  ];

  const filtered = filter === 'all' ? events : events.filter((e) => e.type === filter);

  return (
    <View style={[styles.container, { backgroundColor: '#070414', paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerTitle}>Station Activity</Text>
          <Text style={styles.headerSubtitle}>Real-time console events & audit logs</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              triggerHaptic('light');
              refetch();
            }}
            tintColor="#a855f7"
          />
        }
      >
        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {[
            { id: 'all', label: 'All Events' },
            { id: 'income', label: 'Revenue' },
            { id: 'tapper', label: 'Hype Tappers' },
            { id: 'todo', label: 'Checklist' },
          ].map((f) => {
            const isSel = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => {
                  triggerHaptic('selection');
                  setFilter(f.id as any);
                }}
                style={[styles.filterChip, isSel && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isSel && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Event List */}
        <View style={styles.eventList}>
          {filtered.map((item) => {
            const IconComp = item.icon;
            return (
              <Card key={item.id} style={styles.eventCard}>
                <View style={[styles.iconWrap, { backgroundColor: `${item.color}22` }]}>
                  <IconComp size={18} color={item.color} />
                </View>
                <View style={styles.eventInfo}>
                  <View style={styles.eventTopLine}>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    <Text style={[styles.eventBadge, { color: item.color }]}>{item.tag}</Text>
                  </View>
                  <Text style={styles.eventDesc}>{item.desc}</Text>
                  <View style={styles.eventMeta}>
                    <Clock size={12} color="rgba(255, 255, 255, 0.4)" />
                    <Text style={styles.eventTime}>{item.time}</Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  filterRow: {
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterChipActive: {
    backgroundColor: '#9333ea',
    borderColor: '#c084fc',
  },
  filterChipText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  eventList: {
    gap: 10,
  },
  eventCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(24, 15, 46, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  eventInfo: {
    flex: 1,
    gap: 4,
  },
  eventTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    flex: 1,
    marginRight: 6,
  },
  eventBadge: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  eventDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 16,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  eventTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
  },
});
