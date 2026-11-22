import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Palette,
  Server,
  Shield,
  Bell,
  LogOut,
  Check,
  RefreshCw,
  ExternalLink,
  Info,
  Radio,
  Sliders,
  Sparkles,
  KeyRound,
  MessageSquare,
  Headphones,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { THEMES, ThemeKey } from '@/constants/theme';
import {
  api,
  getApiBaseUrl,
  setApiBaseUrlOverride,
  testApiConnection,
  getStoredApiKey,
} from '@/services/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { InputField } from '@/components/forms/InputField';
import { triggerHaptic } from '@/utils/haptics';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, currentThemeKey, setTheme } = useThemeStore();
  const { user, logout, apiKey, loginWithApiKey } = useAuthStore();
  const queryClient = useQueryClient();

  const [apiUrl, setApiUrl] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');

  const [userApiKey, setUserApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [apiKeyMessage, setApiKeyMessage] = useState('');

  const [notifyEmail, setNotifyEmail] = useState('');
  const [adminMask, setAdminMask] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    getApiBaseUrl().then((url) => setApiUrl(url));
    if (apiKey) {
      setUserApiKey(apiKey);
    } else {
      getStoredApiKey().then((k) => {
        if (k) setUserApiKey(k);
      });
    }
  }, [apiKey]);

  // Fetch backend settings
  const { data: serverSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['server-settings'],
    queryFn: () => api.getSettings(),
  });

  useEffect(() => {
    if (serverSettings?.settings) {
      if (serverSettings.settings.notify_email) {
        setNotifyEmail(serverSettings.settings.notify_email);
      }
      if (serverSettings.settings.admin_msk) {
        setAdminMask(serverSettings.settings.admin_msk);
      }
      if (serverSettings.settings.theme && THEMES[serverSettings.settings.theme as ThemeKey]) {
        // sync if not already active
        if (serverSettings.settings.theme !== currentThemeKey) {
          // keep local selection or sync
        }
      }
    }
  }, [serverSettings]);

  const handleSelectTheme = async (themeKey: ThemeKey) => {
    triggerHaptic('medium');
    await setTheme(themeKey);
    try {
      await api.updateSettings({ theme: themeKey });
    } catch { }
  };

  const handleTestConnection = async () => {
    triggerHaptic('light');
    setTestingConnection(true);
    setConnectionStatus('idle');
    setConnectionMessage('');

    try {
      // Temporarily override to test
      await setApiBaseUrlOverride(apiUrl.trim());
      const res = await testApiConnection();
      if (res.ok) {
        triggerHaptic('success');
        setConnectionStatus('success');
        setConnectionMessage(`Connected successfully! Server is online.`);
        queryClient.invalidateQueries();
      } else {
        triggerHaptic('error');
        setConnectionStatus('error');
        setConnectionMessage(res.error || 'Server responded with an error');
      }
    } catch (err: any) {
      triggerHaptic('error');
      setConnectionStatus('error');
      setConnectionMessage(err.message || 'Connection failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleResetApiUrl = async () => {
    triggerHaptic('light');
    await setApiBaseUrlOverride(null);
    const defaultUrl = await getApiBaseUrl();
    setApiUrl(defaultUrl);
    setConnectionStatus('idle');
    setConnectionMessage('Reset to platform default URL');
  };

  const handleSaveApiKey = async () => {
    const trimmed = userApiKey.trim();
    if (!trimmed) {
      Alert.alert('API Key Required', 'Please enter your Stream Buddy API Key or Secret Token.');
      return;
    }
    triggerHaptic('medium');
    setSavingApiKey(true);
    setApiKeyStatus('idle');
    setApiKeyMessage('');

    try {
      await loginWithApiKey(trimmed);
      const testRes = await testApiConnection();
      if (testRes.ok) {
        triggerHaptic('success');
        setApiKeyStatus('success');
        setApiKeyMessage('API Key saved & verified! Server is connected.');
        queryClient.invalidateQueries();
      } else {
        triggerHaptic('warning');
        setApiKeyStatus('success');
        setApiKeyMessage(`API Key saved locally. (Server ping: ${testRes.error || 'offline'})`);
      }
    } catch (err: any) {
      triggerHaptic('error');
      setApiKeyStatus('error');
      setApiKeyMessage(err.message || 'Failed to save API key');
    } finally {
      setSavingApiKey(false);
    }
  };

  const handleResetApiKey = async () => {
    triggerHaptic('light');
    Alert.alert(
      'Reset API Key',
      'Revert API key to system default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Key',
          style: 'destructive',
          onPress: async () => {
            await logout();
            setUserApiKey('');
            setApiKeyStatus('idle');
            setApiKeyMessage('API Key reset to platform default.');
            queryClient.invalidateQueries();
          },
        },
      ]
    );
  };

  const handleSaveServerSettings = async () => {
    triggerHaptic('medium');
    setSavingSettings(true);
    try {
      await api.updateSettings({
        notify_email: notifyEmail.trim(),
        admin_msk: adminMask.trim(),
      });
      triggerHaptic('success');
      Alert.alert('Saved', 'Server settings updated successfully.');
      refetchSettings();
    } catch (err: any) {
      triggerHaptic('error');
      Alert.alert('Error', err.message || 'Failed to update server settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = () => {
    triggerHaptic('warning');
    Alert.alert('Log Out', 'Are you sure you want to end your stream session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        {router.canGoBack() && (
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              router.back();
            }}
            style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <ArrowLeft size={18} color={theme.text} />
          </Pressable>
        )}
        <View style={styles.topTitles}>
          <Text style={[styles.topTitle, { color: theme.text }]}>Settings & Themes</Text>
          <Text style={[styles.topSubtitle, { color: theme.textDim }]}>
            Personalization & server config
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Selector Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={18} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Cyberpunk Themes</Text>
          </View>
          <Text style={[styles.sectionDesc, { color: theme.textDim }]}>
            Personalize your streaming command center with 10 high-contrast cyber visual palettes.
          </Text>

          <View style={styles.themeGrid}>
            {Object.keys(THEMES).map((key) => {
              const thKey = key as ThemeKey;
              const th = THEMES[thKey];
              const isSelected = currentThemeKey === thKey;

              return (
                <Pressable
                  key={thKey}
                  onPress={() => handleSelectTheme(thKey)}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: th.card,
                      borderColor: isSelected ? th.primary : th.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                >
                  <View style={styles.colorPillRow}>
                    <View style={[styles.colorDot, { backgroundColor: th.primary }]} />
                    <View style={[styles.colorDot, { backgroundColor: th.vibrant }]} />
                    <View style={[styles.colorDot, { backgroundColor: th.bg }]} />
                  </View>
                  <View style={styles.themeInfoRow}>
                    <Text style={[styles.themeName, { color: th.text }]}>{th.name}</Text>
                    {isSelected && (
                      <View style={[styles.activeDot, { backgroundColor: th.primary }]}>
                        <Check size={12} color="#000000" />
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ================= API KEY & SERVER AUTHENTICATION ================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <KeyRound size={18} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>API Key & Stream Authentication</Text>
            {userApiKey ? (
              <View style={styles.apiKeyActiveBadge}>
                <Check size={10} color="#10b981" />
                <Text style={styles.apiKeyActiveText}>AUTHENTICATED</Text>
              </View>
            ) : (
              <View style={styles.apiKeyDefaultBadge}>
                <Text style={styles.apiKeyDefaultText}>DEFAULT KEY</Text>
              </View>
            )}
          </View>
          <Text style={[styles.sectionDesc, { color: theme.textDim }]}>
            Enter your Stream Buddy API Key or Secret Access Token to authenticate mobile pad triggers, sound store downloads, and live hype metrics with your desktop server.
          </Text>

          <Card style={[styles.cardPad, { borderColor: theme.border }]}>
            <View style={styles.apiKeyInputWrap}>
              <InputField
                label="Stream Buddy API Key"
                value={userApiKey}
                onChangeText={setUserApiKey}
                placeholder="e.g. epk_live_a1b2c3d4e5f6... or secret key"
                secureTextEntry={!showApiKey}
                icon={<KeyRound size={16} color={theme.primary} />}
              />
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  setShowApiKey(!showApiKey);
                }}
                style={styles.showKeyToggle}
              >
                <View style={styles.eyeRow}>
                  {showApiKey ? (
                    <>
                      <EyeOff size={14} color={theme.primary} />
                      <Text style={[styles.showKeyToggleText, { color: theme.primary }]}>Hide Key</Text>
                    </>
                  ) : (
                    <>
                      <Eye size={14} color={theme.primary} />
                      <Text style={[styles.showKeyToggleText, { color: theme.primary }]}>Reveal Key</Text>
                    </>
                  )}
                </View>
              </Pressable>
            </View>

            {apiKeyMessage ? (
              <View
                style={[
                  styles.statusBox,
                  apiKeyStatus === 'success' ? styles.statusSuccess : styles.statusError,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    apiKeyStatus === 'success' ? styles.statusSuccessText : styles.statusErrorText,
                  ]}
                >
                  {apiKeyMessage}
                </Text>
              </View>
            ) : null}

            <View style={styles.btnRow}>
              <Button
                title={savingApiKey ? 'Verifying...' : 'Save & Verify Key'}
                onPress={handleSaveApiKey}
                loading={savingApiKey}
                icon={<Check size={16} color="#000000" />}
                style={{ flex: 1 }}
              />
              {userApiKey ? (
                <Pressable
                  onPress={handleResetApiKey}
                  style={styles.resetBtn}
                >
                  <RefreshCw size={14} color={theme.textDim} />
                  <Text style={[styles.resetBtnText, { color: theme.textDim }]}>Reset</Text>
                </Pressable>
              ) : null}
            </View>
          </Card>
        </View>

        {/* ================= SERVER CONNECTION CONFIG ================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Server size={18} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Server API Endpoint</Text>
            {connectionStatus === 'success' && (
              <View style={styles.apiKeyActiveBadge}>
                <Check size={10} color="#10b981" />
                <Text style={styles.apiKeyActiveText}>ONLINE</Text>
              </View>
            )}
          </View>
          <Text style={[styles.sectionDesc, { color: theme.textDim }]}>
            Change your backend server URL if hosting Stream Buddy on local Wi-Fi or a custom domain.
          </Text>

          <Card style={[styles.cardPad, { borderColor: theme.border }]}>
            <InputField
              label="Backend Endpoint URL"
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="http://192.168.0.x/projects/mr_epic_stream_buddy/api"
              icon={<Server size={16} color={theme.primary} />}
            />

            {connectionMessage ? (
              <View
                style={[
                  styles.statusBox,
                  connectionStatus === 'success' ? styles.statusSuccess : styles.statusError,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    connectionStatus === 'success'
                      ? styles.statusSuccessText
                      : styles.statusErrorText,
                  ]}
                >
                  {connectionMessage}
                </Text>
              </View>
            ) : null}

            <View style={styles.btnRow}>
              <Button
                title={testingConnection ? 'Pinging Server...' : 'Test Connection'}
                onPress={handleTestConnection}
                loading={testingConnection}
                icon={<Radio size={16} color="#000000" />}
                style={{ flex: 1 }}
              />
              <Pressable
                onPress={handleResetApiUrl}
                style={styles.resetBtn}
              >
                <RefreshCw size={14} color={theme.textDim} />
                <Text style={[styles.resetBtnText, { color: theme.textDim }]}>Default URL</Text>
              </Pressable>
            </View>
          </Card>
        </View>

        {/* Quick Navigation Hub */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sliders size={18} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>App Navigation Shortcuts</Text>
          </View>

          <Card style={styles.navCard}>
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                router.push('/support');
              }}
              style={[styles.navItem, { borderBottomColor: theme.border }]}
            >
              <View style={styles.navItemLeft}>
                <Headphones size={18} color={theme.primary} />
                <Text style={[styles.navItemText, { color: theme.text }]}>
                  Support & Community Channels
                </Text>
              </View>
              <ExternalLink size={16} color={theme.textDim} />
            </Pressable>

            <Pressable
              onPress={() => {
                triggerHaptic('light');
                router.push('/licenses');
              }}
              style={[styles.navItem, { borderBottomColor: theme.border }]}
            >
              <View style={styles.navItemLeft}>
                <KeyRound size={18} color="#c084fc" />
                <Text style={[styles.navItemText, { color: theme.text }]}>
                  License Keys & Access
                </Text>
              </View>
              <ExternalLink size={16} color={theme.textDim} />
            </Pressable>

            <Pressable
              onPress={() => {
                triggerHaptic('light');
                router.push('/suggestions');
              }}
              style={styles.navItem}
            >
              <View style={styles.navItemLeft}>
                <MessageSquare size={18} color="#fbbf24" />
                <Text style={[styles.navItemText, { color: theme.text }]}>
                  Community Feedback & Ideas
                </Text>
              </View>
              <ExternalLink size={16} color={theme.textDim} />
            </Pressable>
          </Card>
        </View>
      </ScrollView>
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
    marginLeft: 14,
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
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sectionDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  themeCard: {
    width: '48%',
    padding: 12,
    borderRadius: 14,
    gap: 8,
  },
  colorPillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeName: {
    fontSize: 13,
    fontWeight: '700',
  },
  activeDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPad: {
    padding: 18,
    gap: 14,
    borderRadius: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  statusBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  statusSuccessText: {
    color: '#34d399',
  },
  statusErrorText: {
    color: '#ef4444',
  },
  apiKeyActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  apiKeyActiveText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  apiKeyDefaultBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  apiKeyDefaultText: {
    color: '#f59e0b',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  apiKeyInputWrap: {
    position: 'relative',
  },
  showKeyToggle: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 4,
    paddingVertical: 2,
  },
  eyeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  showKeyToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  navCard: {
    padding: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sessionCard: {
    padding: 16,
    borderRadius: 16,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionUser: {
    fontSize: 16,
    fontWeight: '800',
  },
  sessionRole: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  versionFooter: {
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  versionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  versionSubtitle: {
    fontSize: 11,
  },
});
