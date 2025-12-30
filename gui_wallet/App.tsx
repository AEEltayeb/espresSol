// Buffer polyfill for React Native
import { Buffer } from 'buffer';
global.Buffer = Buffer;
import bs58 from 'bs58';

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
import { solanaService } from './src/services/SolanaService';

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
  <Svg width={size} height={size} viewBox="0 0 512 512">
    {/* Steam ribbons - floating higher */}
    <Path
      d="M270 20c-30 35-18 60 12 88 28 26 32 48 8 72"
      stroke={COLORS.primary}
      strokeWidth="16"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity="0.5"
    />
    <Path
      d="M230 40c-24 30-14 50 10 74 22 22 26 40 6 60"
      stroke={COLORS.primary}
      strokeWidth="20"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Cup body - connected path including rim */}
    <Path
      d="M160 210 L352 210 L352 290 C352 340 306 380 256 380 C206 380 160 340 160 290 Z"
      stroke={COLORS.primary}
      strokeWidth="20"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Handle */}
    <Path
      d="M352 240 C400 240 420 260 420 290 C420 320 400 340 352 340"
      stroke={COLORS.primary}
      strokeWidth="20"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Saucer - main curve */}
    <Path
      d="M120 410 Q256 470 392 410"
      stroke={COLORS.primary}
      strokeWidth="20"
      strokeLinecap="round"
      fill="none"
    />
    {/* Saucer shadow - parallel curve with proper spacing */}
    <Path
      d="M140 445 Q256 495 372 445"
      stroke={COLORS.primary}
      strokeWidth="14"
      strokeLinecap="round"
      fill="none"
      opacity="0.4"
    />
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
  const [recentAddresses, setRecentAddresses] = useState<string[]>([]);

  // Fetch recent addresses when send modal opens
  useEffect(() => {
    if (showSend && publicKey) {
      const fetchRecent = async () => {
        try {
          const txs = await solanaService.getTransactionHistory(publicKey, 20);
          // Get unique addresses we sent TO (not ourselves)
          const sentTo = txs
            .filter(tx => tx.type === 'send' && tx.otherParty !== publicKey)
            .map(tx => tx.otherParty)
            .filter((addr, idx, arr) => arr.indexOf(addr) === idx)
            .slice(0, 3);
          setRecentAddresses(sentTo);
        } catch (e) {
          console.log('[Send] Could not fetch recent addresses');
        }
      };
      fetchRecent();
    }
  }, [showSend, publicKey]);

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

    // Validate recipient address
    if (!solanaService.isValidAddress(sendAddress)) {
      setMessage('Invalid Solana address');
      return;
    }

    // Convert comma to dot for European number format support
    const normalizedAmount = sendAmount.replace(',', '.');
    const lamports = Math.floor(parseFloat(normalizedAmount) * 1e9);
    if (isNaN(lamports) || lamports <= 0) {
      setMessage('Invalid amount');
      return;
    }

    if (lamports > balance) {
      setMessage('Insufficient balance');
      return;
    }

    setSending(true);
    setShowSend(false);
    setMessage('Building transaction...');

    try {
      // Prepare transfer message for ESP32 signing
      const { messageHex, blockhash, messageBytes } = await solanaService.prepareTransfer(
        publicKey,
        sendAddress,
        lamports
      );

      // Send to ESP32 for signing
      setMessage('Confirm on device...');
      console.log('[Send] Message hex length:', messageHex.length);

      const signatureB58 = await walletService.sign(messageHex);

      if (!signatureB58) {
        throw new Error('No signature returned');
      }

      console.log('[Send] Received signature:', signatureB58.slice(0, 20) + '...');

      // Convert signature from Base58 to hex for broadcast
      setMessage('Broadcasting to Solana...');
      const sigBytes = bs58.decode(signatureB58);
      const sigHex = Buffer.from(sigBytes).toString('hex');

      // Broadcast the signed transaction
      const txSignature = await solanaService.sendSignedTransaction(messageBytes, sigHex);

      console.log('[Send] Transaction broadcast! Sig:', txSignature);
      setMessage(`Success! TX: ${txSignature.slice(0, 12)}...`);
      setSendAddress('');
      setSendAmount('');

      // Refresh balance after a delay
      setTimeout(async () => {
        await refreshBalance();
      }, 3000);

      // Clear message after showing success
      setTimeout(() => {
        setMessage('');
      }, 8000);

    } catch (e: any) {
      console.error('[Send] Error:', e);
      if (e.message === 'rejected') {
        setMessage('Transaction rejected on device');
      } else if (e.message?.includes('timeout')) {
        setMessage('Signing timed out - try again');
      } else if (e.message?.includes('blockhash')) {
        setMessage('Transaction expired - try again');
      } else {
        setMessage('Error: ' + e.message);
      }
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
      {/* Header */}
      <View style={styles.pageHeader}>
        <EspressoLogo size={32} />
        <Text style={styles.pageTitle}>Home</Text>
      </View>

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

              {/* Recent Addresses Pills */}
              {recentAddresses.length > 0 && (
                <View style={styles.recentRow}>
                  <Text style={styles.recentLabel}>Recent:</Text>
                  {recentAddresses.map((addr) => (
                    <TouchableOpacity
                      key={addr}
                      style={styles.recentPill}
                      onPress={() => setSendAddress(addr)}
                    >
                      <Text style={styles.recentPillText}>
                        {addr.slice(0, 4)}...{addr.slice(-4)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

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

function AnalyticsTab() {
  const { balance, balanceHistory, solPrice, balanceUSD, publicKey } = useWalletStore();
  const solBalance = balance / 1e9;
  const [transactions, setTransactions] = useState<Array<{
    signature: string;
    type: 'send' | 'receive' | 'unknown';
    amount: number;
    otherParty: string;
    blockTime: number | null;
  }>>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  // Fetch real transactions from Solana
  useEffect(() => {
    if (!publicKey) return;

    const fetchTransactions = async () => {
      setLoadingTx(true);
      try {
        const txs = await solanaService.getTransactionHistory(publicKey, 10);
        setTransactions(txs);
      } catch (e) {
        console.error('[Analytics] Error fetching transactions:', e);
      }
      setLoadingTx(false);
    };

    fetchTransactions();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, [publicKey]);

  // Prepare chart data - ensure at least 2 points and handle zero values
  const chartValues = balanceHistory.length > 0
    ? balanceHistory.map(h => Math.max(h.balance / 1e9, 0.0001))
    : [solBalance || 0.0001, solBalance || 0.0001];

  const chartLabels = balanceHistory.length > 0
    ? balanceHistory.map(h => h.date.slice(5, 10))
    : ['Start', 'Now'];

  const chartData = {
    labels: chartLabels,
    datasets: [{ data: chartValues, strokeWidth: 2 }],
  };

  // Format time ago
  const timeAgo = (timestamp: number | null) => {
    if (!timestamp) return 'Unknown';
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <ChartIcon active={true} />
        <Text style={styles.pageTitle}>Analytics</Text>
      </View>

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
          <Text style={styles.statValue}>{transactions.length}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
      </View>

      <Text style={styles.chartTitle}>Balance History (SOL)</Text>
      <LineChart
        data={chartData}
        width={Dimensions.get('window').width - 40}
        height={180}
        yAxisSuffix=""
        yAxisLabel=""
        chartConfig={{
          backgroundColor: COLORS.card,
          backgroundGradientFrom: COLORS.card,
          backgroundGradientTo: COLORS.bg,
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
          labelColor: () => COLORS.textMuted,
          propsForDots: { r: '5', strokeWidth: '2', stroke: COLORS.primary },
          propsForBackgroundLines: { strokeDasharray: '', stroke: COLORS.border },
          fillShadowGradientFrom: COLORS.primary,
          fillShadowGradientTo: 'transparent',
          fillShadowGradientOpacity: 0.3,
        }}
        bezier
        style={styles.chart}
        fromZero={true}
      />

      {/* Transactions Section */}
      <Text style={[styles.chartTitle, { marginTop: 24 }]}>Recent Transactions</Text>
      {loadingTx ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No transactions yet</Text>
        </View>
      ) : (
        transactions.map((tx) => (
          <View key={tx.signature} style={styles.txItem}>
            <View style={[styles.txIcon, tx.type === 'receive' ? styles.txIconReceive : styles.txIconSend]}>
              <Text style={styles.txIconText}>{tx.type === 'receive' ? '↓' : '↑'}</Text>
            </View>
            <View style={styles.txDetails}>
              <Text style={styles.txTitle}>
                {tx.type === 'receive'
                  ? `From ${tx.otherParty.slice(0, 6)}...`
                  : `To ${tx.otherParty.slice(0, 6)}...`}
              </Text>
              <Text style={styles.txDate}>{timeAgo(tx.blockTime)}</Text>
            </View>
            <Text style={[styles.txAmount, tx.type === 'receive' ? styles.txAmountReceive : styles.txAmountSend]}>
              {tx.type === 'receive' ? '+' : '-'}{(tx.amount / 1e9).toFixed(4)} SOL
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ===== PROFILE TAB =====
function ProfileTab({ setMessage }: { setMessage: (m: string) => void }) {
  const { publicKey, disconnect } = useWalletStore();
  const [showRecover, setShowRecover] = useState(false);
  const [words, setWords] = useState<string[]>(Array(12).fill(''));
  const [recovering, setRecovering] = useState(false);

  const handleRecovery = async () => {
    // Validate all words are entered
    const cleanWords = words.map(w => w.trim().toLowerCase());
    if (cleanWords.some(w => !w)) {
      setMessage('Please enter all 12 words');
      return;
    }

    setRecovering(true);
    setShowRecover(false);
    setMessage('Recovering wallet...');

    try {
      const success = await walletService.recover(cleanWords);
      if (success) {
        setMessage('Recovery successful! Device restarting...');
        setWords(Array(12).fill(''));
        // Disconnect since device will restart
        setTimeout(() => {
          disconnect();
        }, 3000);
      } else {
        setMessage('Recovery failed - check words');
      }
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    }
    setRecovering(false);
  };

  const updateWord = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value.toLowerCase().trim();
    setWords(newWords);
  };

  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <UserIcon active={true} />
        <Text style={styles.pageTitle}>Profile</Text>
      </View>

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

      <TouchableOpacity style={styles.menuItem} onPress={() => setShowRecover(true)}>
        <Text style={styles.menuIconText}>🔄</Text>
        <Text style={styles.menuText}>Recover Wallet</Text>
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

      {/* Recovery Modal */}
      <Modal visible={showRecover} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '90%' }]}>
              <Text style={styles.modalTitle}>Recover Wallet</Text>
              <Text style={[styles.hint, { marginBottom: 16 }]}>
                Enter your 12-word backup phrase to restore wallet on the hardware device.
              </Text>

              <ScrollView style={{ maxHeight: 300 }}>
                {words.map((word, index) => (
                  <View key={index} style={styles.wordInputRow}>
                    <Text style={styles.wordNumber}>{index + 1}.</Text>
                    <TextInput
                      style={[styles.input, styles.wordInput]}
                      value={word}
                      onChangeText={(val) => updateWord(index, val)}
                      placeholder={`Word ${index + 1}`}
                      placeholderTextColor={COLORS.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.button, { marginTop: 16 }]}
                onPress={handleRecovery}
                disabled={recovering}
              >
                {recovering ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Recover</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { marginTop: 8 }]}
                onPress={() => setShowRecover(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
        <TouchableOpacity style={styles.messageBanner} onPress={() => setMessage('')} activeOpacity={0.8}>
          <Text style={styles.messageText}>{message}</Text>
          <Text style={styles.dismissHint}>Tap to dismiss</Text>
        </TouchableOpacity>
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

  // Page Header
  pageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginLeft: 12 },

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
  dismissHint: { color: COLORS.textMuted, textAlign: 'center', fontSize: 10, marginTop: 4 },

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

  // Recent Address Pills
  recentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' },
  recentLabel: { color: COLORS.textMuted, fontSize: 12, marginRight: 8 },
  recentPill: { backgroundColor: COLORS.primary + '30', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 4, borderWidth: 1, borderColor: COLORS.primary + '50' },
  recentPillText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },

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

  // Recovery Word Input
  wordInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  wordNumber: { color: COLORS.textMuted, fontSize: 14, width: 30 },
  wordInput: { flex: 1, marginBottom: 0, padding: 12 },

  // Transactions
  txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txIconReceive: { backgroundColor: COLORS.success + '30' },
  txIconSend: { backgroundColor: COLORS.error + '30' },
  txIconText: { fontSize: 18 },
  txDetails: { flex: 1 },
  txTitle: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  txDate: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txAmountReceive: { color: COLORS.success },
  txAmountSend: { color: COLORS.error },
  emptyState: { alignItems: 'center', padding: 32 },
  emptyStateText: { color: COLORS.textMuted, fontSize: 14 },

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
