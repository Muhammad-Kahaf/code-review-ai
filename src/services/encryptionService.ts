import CryptoJS from 'crypto-js';

// In a real production environment, this should be in an environment variable (e.g., import.meta.env.VITE_APP_ENCRYPTION_KEY)
const APP_SECRET = 'cr-ai-secure-vault-2024-k9x2';

export const EncryptionService = {
  /**
   * Encrypts a string value using AES-256
   */
  encrypt: (value: string, userKey: string = ''): string => {
    try {
      const secret = APP_SECRET + userKey;
      return CryptoJS.AES.encrypt(value, secret).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      return value;
    }
  },

  /**
   * Decrypts an AES-256 encrypted string
   */
  decrypt: (encryptedValue: string, userKey: string = ''): string => {
    try {
      const secret = APP_SECRET + userKey;
      const bytes = CryptoJS.AES.decrypt(encryptedValue, secret);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted || '';
    } catch (error) {
      console.error('Decryption failed:', error);
      return '';
    }
  },

  /**
   * Generates a deterministic hash for a key to obscure it in localStorage
   */
  hashKey: (key: string): string => {
    return CryptoJS.SHA256(APP_SECRET + key).toString();
  },

  /**
   * Encrypts an object by converting it to JSON first
   */
  encryptObject: (obj: unknown, userKey: string = ''): string => {
    return EncryptionService.encrypt(JSON.stringify(obj), userKey);
  },

  /**
   * Decrypts an object and parses JSON
   */
  decryptObject: <T>(encryptedValue: string, userKey: string = ''): T | null => {
    const decrypted = EncryptionService.decrypt(encryptedValue, userKey);
    if (!decrypted) return null;
    try {
      return JSON.parse(decrypted) as T;
    } catch {
      return null;
    }
  }
};
