import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings,
  Volume2,
  Zap,
  DollarSign,
  CheckSquare,
  Radio,
  Sliders,
  ChevronRight,
  LogOut,
  HelpCircle,
  Lightbulb,
  KeyRound,
  ShieldCheck,
} from 'lucide-react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Card } from '@/components/common/Card';
import { triggerHaptic } from '@/utils/haptics';

export default function StreamerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { user, logout, apiKey } = useAuthStore();

  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [lowLatencyAudio, setLowLatencyAudio] = useState(true);

  const handleLogout = () => {
    triggerHaptic('warning');
    Alert.alert('Disconnect Station', 'Are you sure you want to disconnect from this Stream Buddy station?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#070414', paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={{ width: 40 }} />
        <Text style={styles.screenTitle}>Streamer Station</Text>
        <Pressable
          onPress={() => {
            triggerHaptic('light');
            router.push('/settings');
          }}
          style={styles.settingsBtn}
        >
          <Settings size={22} color="#ffffff" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Streamer Avatar & Channel Info */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarGlowWrap}>
            <LinearGradient
              colors={['#c084fc', '#9333ea', '#d946ef']}
              style={styles.avatarBorder}
            >
              <Image
                source={require('@/assets/avatar.png')}
                style={styles.avatarImage}
              />
            </LinearGradient>
            <View style={styles.liveIndicatorDot} />
          </View>

          <Text style={styles.creatorName}>{user?.username || 'Promise Peter Akpan'}</Text>
          <Text style={styles.handleText}>@streamer_live • Console Pro</Text>

          {/* Station Online Tag */}
          <View style={styles.stationBadge}>
            <Radio size={12} color="#21e6d2" />
            <Text style={styles.stationBadgeText}>STREAM STATION · 192.168.0.100</Text>
          </View>
        </View>

        {/* Stream Companion Summary Row */}
        <View style={styles.statsCardRow}>
          <Card style={styles.statBox}>
            <Volume2 size={16} color="#c084fc" />
            <Text style={styles.statVal}>128</Text>
            <Text style={styles.statLbl}>Sound FX</Text>
          </Card>

          <Card style={styles.statBox}>
            <DollarSign size={16} color="#34d399" />
            <Text style={styles.statVal}>$1,240</Text>
            <Text style={styles.statLbl}>Earnings</Text>
          </Card>

          <Card style={styles.statBox}>
            <Zap size={16} color="#f472b6" />
            <Text style={styles.statVal}>999+</Text>
            <Text style={styles.statLbl}>Hype Taps</Text>
          </Card>
        </View>

        {/* Audio Engine & Preferences Card */}
        <Card style={styles.settingsCard}>
          <Text style={styles.cardSectionHeader}>SOUNDBOARD PREFERENCES</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingTitle}>Tactile Pad Vibration</Text>
              <Text style={styles.settingSub}>Vibrate when triggering sound pads & tappers</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={(val) => {
                triggerHaptic('selection');
                setHapticsEnabled(val);
              }}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#9333ea' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingTitle}>Zero-Latency Core</Text>
              <Text style={styles.settingSub}>Preload audio clips for zero trigger delay</Text>
            </View>
            <Switch
              value={lowLatencyAudio}
              onValueChange={(val) => {
                triggerHaptic('selection');
                setLowLatencyAudio(val);
              }}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#9333ea' }}
              thumbColor="#ffffff"
            />
          </View>
        </Card>

        {/* Streamer Tools Menu */}
        <Card style={styles.menuCard}>
          <Text style={styles.cardSectionHeader}>STREAM COMPANION TOOLS</Text>

          <Pressable
            onPress={() => router.push('/(tabs)/library')}
            style={styles.menuItem}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Volume2 size={18} color="#c084fc" />
            </View>
            <Text style={styles.menuText}>Full Soundboard Library</Text>
            <ChevronRight size={18} color="rgba(255, 255, 255, 0.35)" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/tappers')}
            style={styles.menuItem}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(217, 70, 239, 0.15)' }]}>
              <Zap size={18} color="#d946ef" />
            </View>
            <Text style={styles.menuText}>TikTok Live Tapper Counters</Text>
            <ChevronRight size={18} color="rgba(255, 255, 255, 0.35)" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/income')}
            style={styles.menuItem}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <DollarSign size={18} color="#10b981" />
            </View>
            <Text style={styles.menuText}>Stream Earnings & Tips Tracker</Text>
            <ChevronRight size={18} color="rgba(255, 255, 255, 0.35)" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/todo')}
            style={styles.menuItem}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <CheckSquare size={18} color="#3b82f6" />
            </View>
            <Text style={styles.menuText}>Pre-Stream Checklist & Tasks</Text>
            <ChevronRight size={18} color="rgba(255, 255, 255, 0.35)" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/suggestions')}
            style={styles.menuItem}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Lightbulb size={18} color="#f59e0b" />
            </View>
            <Text style={styles.menuText}>Viewer Suggestions Box</Text>
            <ChevronRight size={18} color="rgba(255, 255, 255, 0.35)" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/support')}
            style={styles.menuItem}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
              <HelpCircle size={18} color="#ec4899" />
            </View>
            <Text style={styles.menuText}>Support & Discord Community</Text>
            <ChevronRight size={18} color="rgba(255, 255, 255, 0.35)" />
          </Pressable>
        </Card>

        {/* Disconnect Station Button */}
        <Pressable
          onPress={handleLogout}
          style={styles.logoutBtn}
        >
          <LogOut size={16} color="#ef4444" />
          <Text style={styles.logoutBtnText}>Disconnect Console Station</Text>
        </Pressable>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 18,
  },
  profileHeader: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  avatarGlowWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  avatarBorder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  liveIndicatorDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#070414',
  },
  creatorName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  handleText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  stationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(33, 230, 210, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(33, 230, 210, 0.3)',
    marginTop: 4,
  },
  stationBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#21e6d2',
    letterSpacing: 0.6,
  },
  statsCardRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(24, 15, 46, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    borderRadius: 18,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  statLbl: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
    fontWeight: '600',
  },
  settingsCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(24, 15, 46, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    gap: 14,
  },
  cardSectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  settingSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  menuCard: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(24, 15, 46, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    gap: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginTop: 6,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ef4444',
  },
});
