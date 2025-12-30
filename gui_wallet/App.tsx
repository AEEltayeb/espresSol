import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  Alert,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import * as Clipboard from 'expo-clipboard';
import Svg, { Path, Circle, G, Rect } from 'react-native-svg';
import { useWalletStore } from './src/store/walletStore';
import { walletService } from './src/services/WalletService';

const COLORS = {
  bg: '#0a0a12',
  card: '#16162a',
  primary: '#8b5cf6',
  secondary: '#c4a77d',
  success: '#22c55e',
  error: '#ef4444',
  text: '#ffffff',
  textMuted: '#9ca3af',
  border: '#2d2d4a',
  glass: 'rgba(40, 40, 70, 0.85)',
};

// ===== SVG ICONS =====
const EspressoLogo = ({ size = 48 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    {/* Cup */}
    <Path d="M16 28 L48 28 L44 56 C43 58 41 60 38 60 L26 60 C23 60 21 58 20 56 Z" fill={COLORS.secondary} />
    <Path d="M18 28 L46 28 L43 54 C42.5 55.5 41 57 38 57 L26 57 C23 57 21.5 55.5 21 54 Z" fill="#d4b78d" />
    {/* Handle */}
    <Path d="M48 32 Q58 32 58 42 Q58 52 48 52" stroke={COLORS.secondary} strokeWidth="4" fill="none" />
    {/* Coffee */}
    <Rect x="20" y="30" width="24" height="6" rx="2" fill="#5c3d2e" />
    {/* Steam */}
    <Path d="M28 8 Q26 14 28 20 Q30 26 28 28" stroke={COLORS.textMuted} strokeWidth="2" fill="none" opacity="0.6" />
    <Path d="M36 4 Q34 12 36 18 Q38 24 36 28" stroke={COLORS.textMuted} strokeWidth="2" fill="none" opacity="0.6" />
    <Path d="M32 10 Q30 16 32 22 Q34 26 32 28" stroke={COLORS.textMuted} strokeWidth="2" fill="none" opacity="0.4" />
  </Svg>
);

const HomeIcon = ({ active }: { active: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9.5L12 3L21 9.5V20C21 20.5 20.5 21 20 21H15V14H9V21H4C3.5 21 3 20.5 3 20V9.5Z"
      stroke={active ? COLORS.primary : COLORS.textMuted}
      strokeWidth="2"
      fill={active ? COLORS.primary + '30' : 'none'}
    />
  </Svg>
);

const ChartIcon = ({ active }: { active: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 3V21H21"
      stroke={active ? COLORS.primary : COLORS.textMuted}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Path
      d="M7 14L12 9L15 12L21 6"
      stroke={active ? COLORS.primary : COLORS.textMuted}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const UserIcon = ({ active }: { active: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12" cy="8" r="4"
      stroke={active ? COLORS.primary : COLORS.textMuted}
      strokeWidth="2"
      fill={active ? COLORS.primary + '30' : 'none'}
    />
    <Path
      d="M4 20C4 16.5 7.5 14 12 14C16.5 14 20 16.5 20 20"
      stroke={active ? COLORS.primary : COLORS.textMuted}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const SendIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M12 19V5M12 5L6 11M12 5L18 11" stroke={COLORS.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ReceiveIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5V19M12 19L6 13M12 19L18 13" stroke={COLORS.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const DropIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C12 2 6 10 6 14C6 17.3 8.7 20 12 20C15.3 20 18 17.3 18 14C18 10 12 2 12 2Z" stroke={COLORS.text} strokeWidth="2" fill={COLORS.primary + '40'} />
  </Svg>
);

const KeyIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Circle cx="8" cy="15" r="4" stroke={COLORS.text} strokeWidth="2" />
    <Path d="M11 12L20 3M18 3L20 3L20 5M15 8L17 6" stroke={COLORS.text} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// ===== CONNECT SCREEN =====
function ConnectScreen() {
  const { deviceIP, connect, connecting, connectionError, loadSavedIP } = useWalletStore();
  const [ip, setIp] = useState(deviceIP || '');

  useEffect(() => {
    loadSavedIP().then((savedIp) => {
      if (savedIp) setIp(savedIp);
    });
  }, []);

  const handleConnect = async () => {
    Keyboard.dismiss();
    if (!ip.trim()) return;
    await connect(ip.trim());
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.connectCard} keyboardShouldPersistTaps="handled">
          <EspressoLogo size={80} />
          <Text style={styles.title}>espresSol</Text>
          <Text style={styles.subtitle}>Hardware Wallet for Solana</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Device IP Address</Text>
            <TextInput
              style={styles.input}
              value={ip}
              onChangeText={setIp}
              placeholder="192.168.1.100"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleConnect}
            />
          </View>

          <Text style={styles.hint}>Find IP on your ESP32 OLED screen</Text>

          {connectionError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{connectionError}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, connecting && styles.buttonDisabled]}
            onPress={handleConnect}
            disabled={connecting}
          >
            {connecting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Connect</Text>}
          </TouchableOpacity>
        </ScrollView>
        <StatusBar style="light" />
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

// ===== HOME TAB =====
function HomeTab({ setMessage }: { setMessage: (m: string) => void }) {
  const { publicKey, balance, balanceUSD, solPrice, refreshBalance } = useWalletStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [airdropLoading, setAirdropLoading] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    setRefreshing(false);
  };

  const copyAddress = async () => {
    if (!publicKey) return;
    await Clipboard.setStringAsync(publicKey);
    setMessage('Address copied!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAirdrop = async () => {
    if (!publicKey) return;
    setAirdropLoading(true);
    setMessage('Requesting airdrop...');
    try {
      const response = await fetch('https://api.devnet.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'requestAirdrop',
          params: [publicKey, 1000000000],
        }),
      });
      const data = await response.json();
      if (data.result) {
        setMessage('Airdrop sent! Refreshing in 10s...');
        setTimeout(async () => { await refreshBalance(); setMessage(''); }, 10000);
      } else {
        setMessage('Airdrop failed: ' + (data.error?.message || 'Unknown'));
      }
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    }
    setAirdropLoading(false);
  };

  const handleShowMnemonic = async () => {
    setMessage('Check your device screen!');
    try {
      await walletService.showMnemonic();
      setTimeout(() => setMessage(''), 3000);
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    }
  };

  const handleSend = async () => {
    if (!sendAddress || !sendAmount || !publicKey) {
      setMessage('Enter address and amount');
      return;
    }
    const lamports = Math.floor(parseFloat(sendAmount) * 1e9);
    if (isNaN(lamports) || lamports <= 0) {
      setMessage('Invalid amount');
      return;
    }
    setSending(true);
    setShowSend(false);
    setMessage('Building transaction...');
    try {
      const bhResp = await fetch('https://api.devnet.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'getLatestBlockhash',
          params: [{ commitment: 'finalized' }],
        }),
      });
      const bhData = await bhResp.json();
      const blockhash = bhData.result?.value?.blockhash;
      if (!blockhash) throw new Error('Failed to get blockhash');

      const messageToSign = JSON.stringify({
        type: 'transfer', from: publicKey, to: sendAddress, amount: lamports, blockhash,
      });
      const msgHex = Buffer.from(messageToSign).toString('hex');

      setMessage('Confirm on device...');
      const signature = await walletService.sign(msgHex);

      if (signature) {
        setMessage('Transaction signed!');
        setSendAddress('');
        setSendAmount('');
        setTimeout(() => { refreshBalance(); setMessage(''); }, 2000);
      }
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    }
    setSending(false);
  };

  const solBalance = balance / 1e9;
  const shortAddress = publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}` : '';

  return (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceValue}>
          {solBalance.toFixed(4)} <Text style={styles.balanceCurrency}>SOL</Text>
        </Text>
        <Text style={styles.balanceUSD}>${balanceUSD.toFixed(2)} USD</Text>
        <Text style={styles.priceHint}>1 SOL = ${solPrice.toFixed(2)}</Text>
      </View>

      {/* Address */}
      <TouchableOpacity style={styles.addressCard} onPress={copyAddress}>
        <Text style={styles.addressLabel}>Tap to copy</Text>
        <Text style={styles.addressShort}>{shortAddress}</Text>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowSend(true)}>
          <View style={styles.actionIconWrap}><SendIcon /></View>
          <Text style={styles.actionLabel}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={copyAddress}>
          <View style={styles.actionIconWrap}><ReceiveIcon /></View>
          <Text style={styles.actionLabel}>Receive</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, airdropLoading && styles.buttonDisabled]} onPress={handleAirdrop} disabled={airdropLoading}>
          <View style={styles.actionIconWrap}><DropIcon /></View>
          <Text style={styles.actionLabel}>Airdrop</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShowMnemonic}>
          <View style={styles.actionIconWrap}><KeyIcon /></View>
          <Text style={styles.actionLabel}>Backup</Text>
        </TouchableOpacity>
      </View>

      {/* Send Modal */}
      <Modal visible={showSend} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Send SOL</Text>
              <TextInput style={styles.input} value={sendAddress} onChangeText={setSendAddress} placeholder="Recipient address" placeholderTextColor={COLORS.textMuted} autoCapitalize="none" />
              <TextInput style={[styles.input, { marginTop: 12 }]} value={sendAmount} onChangeText={setSendAmount} placeholder="Amount (SOL)" placeholderTextColor={COLORS.textMuted} keyboardType="decimal-pad" />
              <Text style={styles.hint}>Balance: {solBalance.toFixed(4)} SOL</Text>
              <TouchableOpacity style={[styles.button, { marginTop: 16 }]} onPress={handleSend} disabled={sending}>
                {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.cancelButton, { marginTop: 8 }]} onPress={() => setShowSend(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
}

// ===== ANALYTICS TAB =====
function AnalyticsTab() {
  const { balance, balanceHistory, solPrice, balanceUSD } = useWalletStore();
  const solBalance = balance / 1e9;

  const chartData = {
    labels: balanceHistory.length > 0 ? balanceHistory.map(h => h.date.slice(5, 10)) : ['Now'],
    datasets: [{ data: balanceHistory.length > 0 ? balanceHistory.map(h => h.balance / 1e9) : [solBalance] }],
  };

  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{solBalance.toFixed(4)}</Text>
          <Text style={styles.statLabel}>SOL Balance</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${balanceUSD.toFixed(2)}</Text>
          <Text style={styles.statLabel}>USD Value</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${solPrice.toFixed(2)}</Text>
          <Text style={styles.statLabel}>SOL Price</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{balanceHistory.length}</Text>
          <Text style={styles.statLabel}>Days Tracked</Text>
        </View>
      </View>

      <Text style={styles.chartTitle}>Balance History</Text>
      <LineChart
        data={chartData}
        width={Dimensions.get('window').width - 40}
        height={200}
        chartConfig={{
          backgroundColor: COLORS.card,
          backgroundGradientFrom: COLORS.card,
          backgroundGradientTo: COLORS.bg,
          decimalPlaces: 3,
          color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
          labelColor: () => COLORS.textMuted,
          propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary },
        }}
        bezier
        style={styles.chart}
      />
    </ScrollView>
  );
}

// ===== PROFILE TAB =====
function ProfileTab({ setMessage }: { setMessage: (m: string) => void }) {
  const { publicKey, disconnect } = useWalletStore();

  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
      <View style={styles.profileHeader}>
        <EspressoLogo size={56} />
        <Text style={styles.profileName}>espresSol</Text>
      </View>

      <View style={styles.profileCard}>
        <Text style={styles.profileLabel}>Wallet Address</Text>
        <Text style={styles.profileValue}>{publicKey}</Text>
      </View>

      <TouchableOpacity style={styles.menuItem} onPress={async () => {
        setMessage('Check your device!');
        await walletService.showMnemonic();
      }}>
        <KeyIcon />
        <Text style={styles.menuText}>Backup Phrase</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => setMessage('Network: Devnet')}>
        <Text style={styles.menuIconText}>🌐</Text>
        <Text style={styles.menuText}>Network</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => setMessage('Settings coming soon!')}>
        <Text style={styles.menuIconText}>⚙️</Text>
        <Text style={styles.menuText}>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.menuItem, styles.dangerItem]} onPress={disconnect}>
        <Text style={styles.menuIconText}>🚪</Text>
        <Text style={[styles.menuText, { color: COLORS.error }]}>Disconnect</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ===== MAIN DASHBOARD =====
function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<'home' | 'analytics' | 'profile'>('home');
  const [message, setMessage] = useState('');

  return (
    <View style={styles.container}>
      {message !== '' && (
        <View style={styles.messageBanner}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}

      {activeTab === 'home' && <HomeTab setMessage={setMessage} />}
      {activeTab === 'analytics' && <AnalyticsTab />}
      {activeTab === 'profile' && <ProfileTab setMessage={setMessage} />}

      {/* Frosted Glass Navigation Bar */}
      <View style={styles.navContainer}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
            <HomeIcon active={activeTab === 'home'} />
            <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('analytics')}>
            <ChartIcon active={activeTab === 'analytics'} />
            <Text style={[styles.navLabel, activeTab === 'analytics' && styles.navLabelActive]}>Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
            <UserIcon active={activeTab === 'profile'} />
            <Text style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <StatusBar style="light" />
    </View>
  );
}

// ===== MAIN APP =====
export default function App() {
  const { connected } = useWalletStore();
  return connected ? <DashboardScreen /> : <ConnectScreen />;
}

// ===== STYLES =====
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  tabContent: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 120 },

  // Connect
  connectCard: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, paddingTop: 80 },
  title: { fontSize: 32, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  subtitle: { fontSize: 16, color: COLORS.textMuted, marginBottom: 40 },

  // Inputs
  inputContainer: { width: '100%', marginBottom: 12 },
  inputLabel: { color: COLORS.textMuted, marginBottom: 8, fontSize: 14 },
  input: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16, color: COLORS.text, fontSize: 16 },
  hint: { color: COLORS.textMuted, fontSize: 12, marginBottom: 16, textAlign: 'center' },

  // Buttons
  button: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, width: '100%' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: COLORS.text, fontSize: 17, fontWeight: '600', textAlign: 'center' },
  cancelButton: { backgroundColor: COLORS.border },

  // Errors
  errorBox: { backgroundColor: COLORS.error + '20', borderColor: COLORS.error, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16, width: '100%' },
  errorText: { color: COLORS.error, textAlign: 'center' },

  // Message
  messageBanner: { backgroundColor: COLORS.glass, padding: 14, marginHorizontal: 20, marginTop: 50, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  messageText: { color: COLORS.text, textAlign: 'center', fontSize: 14 },

  // Balance
  balanceCard: { backgroundColor: COLORS.card, borderRadius: 24, padding: 28, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  balanceLabel: { color: COLORS.textMuted, fontSize: 14, marginBottom: 8 },
  balanceValue: { color: COLORS.text, fontSize: 40, fontWeight: '700' },
  balanceCurrency: { fontSize: 22, color: COLORS.primary },
  balanceUSD: { color: COLORS.success, fontSize: 20, marginTop: 6 },
  priceHint: { color: COLORS.textMuted, fontSize: 12, marginTop: 8 },

  // Address
  addressCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
  addressLabel: { color: COLORS.textMuted, fontSize: 12, marginBottom: 4 },
  addressShort: { color: COLORS.primary, fontSize: 18, fontWeight: '600' },

  // Actions
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionIconWrap: { backgroundColor: COLORS.card, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  actionLabel: { color: COLORS.textMuted, fontSize: 12 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: COLORS.card, borderRadius: 24, padding: 28, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { color: COLORS.text, fontSize: 24, fontWeight: '700', marginBottom: 24, textAlign: 'center' },

  // Analytics
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { width: '48%', backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statValue: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
  statLabel: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  chartTitle: { color: COLORS.textMuted, fontSize: 14, marginBottom: 12 },
  chart: { borderRadius: 16 },

  // Profile
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  profileName: { color: COLORS.text, fontSize: 24, fontWeight: '700', marginTop: 12 },
  profileCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
  profileLabel: { color: COLORS.textMuted, fontSize: 12, marginBottom: 4 },
  profileValue: { color: COLORS.text, fontSize: 11, fontFamily: 'monospace' },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  menuIconText: { fontSize: 20, marginRight: 14 },
  menuText: { color: COLORS.text, fontSize: 16, marginLeft: 12 },
  dangerItem: { borderColor: COLORS.error + '50' },

  // Navigation Bar - Frosted Glass Pill
  navContainer: { position: 'absolute', bottom: 24, left: 24, right: 24 },
  navBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.glass,
    borderRadius: 40,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  navItem: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 6 },
  navLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 4, fontWeight: '500' },
  navLabelActive: { color: COLORS.primary },
});
