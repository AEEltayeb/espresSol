#pragma once
#include <Preferences.h>
#include <Arduino.h>
#include "crypto/ed25519.h"
#include "crypto/mnemonic.h"

// Load key from storage or generate new one with mnemonic backup
inline bool loadOrGenerateKey(Preferences& prefs, uint8_t sk[32], uint8_t pk[32], String mnemonic[12]) {
  // Check if key already exists
  if (prefs.isKey("sk")) {
    size_t n = prefs.getBytes("sk", sk, 32);
    if (n != 32) return false;
    ed25519_publickey(sk, pk);
    
    // Try to load existing mnemonic
    // FORCE REGENERATION: Delete old mnemonic format (remove this after one boot)
    if (prefs.isKey("mnemonic")) {
      prefs.remove("mnemonic");
      Serial.println("[Key] Deleted old mnemonic - will regenerate");
    }
    
    if (prefs.isKey("mnemonic")) {
      String mnemonicStr = prefs.getString("mnemonic", "");
      int wordIndex = 0;
      int start = 0;
      for (int i = 0; i <= mnemonicStr.length(); i++) {
        if (i == mnemonicStr.length() || mnemonicStr[i] == ' ') {
          if (wordIndex < 12) {
            mnemonic[wordIndex++] = mnemonicStr.substring(start, i);
          }
          start = i + 1;
        }
      }
    } else {
      // BACKWARD COMPATIBILITY: Generate mnemonic from existing key
      // Use first 11 bytes of secret key as entropy (12th will be checksum)
      uint8_t entropy[12];
      memcpy(entropy, sk, 11);  // Only copy 11 bytes
      entropy[11] = 0;  // Zero out 12th byte (will be set by generateMnemonic)
      generateMnemonic(entropy, mnemonic);
      
      // Delete old mnemonic and store new one
      prefs.remove("mnemonic");  // Clear old version first
      
      String mnemonicStr = "";
      for (int i = 0; i < 12; i++) {
        if (i > 0) mnemonicStr += " ";
        mnemonicStr += mnemonic[i];
      }
      prefs.putString("mnemonic", mnemonicStr);
      Serial.println("[Key] Generated NEW mnemonic for existing key");
    }
    return true;
  }
  
  // Generate new key with mnemonic
  uint8_t entropy[12];
  esp_fill_random(entropy, 12);  // SECURITY: Hardware RNG
  
  // Generate mnemonic from entropy
  generateMnemonic(entropy, mnemonic);
  
  // Derive key from entropy
  entropyToKey(entropy, sk);
  ed25519_publickey(sk, pk);
  
  // Store key and mnemonic
  prefs.putBytes("sk", sk, 32);
  
  // Store mnemonic as space-separated string
  String mnemonicStr = "";
  for (int i = 0; i < 12; i++) {
    if (i > 0) mnemonicStr += " ";
    mnemonicStr += mnemonic[i];
  }
  prefs.putString("mnemonic", mnemonicStr);
  
  return true;
}

// Recover wallet from mnemonic
inline bool recoverFromMnemonic(Preferences& prefs, const String mnemonic[12], 
                                 uint8_t sk[32], uint8_t pk[32]) {
  uint8_t entropy[12];
  
  // Convert mnemonic to entropy and verify checksum
  if (!mnemonicToEntropy(mnemonic, entropy)) {
    return false;  // Invalid mnemonic or bad checksum
  }
  
  // Derive key
  entropyToKey(entropy, sk);
  ed25519_publickey(sk, pk);
  
  // Store recovered key
  prefs.putBytes("sk", sk, 32);
  
  // Store mnemonic
  String mnemonicStr = "";
  for (int i = 0; i < 12; i++) {
    if (i > 0) mnemonicStr += " ";
    mnemonicStr += mnemonic[i];
  }
  prefs.putString("mnemonic", mnemonicStr);
  
  return true;
}
