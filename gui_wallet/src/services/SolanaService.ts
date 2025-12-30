/**
 * SolanaService - Handles Solana transaction building and broadcasting
 * Mirrors the Python wallet_cli.py functionality  
 */
import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import base58 from 'bs58';

// Polyfill Buffer for React Native
global.Buffer = Buffer;

const RPC_URL = 'https://api.devnet.solana.com';

class SolanaService {
    private connection: Connection;

    constructor() {
        this.connection = new Connection(RPC_URL, 'confirmed');
    }

    // Get balance in lamports
    async getBalance(pubkeyString: string): Promise<number> {
        try {
            const pubkey = new PublicKey(pubkeyString);
            return await this.connection.getBalance(pubkey);
        } catch (e) {
            console.error('[Solana] Balance error:', e);
            throw e;
        }
    }

    // Get SOL price from CoinGecko
    async getSolPrice(): Promise<number> {
        try {
            const resp = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
            );
            const data = await resp.json();
            return data.solana?.usd || 0;
        } catch {
            return 0;
        }
    }

    // Request airdrop (devnet only)
    async requestAirdrop(pubkeyString: string, lamports: number = LAMPORTS_PER_SOL): Promise<string> {
        try {
            const pubkey = new PublicKey(pubkeyString);
            const signature = await this.connection.requestAirdrop(pubkey, lamports);
            await this.connection.confirmTransaction(signature, 'confirmed');
            return signature;
        } catch (e: any) {
            console.error('[Solana] Airdrop error:', e);
            throw new Error(e.message || 'Airdrop failed');
        }
    }

    // Build transfer transaction and return message bytes for signing
    async buildTransferTransaction(
        fromPubkeyString: string,
        toPubkeyString: string,
        lamports: number
    ): Promise<{ transaction: Transaction; messageBytes: Buffer; blockhash: string }> {
        try {
            const fromPubkey = new PublicKey(fromPubkeyString);
            const toPubkey = new PublicKey(toPubkeyString);

            // Get latest blockhash
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('finalized');

            // Create transfer instruction
            const transferInstruction = SystemProgram.transfer({
                fromPubkey,
                toPubkey,
                lamports,
            });

            // Build transaction
            const transaction = new Transaction({
                feePayer: fromPubkey,
                blockhash,
                lastValidBlockHeight,
            });
            transaction.add(transferInstruction);

            // Get the message bytes for signing
            const messageBytes = transaction.serializeMessage();

            console.log('[Solana] Transaction built:');
            console.log('  From:', fromPubkeyString);
            console.log('  To:', toPubkeyString);
            console.log('  Lamports:', lamports);
            console.log('  Blockhash:', blockhash);
            console.log('  Message length:', messageBytes.length);

            return { transaction, messageBytes, blockhash };
        } catch (e: any) {
            console.error('[Solana] Build error:', e);
            throw new Error(e.message || 'Failed to build transaction');
        }
    }

    // Attach signature to transaction and broadcast
    async sendSignedTransaction(
        transaction: Transaction,
        signatureBase58: string,
        signerPubkeyString: string
    ): Promise<string> {
        try {
            const signerPubkey = new PublicKey(signerPubkeyString);

            // Decode base58 signature
            const signatureBytes = base58.decode(signatureBase58);

            if (signatureBytes.length !== 64) {
                throw new Error(`Invalid signature length: ${signatureBytes.length}, expected 64`);
            }

            // Add the signature to the transaction
            transaction.addSignature(signerPubkey, Buffer.from(signatureBytes));

            // Verify the signature is valid
            if (!transaction.verifySignatures()) {
                throw new Error('Signature verification failed');
            }

            // Serialize and send
            const rawTransaction = transaction.serialize();

            console.log('[Solana] Broadcasting transaction...');
            const txSignature = await this.connection.sendRawTransaction(rawTransaction, {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
            });

            console.log('[Solana] Transaction sent:', txSignature);

            // Wait for confirmation
            const confirmation = await this.connection.confirmTransaction(txSignature, 'confirmed');

            if (confirmation.value.err) {
                throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
            }

            console.log('[Solana] Transaction confirmed!');
            return txSignature;
        } catch (e: any) {
            console.error('[Solana] Send error:', e);
            throw new Error(e.message || 'Failed to send transaction');
        }
    }

    // Full send flow: build, sign externally, broadcast
    async prepareTransfer(
        fromPubkey: string,
        toPubkey: string,
        lamports: number
    ): Promise<{ messageHex: string; transaction: Transaction }> {
        const { transaction, messageBytes } = await this.buildTransferTransaction(
            fromPubkey,
            toPubkey,
            lamports
        );

        // Convert message bytes to hex for ESP32
        const messageHex = Buffer.from(messageBytes).toString('hex');

        return { messageHex, transaction };
    }

    // Get explorer URL for transaction
    getExplorerUrl(signature: string): string {
        return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
    }

    // Validate Solana address
    isValidAddress(address: string): boolean {
        try {
            new PublicKey(address);
            return true;
        } catch {
            return false;
        }
    }
}

export const solanaService = new SolanaService();
