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
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  Plus,
  CheckCircle,
  Trash2,
  X,
  ArrowLeft,
  Mail,
  Tag,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/store/useThemeStore';
import { api } from '@/services/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { InputField } from '@/components/forms/InputField';
import { EmptyState } from '@/components/common/EmptyState';
import { triggerHaptic } from '@/utils/haptics';
import { formatDate } from '@/utils/formatters';

export default function SuggestionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');
  const [section, setSection] = useState('Soundboard');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    data: suggestions,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => api.getSuggestions(),
  });

  const handleSubmit = async () => {
    if (!suggestionText.trim()) return;
    try {
      setSubmitting(true);
      triggerHaptic('success');
      await api.submitSuggestion(suggestionText.trim(), section, email);
      setSuggestionText('');
      setEmail('');
      setModalVisible(false);
      refetch();
    } catch { } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: 'pending' | 'reviewed' | 'implemented') => {
    triggerHaptic('medium');
    try {
      await api.updateSuggestionStatus(id, newStatus);
      refetch();
    } catch { }
  };

  const handleDelete = async (id: number) => {
    triggerHaptic('warning');
    try {
      await api.deleteSuggestion(id);
      refetch();
    } catch { }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
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
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
        >
          <Plus size={18} color="#000" />
          <Text style={styles.addBtnText}>SUBMIT IDEA</Text>
        </Pressable>
      </View>

      <View style={styles.titleWrap}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>
          Community Suggestions
        </Text>
        <Text style={[styles.pageSubtitle, { color: theme.textDim }]}>
          Viewer requests and ideas from your stream audience
        </Text>
      </View>

      <FlatList
        data={suggestions}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const isPending = item.status === 'pending';
          return (
            <Card variant="glow" style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.sectionRow}>
                  <Badge label={item.section || 'General'} variant="primary" />
                  <Badge
                    label={item.status.toUpperCase()}
                    variant={isPending ? 'warning' : 'success'}
                  />
                </View>
                <Text style={[styles.dateText, { color: theme.textMuted }]}>
                  {formatDate(item.created_at)}
                </Text>
              </View>

              <Text style={[styles.suggestionText, { color: theme.text }]}>
                {item.suggestion}
              </Text>

              {item.email ? (
                <Text style={[styles.authorEmail, { color: theme.textMuted }]}>
                  From: {item.email}
                </Text>
              ) : null}

              <View style={styles.cardFooter}>
                {isPending && (
                  <Pressable
                    onPress={() => handleUpdateStatus(item.id, 'reviewed')}
                    style={styles.reviewBtn}
                  >
                    <CheckCircle size={15} color={theme.success} />
                    <Text style={[styles.reviewText, { color: theme.success }]}>
                      Mark Reviewed
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => handleDelete(item.id)}
                  style={styles.delBtn}
                >
                  <Trash2 size={16} color={theme.danger} />
                </Pressable>
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
              icon={<MessageSquare size={32} color={theme.primary} />}
              title="No Suggestions Yet"
              description="Your stream suggestions inbox is all clear."
              actionTitle="Submit Idea"
              onAction={() => setModalVisible(true)}
            />
          ) : undefined
        }
      />

      {/* Modal: New Suggestion */}
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
                Submit Stream Idea
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color={theme.textDim} />
              </Pressable>
            </View>

            <InputField
              label="TARGET SECTION"
              placeholder="e.g. Soundboard, Tappers, Overlay, Alerts"
              value={section}
              onChangeText={setSection}
              icon={<Tag size={18} color={theme.primary} />}
            />

            <InputField
              label="YOUR SUGGESTION"
              placeholder="Describe your feature idea or sound request..."
              value={suggestionText}
              onChangeText={setSuggestionText}
              multiline
              numberOfLines={4}
              style={{ height: 90, textAlignVertical: 'top' }}
            />

            <InputField
              label="YOUR EMAIL (OPTIONAL)"
              placeholder="you@streamer.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Mail size={18} color={theme.primary} />}
            />

            <Button
              title="Submit Suggestion"
              onPress={handleSubmit}
              loading={submitting}
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: {
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
  card: {
    padding: 16,
    marginVertical: 5,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 11,
  },
  suggestionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 8,
  },
  authorEmail: {
    fontSize: 11,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  reviewText: {
    fontSize: 12,
    fontWeight: '700',
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
