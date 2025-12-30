#pragma once
/*
 * TLS Server Implementation using ESP32's built-in mbedTLS
 * Provides TLS-wrapped TCP server functionality
 * 
 * No external library required - uses ESP32 Arduino core's mbedtls
 */

#include <WiFi.h>
#include <WiFiClient.h>
#include "mbedtls/ssl.h"
#include "mbedtls/entropy.h"
#include "mbedtls/ctr_drbg.h"
#include "mbedtls/error.h"
#include "mbedtls/net_sockets.h"
#include "mbedtls/pk.h"
#include "mbedtls/x509_crt.h"

// Self-signed certificate for ESP32 Hardware Wallet
static const char server_cert_pem[] = R"(
-----BEGIN CERTIFICATE-----
MIIC3zCCAcegAwIBAgIUL4+bLlpkUrg1lA7sGpscWQ7jYFEwDQYJKoZIhvcNAQEL
BQAwHzEdMBsGA1UEAwwUSGFyZHdhcmVXYWxsZXRTZXJ2ZXIwHhcNMjUxMjMwMDk1
NTA5WhcNMzUxMjI4MDk1NTA5WjAfMR0wGwYDVQQDDBRIYXJkd2FyZVdhbGxldFNl
cnZlcjCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAIto9UAEjXL2PfsL
8BWMSla1Cpdp+3ORJF4k5ucygNrj/kvW3v4mav4fIlKUORHIllkenU5p7KV0Fruu
FaMayBwrQfwE5AaYSdHP01qrkTXM0I1zEvd1pmXK4aId0xLOljxeq0u4qO0pTlb3
v75zBEU/MYkD0tum7e3Qwg08HMVoxRD0emdSpEvmWY3DYuBjwvy+iSWLZh8ORUaG
dd+ntPhFYsjUSlDVu9ry09ru6wO802RHY7wuXMwJmerWioH80T5hwCJ8kYkYeGRZ
mW6ppMb67aHWG2tjajewA7IDdX7DTi5zm9oWl5joKl/1SclWMz/BFyhaXd32Uo2J
goq/ZLECAwEAAaMTMBEwDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOC
AQEAaeV41TPDUVtQ2Iq38KBk8pwZICavv7sCknHEsBP+iWk0pp8LY4a6HmhUuoXi
v8XKgZzlx67DQQmCuzEBg/6tIguk+5uu8VT7WI9Qgr4dwUt636fiLxHdaW7HT3mL
uO7KSi6SJKemY1yvY0Of59Rortk3ZAjeEQEUvxvBc4f93WttyiCu9QRrys4W4Ud4
fvTmPKxBJjfFxNBQLacxFSMLO5Nkt2A5hMqT+hG8iXQTc3pzlWbz70ufe2dI537/
DwwYzBzB7CC9ZIuROOhAFayVoo2ypsm0gumS3h3ZGsOYA+KTjEHhQtG723aqIzub
00x8XxVTtSGB2+MNHH3gJ0CGBw==
-----END CERTIFICATE-----
)";

