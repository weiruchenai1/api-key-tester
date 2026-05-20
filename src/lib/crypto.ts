const KEY_STORE_KEY = 'aes_key_v1';
const ALGORITHM = 'AES-GCM';
const MARKER = 'v1:';

async function getOrCreateKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(KEY_STORE_KEY);
  if (stored) {
    try {
      const raw = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
      return await crypto.subtle.importKey('raw', raw, ALGORITHM, false, ['encrypt', 'decrypt']);
    } catch {
      localStorage.removeItem(KEY_STORE_KEY);
    }
  }

  const key = await crypto.subtle.generateKey({ name: ALGORITHM, length: 256 }, true, ['encrypt', 'decrypt']);
  const exported = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  localStorage.setItem(KEY_STORE_KEY, btoa(String.fromCharCode(...exported)));
  return key;
}

export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) return '';
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoded);
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return MARKER + btoa(String.fromCharCode(...combined));
}

export async function decrypt(value: string): Promise<string> {
  if (!value) return '';
  if (!value.startsWith(MARKER)) return value;
  try {
    const key = await getOrCreateKey();
    const combined = Uint8Array.from(atob(value.slice(MARKER.length)), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, data);
    return new TextDecoder().decode(decrypted);
  } catch {
    return '';
  }
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(MARKER);
}
