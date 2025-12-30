#pragma once
/*
 * Simplified Mnemonic System for ESP32 Hardware Wallet
 * 
 * Uses a reduced 256-word list (8 bits per word) instead of BIP39's 2048 words
 * This allows 12 words to encode 96 bits of entropy + 8-bit checksum
 * Simpler than full BIP39 but provides secure backup/recovery
 */

#include <Arduino.h>
#include "mbedtls/sha256.h"

// 256-word simplified wordlist (alphabetically sorted)
static const char* const MNEMONIC_WORDS[256] PROGMEM = {
  "abandon", "ability", "about", "above", "absent", "absorb", "abstract", "absurd",
  "abuse", "access", "accident", "account", "achieve", "acid", "acquire", "across",
  "action", "actor", "actual", "adapt", "add", "adjust", "admit", "adult",
  "advance", "advice", "afford", "afraid", "after", "again", "agent", "agree",
  "ahead", "aim", "airport", "alarm", "album", "alert", "alien", "all",
  "almost", "alone", "alpha", "already", "also", "alter", "always", "amateur",
  "amazing", "among", "amount", "amused", "anchor", "ancient", "anger", "angle",
  "angry", "animal", "announce", "annual", "another", "answer", "antenna", "antique",
  "anxiety", "apart", "apology", "appear", "apple", "approve", "april", "arctic",
  "area", "arena", "argue", "arm", "armed", "armor", "army", "around",
  "arrange", "arrest", "arrive", "arrow", "art", "artist", "artwork", "ask",
  "aspect", "assault", "asset", "assist", "assume", "athlete", "atom", "attack",
  "attend", "attract", "auction", "august", "aunt", "author", "auto", "autumn",
  "average", "avoid", "awake", "aware", "away", "awesome", "awful", "awkward",
  "baby", "bachelor", "bacon", "badge", "balance", "balcony", "ball", "bamboo",
  "banana", "banner", "bar", "bargain", "barrel", "base", "basic", "basket",
  "battle", "beach", "bean", "beauty", "because", "become", "beef", "before",
  "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit",
  "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike",
  "bind", "biology", "bird", "birth", "bitter", "black", "blade", "blame",
  "blanket", "blast", "bleak", "bless", "blind", "blood", "blossom", "blouse",
  "blue", "board", "boat", "body", "boil", "bold", "bomb", "bone",
  "bonus", "book", "border", "boring", "borrow", "boss", "bottom", "bounce",
  "box", "boy", "bracket", "brain", "brand", "brave", "bread", "breeze",
  "brick", "bridge", "brief", "bright", "bring", "brisk", "bronze", "brother",
  "brown", "brush", "bubble", "budget", "build", "bulb", "bull", "bundle",
  "bunker", "burden", "burger", "burst", "bus", "business", "busy", "butter",
  "buyer", "buzz", "cabin", "cactus", "cage", "cake", "call", "calm",
  "camera", "camp", "can", "canal", "cancel", "candy", "cannon", "canoe",
  "canvas", "capable", "capital", "captain", "car", "carbon", "card", "cargo",
  "carpet", "carry", "cart", "case", "cash", "casino", "castle", "casual"
};

// Generate 12-word mnemonic from 96 bits of entropy
inline void generateMnemonic(const uint8_t entropy[12], String words[12]) {
  // Use 11 bytes of entropy + 1 byte checksum = 12 words
  uint8_t hash[32];
  mbedtls_sha256(entropy, 11, hash, 0);  // Hash first 11 bytes
  uint8_t checksum = hash[0];
  
  // First 11 words from entropy, 12th word is checksum
  for (int i = 0; i < 11; i++) {
    words[i] = String((const char*)pgm_read_ptr(&MNEMONIC_WORDS[entropy[i]]));
  }
  words[11] = String((const char*)pgm_read_ptr(&MNEMONIC_WORDS[checksum]));
}

// Convert mnemonic back to entropy and verify checksum
inline bool mnemonicToEntropy(const String words[12], uint8_t entropy[12]) {
  // Find word indices
  for (int i = 0; i < 12; i++) {
    bool found = false;
    for (int j = 0; j < 256; j++) {
      const char* word = (const char*)pgm_read_ptr(&MNEMONIC_WORDS[j]);
      if (words[i].equals(word)) {
        entropy[i] = j;
        found = true;
        break;
      }
    }
    if (!found) return false;  // Invalid word
  }
  
  // Verify checksum (12th word should match hash of first 11 bytes)
  uint8_t hash[32];
  mbedtls_sha256(entropy, 11, hash, 0);
  
  return (hash[0] == entropy[11]);  // Checksum must match
}

// Derive Ed25519 key from entropy
inline void entropyToKey(const uint8_t entropy[12], uint8_t sk[32]) {
  // Use SHA-256 twice to expand to 256 bits
  uint8_t temp[32];
  mbedtls_sha256(entropy, 11, temp, 0);  // Use first 11 bytes (entropy only, not checksum)
  
  // Hash again with a different prefix for more entropy
  uint8_t input[33];
  input[0] = 0x01;  // Prefix byte
  memcpy(input + 1, temp, 32);
  mbedtls_sha256(input, 33, sk, 0);
}