static const char server_key_pem[] = R"(
-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEAi2j1QASNcvY9+wvwFYxKVrUKl2n7c5EkXiTm5zKA2uP+S9be
/iZq/h8iUpQ5EciWWR6dTmnspXQWu64VoxrIHCtB/ATkBphJ0c/TWquRNczQjXMS
93WmZcrhoh3TEs6WPF6rS7io7SlOVve/vnMERT8xiQPS26bt7dDCDTwcxWjFEPR6
Z1KkS+ZZjcNi4GPC/L6JJYtmHw5FRoZ136e0+EViyNRKUNW72vLT2u7rA7zTZEdj
vC5czAmZ6taKgfzRPmHAInyRiRh4ZFmZbqmkxvrtodYba2NqN7ADsgN1fsNOLnOb
2haXmOgqX/VJyVYzP8EXKFpd3fZSjYmCir9ksQIDAQABAoIBABYqMxoBT0r4pxyX
xo1qf3Q/NwahWVMDv9Q/Cj42e6Gxr5/3sv8V9RtfsFmQSu2OpobXVPvfX/pjVWz0
DekfjDLcVtKepXF9+3iiEhC/p+f1ny/qHJkfCbxz8AFSPBmool7JT3NL0gHY+CVg
IQqC52oqFLJb2wXEyd3ue7fWd52UIW3m6QzClkOXcncfDJUgbxPcmsOJDQFOGFN/
qFB43JiqKpfFqo6TmNFB4BI8/+szqyKVaFmUISebbcJQvxl1YKTuxauVTIVHwqmQ
Z0cWUDX+97q+2Pn2OhhUsXQNG09bDf2YgMtWB32Hq30f6fGTdq4JGl+n+8zwD+FM
Yu6h2aUCgYEAwnpadDQ55FAE4nN5I2NB08lwTelDZJCjSBQlPciQN4Z6nl9+6+/j
VAInJQrKynlc830/IhlwRAA5zhSm9r3KLMhxPjU4JklAiSgoinEcxp8EhPMSLYgP
wM81csM+e2NBmz7R4v7DHuvKbocCrNzarxTbgFDTi0M0Y+RDhjoCn00CgYEAt4L4
ExHFoI/wYIdLg7GDPv+e7J5FpYA2+Uzjy1CrnozarOBJ9F1kl2c40kTiQrkT2DTN
ss5F0J6j2iqg4MQRxFZPLjsaDDDnqoIn1j44FHa83pt6HPqIehsS9X+vxX0BO51F
eB9BvK5XNKm/V67lqMAbqTzNbZkoZo9fE6+YsPUCgYEAn6GS0cN0qYVNHRuvmW6F
v/Oe7TTFDqzyed2fXAFe71TBHXJBWiTEMla6Dtu27U+FDpAF3FWJIygUSqYFDo9m
fi/hVDCW8EY8ZNjDvi9ucVJhgUeL6je+xoLO2m6MwPcOCQIdgfef7aeZt/O2LHH0
RrYWHlM58Ruuyze4fVrsgBkCgYEAstRtXV/vP6WlMNwHicFdzfGadKlT45ELgWwd
fE8Tv0EyBE/Zocm1MhnD9JxuBWmIXiQu4/VBcah2si7iccaALd2R8dJkcsbhq3aE
zbH6Qm7nZOMMX9sBTkS9+AFDT+eeYPLE9Oc4z17x2n8k2JS2dvkmu4hmBEzBYxiK
JYvz91UCgYEApoDKFaea3KuwcyKffgaUg9Ayn5M+DE1jbkTW8l8JEskF8lOTRXv7
DIMVZO6AKycjF5wkohSSMc/FL+aINEKwf+pO9jb9/dp5GY4jalyLwyCbmSonMCNp
Dg0TMEkicVDFyRWrCik7YQblfZsGqKvaecmdR2tJc/r3olIU7TOkvDg=
-----END RSA PRIVATE KEY-----
)";

// TLS-wrapped client connection
class TLSClient {
private:
  WiFiClient* tcpClient;
  mbedtls_ssl_context ssl;
  mbedtls_ssl_config conf;
  mbedtls_x509_crt srvcert;
  mbedtls_pk_context pkey;
  mbedtls_entropy_context entropy;
  mbedtls_ctr_drbg_context ctr_drbg;
  bool handshakeComplete;
  
  // BIO callbacks for mbedtls
  static int bioSend(void* ctx, const unsigned char* buf, size_t len) {
    WiFiClient* client = (WiFiClient*)ctx;
    if (!client->connected()) return MBEDTLS_ERR_NET_CONN_RESET;
    return client->write(buf, len);
  }
  
  static int bioRecv(void* ctx, unsigned char* buf, size_t len) {
    WiFiClient* client = (WiFiClient*)ctx;
    if (!client->connected()) return MBEDTLS_ERR_NET_CONN_RESET;
    if (!client->available()) return MBEDTLS_ERR_SSL_WANT_READ;
    return client->read(buf, len);
  }
  
public:
  TLSClient() : tcpClient(nullptr), handshakeComplete(false) {}
  
