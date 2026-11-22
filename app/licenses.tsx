import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  KeyRound,
  Plus,
  Copy,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  ArrowLeft,
  Calendar,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useThemeStore } from '@/store/useThemeStore';
import { api } from '@/services/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { InputField } from '@/components/forms/InputField';
import { EmptyState } from '@/components/common/EmptyState';
import { triggerHaptic } from '@/utils/haptics';
import { formatDate } from '@/utils/formatters';

export default function LicensesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [expiresDate, setExpiresDate] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const {
    data: licenses,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['licenses'],
    queryFn: () => api.getLicenses(),
  });

  const handleGenerate = async () => {
    try {
      triggerHaptic('success');
      await api.generateLicense(expiresDate || null);
      setExpiresDate('');
      setModalVisible(false);
      refetch();
    } catch {}
  };

  const handleToggle = async (id: number, currentActive: boolean) => {
    triggerHaptic('medium');
    try {
      await api.toggleLicense(id, !currentActive);
      refetch();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    triggerHaptic('warning');
    try {
      await api.deleteLicense(id);
      refetch();
    } catch {}
  };

  const handleCopy = async (keyText: string) => {
    triggerHaptic('selection');
    await Clipboard.setStringAsync(keyText);
    setCopiedKey(keyText);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Pressable
          onPress={() => {
            triggerHaptic('light');
            router.back();
          }}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color={theme.textDim} />
          <Text style={[styles.backText, { color: theme.textDim }]}>BACK</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            triggerHaptic('light');
            setModalVisible(true);
          }}
          style={[styles.genBtn, { backgroundColor: theme.primary }]}
        >
          <Plus size={18} color="#000" />
          <Text style={styles.genBtnText}>GENERATE KEY</Text>
        </Pressable>
      </View>

      <View style={styles.titleWrap}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>
          License Key Manager
        </Text>
        <Text style={[styles.pageSubtitle, { color: theme.textDim }]}>
          Manage streamer access keys for Stream Buddy Pro
        </Text>
      </View>

      {/* License List */}
      <FlatList
        data={licenses}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const isActive = !!item.is_active;
          const isCopied = copiedKey === item.license_key;

          return (
            <Card variant="glow" style={styles.licenseCard}>
              <View style={styles.cardTop}>
                <View style={styles.keyRow}>
                  <KeyRound size={18} color={theme.primary} />
                  <Text style={[styles.keyText, { color: theme.text }]}>
                    {item.license_key}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleCopy(item.license_key)}
                  style={[
                    styles.copyBtn,
                    { backgroundColor: isCopied ? `${theme.success}22` : 'rgba(255, 255, 255, 0.08)' },
                  ]}
                >
                  <Copy size={14} color={isCopied ? theme.success : theme.primary} />
                  <Text
                    style={[
                      styles.copyText,
                      { color: isCopied ? theme.success : theme.primary },
                    ]}
                  >
                    {isCopied ? 'COPIED' : 'COPY'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.cardMeta}>
                <View style={styles.badgeRow}>
                  <Badge
                    label={isActive ? 'ACTIVE' : 'REVOKED'}
                    variant={isActive ? 'success' : 'danger'}
                  />
                  {item.expires_at ? (
                    <Text style={[styles.metaText, { color: theme.textMuted }]}>
                      Expires {item.expires_at}
                    </Text>
                  ) : (
                    <Text style={[styles.metaText, { color: theme.textMuted }]}>
                      Lifetime Access
                    </Text>
                  )}
                </View>

                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={() => handleToggle(item.id, isActive)}
                    style={styles.toggleBtn}
                  >
                    {isActive ? (
                      <XCircle size={18} color={theme.warning} />
                    ) : (
                      <CheckCircle2 size={18} color={theme.success} />
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(item.id)}
                    style={styles.delBtn}
                  >
                    <Trash2 size={18} color={theme.danger} />
                  </Pressable>
                </View>
              </View>
            </Card>
          );
        }}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
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
              icon={<KeyRound size={32} color={theme.primary} />}
              title="No License Keys"
              description="Generate your first stream license key above."
              actionTitle="Generate Key"
              onAction={() => setModalVisible(true)}
            />
          ) : undefined
        }
      />

      {/* Modal: Generate Key */}
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
                Generate License Key
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color={theme.textDim} />
              </Pressable>
            </View>

            <InputField
              label="EXPIRES AT (YYYY-MM-DD, OPTIONAL)"
              placeholder="e.g. 2026-12-31 (leave empty for lifetime)"
              value={expiresDate}
              onChangeText={setExpiresDate}
              icon={<Calendar size={18} color={theme.primary} />}
            />

            <Button
              title="Generate Instant Key"
              onPress={handleGenerate}
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  backText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  genBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  genBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  titleWrap: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  pageSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  licenseCard: {
    padding: 16,
    marginVertical: 5,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  keyText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaText: {
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleBtn: {
    padding: 4,
  },
  delBtn: {
    padding: 4,
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
});
