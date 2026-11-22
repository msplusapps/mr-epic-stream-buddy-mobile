import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/services/api';
import { InputField } from '@/components/forms/InputField';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { triggerHaptic } from '@/utils/haptics';

export default function ActivateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { setLicenseKey } = useAuthStore();

  const [licenseKey, setLicenseKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setErrorMsg('Please enter a valid license key.');
      triggerHaptic('error');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await api.activateLicense(licenseKey.trim());

      setSuccessMsg('License activated successfully! Welcome to Stream Buddy.');
      triggerHaptic('success');
      await setLicenseKey(res.key);

      setTimeout(() => {
        router.replace('/(tabs)/dashboard');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired license key.');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[`${theme.primary}15`, 'transparent', `${theme.vibrant}15`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
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

        <View style={styles.heroBox}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${theme.primary}18`, borderColor: theme.border },
            ]}
          >
            <KeyRound size={32} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            Activate Stream License
          </Text>
          <Text style={[styles.desc, { color: theme.textDim }]}>
            Enter the license key issued by your stream administrator to unlock Pro
            Console features.
          </Text>
        </View>

        <Card variant="glow" style={styles.card}>
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color={theme.danger} />
              <Text style={[styles.errorText, { color: theme.danger }]}>
                {errorMsg}
              </Text>
            </View>
          ) : null}

          {successMsg ? (
            <View style={styles.successBanner}>
              <CheckCircle2 size={16} color={theme.success} />
              <Text style={[styles.successText, { color: theme.success }]}>
                {successMsg}
              </Text>
            </View>
          ) : null}

          <InputField
            label="LICENSE KEY"
            placeholder="e.g. EPIC-STREAM-2025-ABCD"
            value={licenseKey}
            onChangeText={(txt) => {
              setLicenseKeyInput(txt.toUpperCase());
              setErrorMsg('');
            }}
            autoCapitalize="characters"
            icon={<KeyRound size={18} color={theme.primary} />}
          />

          <Button
            title="Verify & Unlock"
            onPress={handleActivate}
            loading={loading}
            size="lg"
            style={styles.submitBtn}
          />

          <Pressable
            onPress={() => {
              setLicenseKeyInput('EPIC-STREAM-2025-ABCD');
              triggerHaptic('selection');
            }}
            style={styles.demoLink}
          >
            <Text style={[styles.demoText, { color: theme.textMuted }]}>
              Demo Key: <Text style={{ color: theme.primary }}>EPIC-STREAM-2025-ABCD</Text>
            </Text>
          </Pressable>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 20,
  },
  backText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  desc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
  card: {
    padding: 24,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(77, 255, 136, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  submitBtn: {
    marginTop: 8,
  },
  demoLink: {
    marginTop: 14,
    alignItems: 'center',
  },
  demoText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
