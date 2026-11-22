import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Linking,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Headphones,
  Mail,
  Phone,
  Globe,
  MessageCircle,
  ExternalLink,
  Plus,
  Trash2,
  X,
  Radio,
  Tv,
  Share2,
} from 'lucide-react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { api } from '@/services/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { InputField } from '@/components/forms/InputField';
import { EmptyState } from '@/components/common/EmptyState';
import { triggerHaptic } from '@/utils/haptics';
import { SupportChannel } from '@/types';

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [channelType, setChannelType] = useState<'email' | 'phone' | 'website' | 'social'>('website');
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [url, setUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const {
    data: channels = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['support-channels'],
    queryFn: () => api.getSupportChannels(),
  });

  const createChannelMutation = useMutation({
    mutationFn: (newChan: { type: string; label: string; value: string; url: string }) =>
      api.createSupportChannel(newChan),
    onSuccess: () => {
      triggerHaptic('success');
      queryClient.invalidateQueries({ queryKey: ['support-channels'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setModalVisible(false);
      resetForm();
    },
    onError: (err: any) => {
      triggerHaptic('error');
      setErrorMsg(err.message || 'Failed to create channel');
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: (id: number) => api.deleteSupportChannel(id),
    onSuccess: () => {
      triggerHaptic('medium');
      queryClient.invalidateQueries({ queryKey: ['support-channels'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const resetForm = () => {
    setChannelType('website');
    setLabel('');
    setValue('');
    setUrl('');
    setErrorMsg('');
  };

  const handleOpenUrl = async (targetUrl: string) => {
    triggerHaptic('light');
    try {
      const canOpen = await Linking.canOpenURL(targetUrl);
      if (canOpen) {
        await Linking.openURL(targetUrl);
      } else {
        // Fallback or retry with https:// if no scheme
        const formatted = targetUrl.startsWith('http') || targetUrl.startsWith('mailto:') || targetUrl.startsWith('tel:')
          ? targetUrl
          : `https://${targetUrl}`;
        await Linking.openURL(formatted);
      }
    } catch {
      Alert.alert('Cannot Open Link', `Could not open ${targetUrl}`);
    }
  };

  const handleDelete = (id: number, chanLabel: string) => {
    triggerHaptic('warning');
    Alert.alert(
      'Delete Channel',
      `Are you sure you want to delete "${chanLabel}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteChannelMutation.mutate(id),
        },
      ]
    );
  };

  const handleSubmit = () => {
    if (!label.trim()) {
      setErrorMsg('Please enter a channel title');
      return;
    }
    if (!url.trim()) {
      setErrorMsg('Please enter a valid link / URL');
      return;
    }

    createChannelMutation.mutate({
      type: channelType,
      label: label.trim(),
      value: value.trim() || label.trim(),
      url: url.trim(),
    });
  };

  const getChannelIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return <Mail size={22} color="#3b82f6" />;
      case 'phone':
        return <Phone size={22} color="#10b981" />;
      case 'social':
        return <MessageCircle size={22} color="#ec4899" />;
      case 'website':
      default:
        return <Globe size={22} color="#8b5cf6" />;
    }
  };

  const getChannelColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return '#3b82f6';
      case 'phone':
        return '#10b981';
      case 'social':
        return '#ec4899';
      case 'website':
      default:
        return '#8b5cf6';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={() => {
            triggerHaptic('light');
            router.back();
          }}
          style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <ArrowLeft size={18} color={theme.text} />
        </Pressable>
        <View style={styles.topTitles}>
          <Text style={[styles.topTitle, { color: theme.text }]}>Support & Channels</Text>
          <Text style={[styles.topSubtitle, { color: theme.textDim }]}>
            Community hubs & contact channels
          </Text>
        </View>
        <Pressable
          onPress={() => {
            triggerHaptic('medium');
            resetForm();
            setModalVisible(true);
          }}
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
        >
          <Plus size={18} color="#000000" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
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
      >
        {/* Stream Community Banner */}
        <Card style={styles.bannerCard} variant="glow">
          <View style={styles.bannerHeader}>
            <View style={[styles.bannerIconWrap, { backgroundColor: `${theme.primary}20` }]}>
              <Headphones size={28} color={theme.primary} />
            </View>
            <View style={styles.bannerTextWrap}>
              <Text style={[styles.bannerTitle, { color: theme.text }]}>
                Streamer Support Desk
              </Text>
              <Text style={[styles.bannerDesc, { color: theme.textDim }]}>
                Instant access to mods, communities, official documentation, and creator broadcasts.
              </Text>
            </View>
          </View>
        </Card>

        {/* Section Header */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Connected Hubs ({channels.length})
          </Text>
        </View>

        {channels.length === 0 && !isLoading ? (
          <EmptyState
            icon={<Headphones size={36} color={theme.textDim} />}
            title="No Support Channels"
            description="Add your first support channel, mod hotline, or community link to stay connected."
            actionTitle="Add Channel"
            onAction={() => setModalVisible(true)}
          />
        ) : (
          <View style={styles.channelList}>
            {channels.map((chan) => {
              const accentColor = getChannelColor(chan.type);
              return (
                <Card key={chan.id} style={styles.channelCard}>
                  <View style={[styles.typeIndicator, { backgroundColor: accentColor }]} />
                  <View style={styles.channelContent}>
                    <View style={styles.channelLeft}>
                      <View style={[styles.chanIconWrap, { backgroundColor: `${accentColor}18` }]}>
                        {getChannelIcon(chan.type)}
                      </View>
                      <View style={styles.channelDetails}>
                        <Text style={[styles.channelLabel, { color: theme.text }]} numberOfLines={1}>
                          {chan.label}
                        </Text>
                        {chan.value ? (
                          <Text style={[styles.channelValue, { color: theme.textDim }]} numberOfLines={1}>
                            {chan.value}
                          </Text>
                        ) : null}
                        <Text style={[styles.channelTypeBadge, { color: accentColor }]}>
                          {chan.type.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.channelActions}>
                      <Pressable
                        onPress={() => handleOpenUrl(chan.url)}
                        style={[styles.openActionBtn, { backgroundColor: `${accentColor}20` }]}
                      >
                        <ExternalLink size={16} color={accentColor} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDelete(chan.id, chan.label)}
                        style={[styles.deleteActionBtn, { backgroundColor: `${theme.danger}15` }]}
                      >
                        <Trash2 size={16} color={theme.danger} />
                      </Pressable>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Channel Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add Support Hub</Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: `${theme.border}40` }]}
              >
                <X size={18} color={theme.textDim} />
              </Pressable>
            </View>

            {errorMsg ? (
              <View style={[styles.errorBox, { backgroundColor: `${theme.danger}20`, borderColor: theme.danger }]}>
                <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Type Selector Pills */}
            <Text style={[styles.fieldLabel, { color: theme.textDim }]}>Channel Type</Text>
            <View style={styles.typeSelectorRow}>
              {(['website', 'social', 'email', 'phone'] as const).map((t) => {
                const isSelected = channelType === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => {
                      triggerHaptic('light');
                      setChannelType(t);
                    }}
                    style={[
                      styles.typeOption,
                      {
                        backgroundColor: isSelected ? theme.primary : `${theme.border}30`,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        { color: isSelected ? '#000000' : theme.text },
                      ]}
                    >
                      {t.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <InputField
              label="Channel Label *"
              placeholder="e.g. Creator Discord, Twitch Mods, Business Inquiries"
              value={label}
              onChangeText={(text) => {
                setLabel(text);
                setErrorMsg('');
              }}
            />

            <InputField
              label="Display Handle / Value"
              placeholder="e.g. discord.gg/streamer or mod@stream.com"
              value={value}
              onChangeText={setValue}
            />

            <InputField
              label="Link / Destination URL *"
              placeholder="e.g. https://discord.gg/... or mailto:support@..."
              value={url}
              onChangeText={(text) => {
                setUrl(text);
                setErrorMsg('');
              }}
              autoCapitalize="none"
              keyboardType="url"
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Hub"
                variant="primary"
                loading={createChannelMutation.isPending}
                onPress={handleSubmit}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitles: {
    flex: 1,
    marginHorizontal: 12,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  topSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    gap: 18,
  },
  bannerCard: {
    padding: 18,
    borderRadius: 18,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bannerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  bannerDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  platformPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  platformText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  channelList: {
    gap: 12,
  },
  channelCard: {
    padding: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  typeIndicator: {
    height: 3,
    width: '100%',
  },
  channelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  channelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    marginRight: 10,
  },
  chanIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelDetails: {
    flex: 1,
  },
  channelLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  channelValue: {
    fontSize: 12,
    marginTop: 2,
  },
  channelTypeBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  channelActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  openActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeOptionText: {
    fontSize: 11,
    fontWeight: '800',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  errorBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
