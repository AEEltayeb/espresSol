/**
 * WalletService - Core communication layer for ESP32 Hardware Wallet
 * Handles WebSocket connection, command sending, and response handling
 */

export interface WalletResponse {
  ok: boolean;
  error?: string;
  pubkey?: string;
  sig_b58?: string;
  pong?: boolean;
}

class WalletService {
  private ws: WebSocket | null = null;
  private connected = false;
  private pendingResolves: Map<string, (value: WalletResponse) => void> = new Map();

  // Connect to ESP32 WebSocket server
  async connect(ip: string, port: number = 8444): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const url = `ws://${ip}:${port}`;
        console.log(`[WS] Connecting to ${url}...`);

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('[WS] Connected!');
          this.connected = true;
          resolve(true);
        };

        this.ws.onclose = () => {
          console.log('[WS] Disconnected');
          this.connected = false;
        };

        this.ws.onerror = (error) => {
          console.error('[WS] Error:', error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const data: WalletResponse = JSON.parse(event.data);
            console.log('[WS] Received:', data);

            // Resolve any pending promise
            this.pendingResolves.forEach((resolve, key) => {
              resolve(data);
              this.pendingResolves.delete(key);
            });
          } catch (e) {
            console.error('[WS] Parse error:', e);
          }
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.connected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (e) {
        reject(e);
      }
    });
  }

  // Disconnect from ESP32
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  // Send command and wait for response
  private async sendCommand(cmd: object): Promise<WalletResponse> {
    return new Promise((resolve, reject) => {
      if (!this.ws || !this.connected) {
        reject(new Error('Not connected'));
        return;
      }

      const id = Date.now().toString();
      this.pendingResolves.set(id, resolve);

      const payload = JSON.stringify(cmd);
      console.log('[WS] Sending:', payload);
      this.ws.send(payload);

      // Timeout after 60 seconds (for signing which requires user interaction)
      setTimeout(() => {
        if (this.pendingResolves.has(id)) {
          this.pendingResolves.delete(id);
          reject(new Error('Command timeout'));
        }
      }, 60000);
    });
  }

  // Get wallet public key
  async getPublicKey(): Promise<string> {
    const resp = await this.sendCommand({ cmd: 'PUBKEY' });
    if (!resp.ok || !resp.pubkey) {
      throw new Error(resp.error || 'Failed to get public key');
    }
    return resp.pubkey;
  }

  // Ping device
  async ping(): Promise<boolean> {
    const resp = await this.sendCommand({ cmd: 'PING' });
    return resp.ok === true && resp.pong === true;
  }

  // Sign transaction
  async sign(messageHex: string): Promise<string> {
    const resp = await this.sendCommand({ cmd: 'SIGN', msg: messageHex });
    if (!resp.ok || !resp.sig_b58) {
      throw new Error(resp.error || 'Signing failed');
    }
    return resp.sig_b58;
  }

  // Show mnemonic on device
  async showMnemonic(): Promise<boolean> {
    const resp = await this.sendCommand({ cmd: 'SHOW_MNEMONIC' });
    return resp.ok === true;
  }

  // Set WiFi credentials
  async setWifi(ssid: string, password: string): Promise<boolean> {
    const resp = await this.sendCommand({ cmd: 'SET_WIFI', ssid, password });
    return resp.ok === true;
  }

  // Recover wallet from mnemonic
  async recover(words: string[]): Promise<boolean> {
    if (words.length !== 12) {
      throw new Error('Mnemonic must be exactly 12 words');
    }

    const cmd: any = { cmd: 'RECOVER' };
    words.forEach((word, i) => {
      cmd[`word${i}`] = word;
    });

    const resp = await this.sendCommand(cmd);
    return resp.ok === true;
  }

  // Factory reset device
  async factoryReset(): Promise<boolean> {
    const resp = await this.sendCommand({ cmd: 'FACTORY_RESET' });
    return resp.ok === true;
  }

  // Check if connected
  isConnected(): boolean {
    return this.connected;
  }
}

// Singleton instance
export const walletService = new WalletService();
