# DIY Hardware Wallet 🔐

A secure Solana hardware wallet using ESP32 with Ed25519 signing, encrypted communication, and multi-factor authentication.

## Features

✅ **Hardware Security**
- Ed25519 key generation on ESP32
- Hardware RNG for cryptographic randomness
- PIN-protected encrypted key storage
- 3-attempt lockout (persists across reboots)

✅ **Encrypted Communication**
- USB: ECDH key exchange + AES-GCM encryption
- WiFi: ECDH key exchange + AES-GCM encryption
- Optional TLS wrapper for WiFi

✅ **User Experience**
- 4-button interface (UP, DOWN, OK, BACK)
- OLED display for transaction details
- 12-word mnemonic backup/recovery
- Transaction confirmation with hash preview

---

## Quick Start

### 1. Flash ESP32

1. Open `wallet_main/wallet_main.ino` in Arduino IDE
2. Install required libraries (Sketch → Include Library → Manage Libraries):
   - **U8g2** - OLED display driver
   - **ArduinoJson** - JSON parsing
3. Select your ESP32 board
4. Upload!

> **Note:** TLS uses ESP32's built-in mbedTLS - no additional library needed!

### 2. Run PC App

**Windows:** Navigate to `pc_app/` and double-click **`START_WALLET.bat`**

**Mac/Linux:**
```bash
cd pc_app
chmod +x START_WALLET.sh
./START_WALLET.sh
```

**First run:** Automatically installs dependencies and opens `config.json` for you to enter your ESP32's IP address.

**Every run after:** Just starts the wallet!

---

## Hardware Requirements

| Component | Description |
|-----------|-------------|
| ESP32 | Any ESP32 board with WiFi |
| OLED Display | 128x64 I2C SSD1306 |
| Buttons | 4x momentary push buttons |
| Wiring | See below |

### Button Wiring

| Button | Color | GPIO | Function |
|--------|-------|------|----------|
| OK | White | 4 | Confirm/Approve |
| DOWN | Red | 23 | Decrement/Reject |
| UP | Blue | 19 | Increment/Scroll |
| BACK | Blue | 18 | Back/Cancel |

All buttons connect to GND (use internal pull-up).

---

## Usage

### First Boot
1. Power on ESP32
2. Set 4-digit PIN (UP/DOWN to change digit, OK to confirm)
3. Confirm PIN
4. Write down 12-word mnemonic backup!

### Normal Boot
1. Power on ESP32
2. Enter PIN
3. Select WiFi or USB mode
4. Connect with PC client

### USB Mode
1. Select USB on ESP32
2. Run `wallet_cli.py` → Option 2
3. Enter COM port (Windows) or /dev/ttyUSB0 (Linux)
4. Verify pairing code on OLED
5. Press OK to approve

### WiFi Mode
1. Select WiFi on ESP32
2. Note the IP address shown
3. Update `config.json` with IP
4. Run `wallet_cli.py` → Option 1

---

## Security

| Feature | Implementation |
|---------|---------------|
| Key Storage | AES-GCM encrypted with PIN |
| Key Derivation | PBKDF2-like (10,000 SHA256 iterations) |
| USB Encryption | ECDH secp256r1 + AES-GCM |
| WiFi Encryption | TLS 1.2 + ECDH + AES-GCM |
| Mnemonic Storage | AES-GCM encrypted |
| PIN Lockout | 3 attempts, persists across reboots |

### TLS Certificates

The TLS certificates are **bundled with the project**:
- **ESP32:** Embedded in `wallet_main/tls_server.h`
- **PC Client:** Stored in `pc_app/tls/server.crt`

When you copy the project to another PC, everything works automatically:
1. The ESP32 already has certs compiled in
2. The PC client loads `tls/server.crt` automatically
3. No manual certificate installation needed!

**To regenerate certificates** (optional):
```bash
cd pc_app/tls
python generate_certs.py
# Then update tls_server.h with new cert/key
```

---

## File Structure

```
DIY_Hardware_Wallet/
├── wallet_main/          # ESP32 firmware
│   ├── wallet_main.ino   # Main firmware
│   ├── key_storage.h     # Encrypted key management
│   ├── display_ui.h      # OLED display functions
│   └── crypto/           # Cryptographic functions
├── pc_app/               # Python PC client
│   ├── wallet_cli.py     # Main CLI application
│   ├── secure_channel.py # AES-GCM encryption
│   ├── comm_selector.py  # USB/WiFi connection
│   ├── config.json       # Configuration
│   └── requirements.txt  # Python dependencies
├── setup.bat             # Windows setup
├── setup.sh              # Unix setup
└── run_wallet.bat        # Quick launcher
```

---

## Troubleshooting

**"Connection refused"**
- Check ESP32 IP address in config.json
- Ensure ESP32 and PC are on same network

**"Wrong PIN" lockout**
- After 3 failed attempts, device locks permanently
- Erase flash and restore from mnemonic

**USB not detected**
- Install CH340/CP2102 drivers
- Try different USB port

**Compilation errors**
- Install all required Arduino libraries
- Use ESP32 board package 2.x+

---

## License

MIT License - See LICENSE file
