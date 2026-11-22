import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flame, Plus, RotateCcw, X, Trophy } from 'lucide-react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { api } from '@/services/api';
import { Header } from '@/components/common/Header';
import { TapperCard } from '@/components/tappers/TapperCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { InputField } from '@/components/forms/InputField';
import { triggerHaptic } from '@/utils/haptics';
import { formatCompactNumber } from '@/utils/formatters';

export default function TappersScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [tapperName, setTapperName] = useState('');
  const [initialCount, setInitialCount] = useState('1');

  const {
    data: tappers,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['tappers'],
    queryFn: () => api.getTappers(),
  });

  const totalTaps = (tappers || []).reduce((acc, curr) => acc + (curr.count || 0), 0);

  const handleTap = async (id: number, currentCount: number) => {
    try {
      await api.tapCounter(id, currentCount);
      queryClient.invalidateQueries({ queryKey: ['tappers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch {}
  };

  const handleCreate = async () => {
    if (!tapperName.trim()) return;
    triggerHaptic('success');
    try {
      await api.createTapper(tapperName.trim(), parseInt(initialCount, 10) || 1);
      setTapperName('');
      setInitialCount('1');
      setModalVisible(false);
      refetch();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    triggerHaptic('warning');
    try {
      await api.deleteTapper(id);
      refetch();
    } catch {}
  };

  const handleResetAll = async () => {
    triggerHaptic('warning');
    try {
      await api.clearAllTappers();
      refetch();
    } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Header
        title="Live Stream Hype"
        subtitle={`${tappers?.length || 0} active counters`}
        rightAction={
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              setModalVisible(true);
            }}
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
          >
            <Plus size={20} color="#000" />
          </Pressable>
        }
      />

      {/* Hero Stats Card */}
      <View style={styles.heroWrap}>
        <Card variant="glow" style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View>
              <Text style={[styles.heroLabel, { color: theme.textDim }]}>
                TOTAL STREAM TAPS
              </Text>
              <Text style={[styles.heroCount, { color: theme.primary }]}>
                {formatCompactNumber(totalTaps)}
              </Text>
            </View>
            <View
              style={[styles.heroIconBox, { backgroundColor: `${theme.primary}18` }]}
            >
              <Flame size={28} color={theme.primary} />
            </View>
          </View>
          <View style={styles.resetRow}>
            <Text style={[styles.activeCountersText, { color: theme.textMuted }]}>
              {tappers?.length || 0} Active Hype Goals
            </Text>
            {tappers && tappers.length > 0 && (
              <Pressable onPress={handleResetAll} style={styles.resetBtn}>
                <RotateCcw size={12} color={theme.danger} />
                <Text style={[styles.resetText, { color: theme.danger }]}>
                  Reset All
                </Text>
              </Pressable>
            )}
          </View>
        </Card>
      </View>

      {/* Leaderboard & Counters List */}
      <FlatList
        data={tappers}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <TapperCard
            tapper={item}
            rank={index + 1}
            onTap={handleTap}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              triggerHaptic('light');
              refetch();
            }}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={<Flame size={32} color={theme.primary} />}
              title="No Hype Counters"
              description="Create your first viewer tap goal to boost live engagement!"
              actionTitle="Add Counter"
              onAction={() => setModalVisible(true)}
            />
          ) : undefined
        }
      />

      {/* Modal: Add New Tapper */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card variant="glow" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                New Stream Counter
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color={theme.textDim} />
              </Pressable>
            </View>

            <InputField
              label="COUNTER NAME"
              placeholder="e.g. Chat Hype, Goal Taps, Likes"
              value={tapperName}
              onChangeText={setTapperName}
              autoFocus
            />

            <InputField
              label="INITIAL COUNT"
              placeholder="1"
              value={initialCount}
              onChangeText={setInitialCount}
              keyboardType="number-pad"
            />

            <Button
              title="Create Counter"
              onPress={handleCreate}
              style={{ marginTop: 8 }}
            />
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrap: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  heroCard: {
    padding: 20,
    marginVertical: 4,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroCount: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: 2,
  },
  heroIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeCountersText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  resetText: {
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
});
