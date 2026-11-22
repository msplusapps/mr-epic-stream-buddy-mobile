import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Plus, Trash2, X, TrendingUp, Calendar } from 'lucide-react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { api } from '@/services/api';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { InputField } from '@/components/forms/InputField';
import { EmptyState } from '@/components/common/EmptyState';
import { triggerHaptic } from '@/utils/haptics';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { INCOME_TYPES } from '@/constants/config';
import { IncomeRecord } from '@/types';

export default function IncomeScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('Donation');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const {
    data: incomeRecords,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['income'],
    queryFn: () => api.getIncome(),
  });

  const totalIncome = (incomeRecords || []).reduce(
    (acc: number, curr: any) => acc + parseFloat(String(curr.amount || 0)),
    0
  );

  const handleCreate = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    try {
      setSaving(true);
      triggerHaptic('success');
      await api.createIncome(selectedType, parsedAmount, note);
      setAmount('');
      setNote('');
      setModalVisible(false);
      refetch();
    } catch { } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    triggerHaptic('warning');
    try {
      await api.deleteIncome(id);
      refetch();
    } catch { }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Header
        title="Revenue & Income"
        subtitle={`${incomeRecords?.length || 0} recorded transactions`}
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

      {/* Hero Revenue Card */}
      <View style={styles.heroWrap}>
        <Card variant="glow" style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View>
              <Text style={[styles.heroLabel, { color: theme.textDim }]}>
                TOTAL STREAM EARNINGS
              </Text>
              <Text style={[styles.heroTotal, { color: theme.success }]}>
                {formatCurrency(totalIncome)}
              </Text>
            </View>
            <View
              style={[styles.heroIconBox, { backgroundColor: 'rgba(77, 255, 136, 0.15)' }]}
            >
              <TrendingUp size={28} color={theme.success} />
            </View>
          </View>
          <Text style={[styles.entriesCount, { color: theme.textMuted }]}>
            Lifetime total from {incomeRecords?.length || 0} stream sources
          </Text>
        </Card>
      </View>

      {/* Income Records List */}
      <FlatList
        data={incomeRecords}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Card variant="default" style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <View style={styles.typeRow}>
                <Badge label={item.type} variant="success" />
                <Text style={[styles.dateText, { color: theme.textMuted }]}>
                  {formatDate(item.timestamp || item.created_at)}
                </Text>
              </View>
              <Text style={[styles.recordAmount, { color: theme.success }]}>
                +{formatCurrency(item.amount)}
              </Text>
            </View>

            {item.note ? (
              <Text style={[styles.noteText, { color: theme.textDim }]}>
                {item.note}
              </Text>
            ) : null}

            <View style={styles.recordFooter}>
              <Pressable
                onPress={() => handleDelete(item.id)}
                style={styles.delBtn}
              >
                <Trash2 size={15} color={theme.danger} />
                <Text style={[styles.delText, { color: theme.danger }]}>Delete</Text>
              </Pressable>
            </View>
          </Card>
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
              icon={<DollarSign size={32} color={theme.success} />}
              title="No Income Recorded"
              description="Record donations, sub revenue, bits, or sponsorships."
              actionTitle="Add Revenue"
              onAction={() => setModalVisible(true)}
            />
          ) : undefined
        }
      />

      {/* Modal: Record Stream Income */}
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
                Record Stream Revenue
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color={theme.textDim} />
              </Pressable>
            </View>

            {/* Income Type Horizontal Pills */}
            <Text style={[styles.typeSelectLabel, { color: theme.textDim }]}>
              REVENUE SOURCE
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.typeScroll}
            >
              {INCOME_TYPES.map((type) => {
                const isSelected = selectedType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => {
                      triggerHaptic('selection');
                      setSelectedType(type);
                    }}
                    style={[
                      styles.typePill,
                      {
                        backgroundColor: isSelected ? theme.primary : 'rgba(255, 255, 255, 0.05)',
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        { color: isSelected ? '#000' : theme.textDim },
                      ]}
                    >
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <InputField
              label="AMOUNT (USD)"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              icon={<DollarSign size={18} color={theme.success} />}
            />

            <InputField
              label="NOTE (OPTIONAL)"
              placeholder="e.g. 50 gifted subs from @champion"
              value={note}
              onChangeText={setNote}
            />

            <Button
              title="Save Transaction"
              onPress={handleCreate}
              loading={saving}
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
  heroTotal: {
    fontSize: 34,
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
  entriesCount: {
    fontSize: 12,
    marginTop: 10,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  recordCard: {
    padding: 16,
    marginVertical: 5,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 11,
  },
  recordAmount: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  delBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  delText: {
    fontSize: 11,
    fontWeight: '700',
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  typeSelectLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  typeScroll: {
    gap: 8,
    paddingBottom: 16,
  },
  typePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
