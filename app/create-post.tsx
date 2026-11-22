import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  DollarSign,
  Zap,
  CheckSquare,
  KeyRound,
  Lightbulb,
  Sparkles,
  Check,
  Plus,
} from 'lucide-react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { api } from '@/services/api';
import { Card } from '@/components/common/Card';
import { triggerHaptic } from '@/utils/haptics';

type ActionType = 'income' | 'tapper' | 'task' | 'license' | 'suggestion';

const ACTION_TABS: Array<{ id: ActionType; label: string; icon: string; color: string }> = [
  { id: 'income', label: 'Log Income', icon: '💰', color: '#10b981' },
  { id: 'tapper', label: 'New Tapper', icon: '🎯', color: '#d946ef' },
  { id: 'task', label: 'Add Task', icon: '📝', color: '#3b82f6' },
  { id: 'license', label: 'New License', icon: '🔑', color: '#f59e0b' },
  { id: 'suggestion', label: 'Suggestion', icon: '💡', color: '#8b5cf6' },
];

const INCOME_SOURCES = [
  'Donation',
  'Twitch Bits',
  'Twitch Subs',
  'YouTube SuperChat',
  'YouTube Membership',
  'Kick Subscriptions',
  'Sponsorship',
  'Merch Sales',
  'Other',
];

