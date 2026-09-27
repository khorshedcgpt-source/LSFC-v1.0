/**
 * ============================================================================
 * LSFC FIELD-LEVEL CRYPTOGRAPHY MODULE (AES-GCM 256-bit)
 * ============================================================================
 *
 * CRITICAL SECURITY BOUNDARY & LIMITATION:
 * Since LSFC is a 100% client-side local-first browser application with no
 * backend server, any cryptographic device key must reside in the browser
 * environment (localStorage: "lsfc.deviceKey").
 *
 * This encryption-at-rest model protects sensitive citizen identifiers (NID)
 * against casual exposure:
 *   - Someone inspecting browser localStorage directly
 *   - A leaked or shared JSON backup file being read outside this installation
 *   - Incidental exposure in devtools or exported snapshot files
 *
 * HOWEVER, it does NOT protect against an attacker who has full code-execution
 * access to the running browser origin itself or physical access to the device
 * where they can evaluate scripts in this origin.
 * ============================================================================
 */

export const STORAGE_KEY_DEVICE_KEY = "lsfc.deviceKey";
const ENCRYPTION_PREFIX = "enc:v1:"; // Prefix for versioning ciphertext
const ALGORITHM_NAME = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH_BYTES = 12; // 96 bits recommended for AES-GCM

let cachedCryptoKey: CryptoKey | null = null;
let keyInitPromise: Promise<CryptoKey> | null = null;

// Helpers for Base64 conversion with ArrayBuffers
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Retrieves the device key or generates a new 256-bit AES-GCM key on first run.
 * Stored in a separate localStorage key ("lsfc.deviceKey") away from customer data.
 */
export async function getOrCreateDeviceKey(): Promise<CryptoKey> {
  if (cachedCryptoKey) return cachedCryptoKey;
  if (keyInitPromise) return keyInitPromise;

  keyInitPromise = (async () => {
    if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
      throw new Error("Web Crypto API is not available in this environment.");
    }

    try {
      const rawStoredKey = localStorage.getItem(STORAGE_KEY_DEVICE_KEY);
      if (rawStoredKey) {
        const jwk = JSON.parse(rawStoredKey);
        const imported = await window.crypto.subtle.importKey(
          "jwk",
          jwk,
          { name: ALGORITHM_NAME, length: KEY_LENGTH },
          true,
          ["encrypt", "decrypt"]
        );
        cachedCryptoKey = imported;
        return imported;
      }

      // First run: generate a fresh AES-GCM 256-bit symmetric key
      const generated = await window.crypto.subtle.generateKey(
        { name: ALGORITHM_NAME, length: KEY_LENGTH },
        true,
        ["encrypt", "decrypt"]
      );

      const exportedJwk = await window.crypto.subtle.exportKey("jwk", generated);
      localStorage.setItem(STORAGE_KEY_DEVICE_KEY, JSON.stringify(exportedJwk));
      cachedCryptoKey = generated;
      return generated;
    } catch (err) {
      console.error("[fieldCrypto] Failed to initialize device cryptographic key:", err);
      throw err;
    } finally {
      keyInitPromise = null;
    }
  })();

  return keyInitPromise;
}

/** Checks whether a given string is already encrypted with our format */
export function isEncryptedField(value?: string | null): boolean {
  if (!value || typeof value !== "string") return false;
  return value.startsWith(ENCRYPTION_PREFIX);
}

/**
 * Encrypts a plaintext string using AES-GCM with a random IV.
 * Returns formatted ciphertext: "enc:v1:<base64IV>:<base64Ciphertext>"
 */
export async function encryptField(plaintext?: string | null): Promise<string> {
  if (!plaintext || typeof plaintext !== "string" || !plaintext.trim()) {
    return plaintext || "";
  }

  // Idempotency: do not double-encrypt
  if (isEncryptedField(plaintext)) {
    return plaintext;
  }

  try {
    const key = await getOrCreateDeviceKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      { name: ALGORITHM_NAME, iv },
      key,
      encoded
    );

    const ivB64 = bufferToBase64(iv.buffer);
    const cipherB64 = bufferToBase64(ciphertextBuffer);

    return `${ENCRYPTION_PREFIX}${ivB64}:${cipherB64}`;
  } catch (err) {
    console.error("[fieldCrypto] Encryption failed, returning plain text safely:", err);
    return plaintext;
  }
}

/**
 * Decrypts a ciphertext string formatted as "enc:v1:<base64IV>:<base64Ciphertext>".
 * Graceful fallback: If decryption fails (e.g. deviceKey lost/reinstalled),
 * returns empty string "" rather than crashing the application.
 */
export async function decryptField(ciphertext?: string | null): Promise<string> {
  if (!ciphertext || typeof ciphertext !== "string") {
    return "";
  }

  // If not encrypted, it is legacy plaintext — return as is
  if (!isEncryptedField(ciphertext)) {
    return ciphertext;
  }

  try {
    const key = await getOrCreateDeviceKey();
    const payload = ciphertext.slice(ENCRYPTION_PREFIX.length);
    const separatorIdx = payload.indexOf(":");
    if (separatorIdx === -1) {
      console.warn("[fieldCrypto] Malformed ciphertext structure.");
      return "";
    }

    const ivB64 = payload.slice(0, separatorIdx);
    const cipherB64 = payload.slice(separatorIdx + 1);

    const ivBytes = base64ToUint8Array(ivB64);
    const cipherBytes = base64ToUint8Array(cipherB64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: ALGORITHM_NAME, iv: ivBytes as unknown as BufferSource },
      key,
      cipherBytes as unknown as BufferSource
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    // Decryption failed gracefully (wrong key, corrupted record, or different installation)
    console.warn("[fieldCrypto] Decryption failed for field. Falling back to blank value.", err);
    return "";
  }
}
