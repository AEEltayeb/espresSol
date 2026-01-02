# Security Implementation Guide
## DIY Hardware Wallet - ESP32

This document describes all security measures implemented in the hardware wallet.

---

## 1. Cryptography

| Feature | Implementation | Protects Against |
|---------|---------------|-----------------|
| **Ed25519 Signatures** | TweetNaCl (constant-time) | Transaction forgery, timing attacks |
| **BIP39 Mnemonics** | Standard 2048 wordlist | Non-standard recovery, incompatibility |
| **SLIP-0010 Derivation** | Solana path m/44'/501'/0'/0' | Key derivation errors |
| **AES-128-GCM** | mbedtls library | Key decryption, tampering |
| **SHA-256/512** | Hardware accelerated | Hash collisions |
| **ECDH P-256** | Secure key exchange | Session interception |

---

## 2. Key Storage

| Feature | Implementation | Protects Against |
|---------|---------------|-----------------|
| **Encrypted Private Key** | AES-GCM with PIN-derived key | Plaintext key exposure |
| **Random Salt** | 16 bytes via TRNG | Rainbow table attacks |
| **PIN Key Derivation** | 10,000 SHA256 iterations | Brute force (offline) |
| **Encrypted Mnemonic** | AES-GCM storage | Seed phrase theft |

---

## 3. Authentication

| Feature | Implementation | Protects Against |
|---------|---------------|-----------------|
| **4-Digit PIN** | Required to unlock | Unauthorized access |
| **Brute Force Protection** | Exponential backoff (1s→256s) | PIN guessing |
| **Device Wipe** | After 10 failed attempts | Persistent attackers |
| **Persistent Counter** | Survives reboot | Power cycle bypass |
| **Session Timeout** | 5-minute auto-lock | Unattended device |

---

## 4. Communication Security

| Channel | Security | Protects Against |
|---------|----------|-----------------|
| **USB** | ECDH + AES-GCM + Pairing Code | USB sniffing, MITM |
| **WiFi TLS** | TLS 1.2 + TOFU | Network interception |
| **WiFi WebSocket** | ECDH + AES-GCM + Pairing Code | Session hijacking |

---

## 5. Physical Confirmation

| Operation | Requirement | Protects Against |
|-----------|-------------|-----------------|
| **Sign Transaction** | OK button press | Unauthorized signing |
| **Set WiFi** | OK button confirmation | Remote reconfiguration |
| **Wallet Recovery** | 6-digit device code | Unauthorized recovery |
| **Mobile Pairing** | 6-digit code + OK button | Rogue connections |

---

## 6. Rate Limiting

| Feature | Limit | Protects Against |
|---------|-------|-----------------|
| **Sign Requests** | 5 per minute | Rapid fund drain |

---

## 7. Entropy Source

| Feature | Implementation | Protects Against |
|---------|---------------|-----------------|
| **Hardware TRNG** | esp_fill_random() | Predictable keys |
| **Used For** | Keys, IVs, salts, codes | Weak randomness |

---

## Summary

```
┌─────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                       │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Physical Button Confirmation                  │
│  Layer 2: PIN + Brute Force Protection                  │
│  Layer 3: Session Timeout                               │
│  Layer 4: Rate Limiting                                 │
│  Layer 5: Encrypted Communication (TLS/ECDH+AES)        │
│  Layer 6: Encrypted Key Storage (AES-GCM)               │
│  Layer 7: Standard Cryptography (Ed25519, BIP39)        │
│  Layer 8: Hardware Entropy (ESP32 TRNG)                 │
└─────────────────────────────────────────────────────────┘
```