  bool begin(WiFiClient* client) {
    tcpClient = client;
    
    // Initialize mbedtls
    mbedtls_ssl_init(&ssl);
    mbedtls_ssl_config_init(&conf);
    mbedtls_x509_crt_init(&srvcert);
    mbedtls_pk_init(&pkey);
    mbedtls_entropy_init(&entropy);
    mbedtls_ctr_drbg_init(&ctr_drbg);
    
    // Seed RNG
    int ret = mbedtls_ctr_drbg_seed(&ctr_drbg, mbedtls_entropy_func, &entropy,
                                     (const unsigned char*)"tls_server", 10);
    if (ret != 0) {
      Serial.printf("[TLS] RNG seed failed: -0x%x\n", -ret);
      return false;
    }
    
    // Parse certificate
    ret = mbedtls_x509_crt_parse(&srvcert, (const unsigned char*)server_cert_pem,
                                  strlen(server_cert_pem) + 1);
    if (ret != 0) {
      Serial.printf("[TLS] Cert parse failed: -0x%x\n", -ret);
      return false;
    }
    
    // Parse private key
    ret = mbedtls_pk_parse_key(&pkey, (const unsigned char*)server_key_pem,
                                strlen(server_key_pem) + 1, NULL, 0,
                                mbedtls_ctr_drbg_random, &ctr_drbg);
    if (ret != 0) {
      Serial.printf("[TLS] Key parse failed: -0x%x\n", -ret);
      return false;
    }
    
    // Configure SSL
    ret = mbedtls_ssl_config_defaults(&conf, MBEDTLS_SSL_IS_SERVER,
                                       MBEDTLS_SSL_TRANSPORT_STREAM,
                                       MBEDTLS_SSL_PRESET_DEFAULT);
    if (ret != 0) {
      Serial.printf("[TLS] Config failed: -0x%x\n", -ret);
      return false;
    }
    
    mbedtls_ssl_conf_rng(&conf, mbedtls_ctr_drbg_random, &ctr_drbg);
    mbedtls_ssl_conf_authmode(&conf, MBEDTLS_SSL_VERIFY_NONE);
    
    ret = mbedtls_ssl_conf_own_cert(&conf, &srvcert, &pkey);
    if (ret != 0) {
      Serial.printf("[TLS] Own cert config failed: -0x%x\n", -ret);
      return false;
    }
    
    ret = mbedtls_ssl_setup(&ssl, &conf);
    if (ret != 0) {
      Serial.printf("[TLS] SSL setup failed: -0x%x\n", -ret);
      return false;
    }
    
    // Set BIO callbacks
    mbedtls_ssl_set_bio(&ssl, tcpClient, bioSend, bioRecv, NULL);
    
    Serial.println("[TLS] Starting handshake...");
    
    // Perform handshake with timeout
    unsigned long start = millis();
    while ((ret = mbedtls_ssl_handshake(&ssl)) != 0) {
      if (ret != MBEDTLS_ERR_SSL_WANT_READ && ret != MBEDTLS_ERR_SSL_WANT_WRITE) {
        Serial.printf("[TLS] Handshake failed: -0x%x\n", -ret);
        return false;
      }
      if (millis() - start > 10000) {
        Serial.println("[TLS] Handshake timeout");
        return false;
      }
      delay(10);
    }
    
    handshakeComplete = true;
    Serial.println("[TLS] Handshake complete!");
    return true;
  }
  
  int write(const uint8_t* buf, size_t len) {
    if (!handshakeComplete) return -1;
    return mbedtls_ssl_write(&ssl, buf, len);
  }
  
  int read(uint8_t* buf, size_t len) {
    if (!handshakeComplete) return -1;
    int ret = mbedtls_ssl_read(&ssl, buf, len);
    if (ret == MBEDTLS_ERR_SSL_WANT_READ) return 0;
    return ret;
  }
  
  size_t print(const String& s) {
    return write((const uint8_t*)s.c_str(), s.length());
  }
  
  size_t println(const String& s) {
    size_t n = print(s);
    n += write((const uint8_t*)"\n", 1);
    return n;
  }
  
  bool connected() {
    return handshakeComplete && tcpClient && tcpClient->connected();
  }
  
  bool available() {
    return connected() && (mbedtls_ssl_get_bytes_avail(&ssl) > 0 || tcpClient->available());
  }
  
  String readStringUntil(char terminator) {
    String result;
    uint8_t c;
    unsigned long start = millis();
    while (millis() - start < 5000) {
      int ret = read(&c, 1);
      if (ret > 0) {
        if (c == terminator) break;
        result += (char)c;
        start = millis();
      } else {
        delay(10);
      }
    }
    return result;
  }
  
  void stop() {
    if (handshakeComplete) {
      mbedtls_ssl_close_notify(&ssl);
    }
    mbedtls_ssl_free(&ssl);
    mbedtls_ssl_config_free(&conf);
    mbedtls_x509_crt_free(&srvcert);
    mbedtls_pk_free(&pkey);
    mbedtls_entropy_free(&entropy);
    mbedtls_ctr_drbg_free(&ctr_drbg);
    if (tcpClient) tcpClient->stop();
    handshakeComplete = false;
  }
  
  ~TLSClient() {
    stop();
  }
};

// Simple TLS Server wrapper
class TLSServer {
private:
  WiFiServer* tcpServer;
  uint16_t port;
  bool started;
  
public:
  TLSServer() : tcpServer(nullptr), port(0), started(false) {}
  
  bool begin(uint16_t p) {
    port = p;
    tcpServer = new WiFiServer(port);
    tcpServer->begin();
    started = true;
    Serial.printf("[TLS] Server listening on port %d\n", port);
    return true;
  }
  
  // Returns raw TCP client - caller must wrap with TLSClient for TLS
  WiFiClient available() {
    if (!started || !tcpServer) return WiFiClient();
    return tcpServer->available();
  }
  
  void end() {
    if (tcpServer) {
      tcpServer->end();
      delete tcpServer;
      tcpServer = nullptr;
    }
    started = false;
  }
};

// Global TLS server
TLSServer tlsServer;
