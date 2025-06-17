// Simple encryption/decryption using Web Crypto API
export class CryptoUtils {
  private static checkCryptoAvailability(): void {
    if (typeof window === 'undefined') {
      throw new Error('Web Crypto API is not available in server-side context. This feature requires a browser environment.');
    }
    
    if (typeof crypto === 'undefined') {
      throw new Error('Web Crypto API is not available. This feature requires a secure context (HTTPS) and a modern browser.');
    }
    
    if (!crypto.subtle) {
      throw new Error('SubtleCrypto API is not available. This feature requires a secure context (HTTPS). Please ensure you are accessing the site via HTTPS.');
    }
  }

  private static async deriveKey(
    password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    CryptoUtils.checkCryptoAvailability();
    
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }

  static async encrypt(plaintext: string, password: string): Promise<string> {
    CryptoUtils.checkCryptoAvailability();
    
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await this.deriveKey(password, salt);
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encoder.encode(plaintext)
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(
      salt.length + iv.length + encrypted.byteLength
    );
    combined.set(salt);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return btoa(String.fromCharCode(...Array.from(combined)));
  }

  static async decrypt(
    encryptedData: string,
    password: string
  ): Promise<string> {
    CryptoUtils.checkCryptoAvailability();
    
    const decoder = new TextDecoder();
    const combined = new Uint8Array(
      atob(encryptedData)
        .split("")
        .map((char) => char.charCodeAt(0))
    );

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    const key = await this.deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encrypted
    );

    return decoder.decode(decrypted);
  }
}
