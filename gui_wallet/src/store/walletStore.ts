/**
 * Zustand store for wallet state management
 */
import { create } from 'zustand';
import { walletService } from '../services/WalletService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WalletState {
    // Connection
    connected: boolean;
    deviceIP: string;
    connecting: boolean;
    connectionError: string | null;

    // Wallet
    publicKey: string | null;
    balance: number; // lamports
    balanceUSD: number;
    solPrice: number;

    // History
    balanceHistory: { date: string; balance: number }[];

    // Actions
    connect: (ip: string) => Promise<boolean>;
    disconnect: () => void;
    refreshBalance: () => Promise<void>;
    signTransaction: (messageHex: string) => Promise<string>;
    loadSavedIP: () => Promise<string | null>;
    saveIP: (ip: string) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
    // Initial state
    connected: false,
    deviceIP: '',
    connecting: false,
    connectionError: null,
    publicKey: null,
    balance: 0,
    balanceUSD: 0,
    solPrice: 0,
    balanceHistory: [],

    // Connect to device
    connect: async (ip: string) => {
        set({ connecting: true, connectionError: null });

        try {
            await walletService.connect(ip);
            const pubkey = await walletService.getPublicKey();

            set({
                connected: true,
                deviceIP: ip,
                publicKey: pubkey,
                connecting: false,
            });

            // Save IP for next time
            await get().saveIP(ip);

            // Fetch balance
            await get().refreshBalance();

            return true;
        } catch (e: any) {
            set({
                connected: false,
                connecting: false,
                connectionError: e.message || 'Connection failed',
            });
            return false;
        }
    },

    // Disconnect
    disconnect: () => {
        walletService.disconnect();
        set({
            connected: false,
            publicKey: null,
            balance: 0,
            balanceUSD: 0,
        });
    },

    // Refresh balance from Solana
    refreshBalance: async () => {
        const pubkey = get().publicKey;
        if (!pubkey) return;

        try {
            // Fetch balance from Solana RPC
            const response = await fetch('https://api.devnet.solana.com', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getBalance',
                    params: [pubkey],
                }),
            });

            const data = await response.json();
            const lamports = data.result?.value || 0;

            // Fetch SOL price
            try {
                const priceResp = await fetch(
                    'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
                );
                const priceData = await priceResp.json();
                const price = priceData.solana?.usd || 0;

                set({
                    balance: lamports,
                    solPrice: price,
                    balanceUSD: (lamports / 1e9) * price,
                });
            } catch {
                set({ balance: lamports });
            }

            // Add to history
            const history = get().balanceHistory;
            const today = new Date().toISOString().split('T')[0];
            const newHistory = [...history.filter(h => h.date !== today), { date: today, balance: lamports }];
            set({ balanceHistory: newHistory.slice(-7) }); // Keep last 7 days

        } catch (e) {
            console.error('Failed to fetch balance:', e);
        }
    },

    // Sign transaction
    signTransaction: async (messageHex: string) => {
        return await walletService.sign(messageHex);
    },

    // Load saved IP
    loadSavedIP: async () => {
        try {
            const ip = await AsyncStorage.getItem('esp32_ip');
            if (ip) {
                set({ deviceIP: ip });
            }
            return ip;
        } catch {
            return null;
        }
    },

    // Save IP
    saveIP: async (ip: string) => {
        try {
            await AsyncStorage.setItem('esp32_ip', ip);
            set({ deviceIP: ip });
        } catch (e) {
            console.error('Failed to save IP:', e);
        }
    },
}));
