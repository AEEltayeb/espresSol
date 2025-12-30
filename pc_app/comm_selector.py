# comm_selector.py
"""
Communication selector for Hardware Wallet
Supports both USB and WiFi connections to ESP32
"""
import socket
import ssl
import os


# Default ESP32 address - UPDATE THIS with your ESP32's IP!
ESP32_HOST = "172.20.10.9"  
ESP32_PORT = 8443

# TLS settings
USE_TLS = True  # Set to True to enable TLS
TLS_CERT_PATH = os.path.join(os.path.dirname(__file__), "tls", "server.crt")


def run_wifi():
    """
    Connect to ESP32 wallet over WiFi.
    The ESP32 runs as a TCP server on port 8443.
    If USE_TLS is True, wraps connection in TLS.
    Communications are also encrypted with AES-GCM SecureChannel on top.
    """
    print(f"[*] Connecting to ESP32 at {ESP32_HOST}:{ESP32_PORT}...")
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(30)
    
    try:
        sock.connect((ESP32_HOST, ESP32_PORT))
        
        if USE_TLS:
            print("[*] Wrapping connection with TLS...")
            context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
            context.check_hostname = False  # ESP32 uses IP, not hostname
            
            # Load bundled certificate for verification
            if os.path.exists(TLS_CERT_PATH):
                context.verify_mode = ssl.CERT_REQUIRED
                context.load_verify_locations(TLS_CERT_PATH)
                print(f"[+] Loaded certificate from {TLS_CERT_PATH}")
            else:
                # Fallback: accept any cert (less secure but works)
                context.verify_mode = ssl.CERT_NONE
                print("[!] Certificate not found, accepting self-signed")
            
            sock = context.wrap_socket(sock, server_hostname=ESP32_HOST)
            print("[+] TLS handshake complete!")
        
        print("[+] Connected to ESP32 wallet!")
        return sock
    except ssl.SSLError as e:
        print(f"[!] TLS error: {e}")
        print("[!] ESP32 may not support TLS. Set USE_TLS=False to use plain TCP.")
        return None
    except ConnectionRefusedError:
        print(f"[!] Connection refused. Is the ESP32 running and on the network?")
        print(f"[!] Make sure ESP32 IP is {ESP32_HOST}")
        return None
    except socket.timeout:
        print(f"[!] Connection timed out. Check ESP32 is reachable.")
        return None
    except Exception as e:
        print(f"[!] Connection failed: {e}")
        return None


def run_usb():
    """
    Connect to ESP32 wallet over USB serial.
    Returns tuple of (serial_port, aes_key) after pairing.
    """
    try:
        from usb.usb_pair import run_usb as usb_pair
        return usb_pair()
    except ImportError as e:
        print(f"[!] USB support not available: {e}")
        print("[!] Install pyserial: pip install pyserial")
        return None


def select_comm():
    """
    Interactive communication method selector.
    Returns socket for WiFi, or (serial, aes_key) tuple for USB.
    """
    print("\n=== Communication Selector ===")
    print("1) WiFi (connect to ESP32 server)")
    print("2) USB (serial connection)")
    
    method = input("\nSelect [1/2] or [wifi/usb]: ").strip().lower()
    
    if method in ("1", "wifi"):
        return run_wifi()
    elif method in ("2", "usb"):
        return run_usb()
    else:
        print("Unknown method. Please select 'wifi' or 'usb'.")
        return None


if __name__ == "__main__":
    result = select_comm()
    if result:
        print("[OK] Connection established!")
    else:
        print("[!] No connection.")