export default function QuickStreamActionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActionType>('income');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Income fields
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeSource, setIncomeSource] = useState('Donation');
  const [incomeNote, setIncomeNote] = useState('');

  // 2. Tapper fields
  const [tapperName, setTapperName] = useState('');
  const [tapperInitial, setTapperInitial] = useState('1');

  // 3. Task fields
  const [taskText, setTaskText] = useState('');

  // 4. Suggestion fields
  const [suggestionText, setSuggestionText] = useState('');
  const [suggestionSection, setSuggestionSection] = useState('Stream Feature');

  const handleSubmit = async () => {
    setLoading(true);
    setSuccessMsg('');
    triggerHaptic('medium');

    try {
      if (activeTab === 'income') {
        const amt = parseFloat(incomeAmount);
        if (isNaN(amt) || amt <= 0) {
          Alert.alert('Invalid Amount', 'Please enter a valid amount.');
          setLoading(false);
          return;
        }
        await api.createIncome({
          source: incomeSource,
          amount: amt,
          currency: 'USD',
          type: incomeSource,
          notes: incomeNote,
        });
        queryClient.invalidateQueries({ queryKey: ['income'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        setSuccessMsg(`Logged $${amt.toFixed(2)} from ${incomeSource}!`);
        setIncomeAmount('');
        setIncomeNote('');
      } else if (activeTab === 'tapper') {
        if (!tapperName.trim()) {
          Alert.alert('Missing Name', 'Please enter a name for your hype counter.');
          setLoading(false);
          return;
        }
        await api.createTapper(tapperName.trim(), parseInt(tapperInitial, 10) || 1);
        queryClient.invalidateQueries({ queryKey: ['tappers'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        setSuccessMsg(`Created counter: "${tapperName}"!`);
        setTapperName('');
      } else if (activeTab === 'task') {
        if (!taskText.trim()) {
          Alert.alert('Missing Task', 'Please enter a stream task description.');
          setLoading(false);
          return;
        }
        await api.createTodo(taskText.trim());
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        setSuccessMsg('Stream task added to checklist!');
        setTaskText('');
      } else if (activeTab === 'license') {
        const res = await api.generateLicense(null);
        queryClient.invalidateQueries({ queryKey: ['licenses'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        setSuccessMsg(`Generated License: ${res.license_key}`);
      } else if (activeTab === 'suggestion') {
        if (!suggestionText.trim()) {
          Alert.alert('Missing Text', 'Please describe the suggestion.');
          setLoading(false);
          return;
        }
        await api.submitSuggestion(suggestionText.trim(), suggestionSection);
        queryClient.invalidateQueries({ queryKey: ['suggestions'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        setSuccessMsg('Viewer suggestion recorded!');
        setSuggestionText('');
      }

      triggerHaptic('success');
      setTimeout(() => {
        router.back();
      }, 1200);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Operation failed');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: '#070414', paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['rgba(147, 51, 234, 0.2)', 'transparent', 'rgba(217, 70, 239, 0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <Pressable
          onPress={() => {
            triggerHaptic('light');
            router.back();
          }}
          style={styles.headerBtn}
        >
          <ArrowLeft size={20} color="#ffffff" />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Quick Stream Action</Text>
          <Text style={styles.headerSubtitle}>Live Console Shortcuts</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Action Type Selector Horizontal Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {ACTION_TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => {
                  triggerHaptic('selection');
                  setActiveTab(tab.id);
                  setSuccessMsg('');
                }}
                style={[
                  styles.tabChip,
                  isSelected && {
                    backgroundColor: `${tab.color}25`,
                    borderColor: tab.color,
                  },
                ]}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    isSelected && { color: '#ffffff', fontWeight: '800' },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Success Banner */}
        {successMsg ? (
          <View style={styles.successBanner}>
            <Check size={18} color="#34d399" />
            <Text style={styles.successBannerText}>{successMsg}</Text>
          </View>
        ) : null}

        {/* 1. Log Income Form */}
        {activeTab === 'income' && (
          <Card style={styles.actionCard}>
            <Text style={styles.cardSectionTitle}>💰 Log Stream Earnings</Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>AMOUNT (USD)</Text>
              <TextInput
                placeholder="e.g. 25.00"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={incomeAmount}
                onChangeText={setIncomeAmount}
                keyboardType="decimal-pad"
                style={styles.textInput}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>STREAM SOURCE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sourcePills}>
                {INCOME_SOURCES.map((src) => {
                  const sel = incomeSource === src;
                  return (
                    <Pressable
                      key={src}
                      onPress={() => setIncomeSource(src)}
                      style={[styles.sourcePill, sel && styles.sourcePillActive]}
                    >
                      <Text style={[styles.sourcePillText, sel && styles.sourcePillTextActive]}>
                        {src}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>NOTE (OPTIONAL)</Text>
              <TextInput
                placeholder="e.g. SuperChat from @EpicFan"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={incomeNote}
                onChangeText={setIncomeNote}
                style={styles.textInput}
              />
            </View>
          </Card>
        )}

        {/* 2. Create Hype Tapper Form */}
        {activeTab === 'tapper' && (
          <Card style={styles.actionCard}>
            <Text style={styles.cardSectionTitle}>🎯 New Live Hype Counter</Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>COUNTER NAME</Text>
              <TextInput
                placeholder="e.g. TikTok Live Gifts / Sub Train"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={tapperName}
                onChangeText={setTapperName}
                style={styles.textInput}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>STARTING COUNT</Text>
              <TextInput
                placeholder="1"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={tapperInitial}
                onChangeText={setTapperInitial}
                keyboardType="numeric"
                style={styles.textInput}
              />
            </View>
          </Card>
        )}

        {/* 3. Add Stream Task Form */}
        {activeTab === 'task' && (
          <Card style={styles.actionCard}>
            <Text style={styles.cardSectionTitle}>📝 Add Pre-Stream Task</Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>TASK DESCRIPTION</Text>
              <TextInput
                placeholder="e.g. Test microphone level & OBS scene"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={taskText}
                onChangeText={setTaskText}
                style={styles.textInput}
              />
            </View>
          </Card>
        )}

        {/* 4. Generate License */}
        {activeTab === 'license' && (
          <Card style={styles.actionCard}>
            <Text style={styles.cardSectionTitle}>🔑 Instant License Generator</Text>
            <Text style={styles.cardDesc}>
              Generate a brand new active streamer license key instantly on your host station.
            </Text>
          </Card>
        )}

        {/* 5. Add Suggestion Form */}
        {activeTab === 'suggestion' && (
          <Card style={styles.actionCard}>
            <Text style={styles.cardSectionTitle}>💡 Record Viewer Suggestion</Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>CATEGORY</Text>
              <TextInput
                placeholder="e.g. Soundboard / Audio / Overlay"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={suggestionSection}
                onChangeText={setSuggestionSection}
                style={styles.textInput}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>SUGGESTION DETAILS</Text>
              <TextInput
                placeholder="e.g. Add 8-bit sound pack for retro streams"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={suggestionText}
                onChangeText={setSuggestionText}
                multiline
                numberOfLines={3}
                style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
              />
            </View>
          </Card>
        )}

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={({ pressed }) => [
            styles.submitBtnWrap,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
        >
          <LinearGradient
            colors={['#9333ea', '#a855f7', '#d946ef']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtn}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>
                {activeTab === 'license' ? 'Generate Key Now ⚡' : 'Execute Action ⚡'}
              </Text>
            )}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingVertical: 14,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
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
    gap: 20,
    paddingTop: 10,
  },
  tabsRow: {
    gap: 10,
    paddingVertical: 4,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    padding: 12,
  },
  successBannerText: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  actionCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(24, 15, 46, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    gap: 14,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 18,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.8,
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    color: '#ffffff',
    fontSize: 14,
  },
  sourcePills: {
    gap: 8,
    paddingVertical: 2,
  },
  sourcePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sourcePillActive: {
    backgroundColor: '#10b981',
    borderColor: '#34d399',
  },
  sourcePillText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  sourcePillTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  submitBtnWrap: {
    width: '100%',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 6,
    marginTop: 10,
  },
  submitBtn: {
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
});
