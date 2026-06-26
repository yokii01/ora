/**
 * ORAs Shield Vault Cryptography
 * Client-side authenticated encryption using Web Crypto API (AES-GCM 256-bit + PBKDF2)
 */

const SALT_LEN = 16;
const IV_LEN = 12;
const ITERATIONS = 100000;

function bufferToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuffer(b64) {
  const str = atob(b64);
  const buf = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    buf[i] = str.charCodeAt(i);
  }
  return buf.buffer;
}

async function deriveKey(pin, saltBuf) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuf,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts any JavaScript object into an AES-GCM ciphertext payload
 */
export async function encryptVaultItem(itemObj, pin = '1111') {
  if (itemObj._is_encrypted_shield) return itemObj;

  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(itemObj));
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LEN));

  const key = await deriveKey(pin, salt);
  const ciphertextBuf = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  return {
    id: itemObj.id,
    title: itemObj.title || 'Protected Credential',
    category: itemObj.category || 'other',
    type: itemObj.type || 'password',
    created_date: itemObj.created_date || new Date().toISOString(),
    updated_date: new Date().toISOString(),
    _is_encrypted_shield: true,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertextBuf)
  };
}

/**
 * Decrypts an AES-GCM ciphertext payload back to original JavaScript object
 */
export async function decryptVaultItem(encryptedObj, pin = '1111') {
  if (!encryptedObj || !encryptedObj._is_encrypted_shield) {
    return encryptedObj; // Legacy unencrypted item
  }

  try {
    const salt = base64ToBuffer(encryptedObj.salt);
    const iv = base64ToBuffer(encryptedObj.iv);
    const ciphertext = base64ToBuffer(encryptedObj.ciphertext);

    const key = await deriveKey(pin, salt);
    const decryptedBuf = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    const parsed = JSON.parse(dec.decode(decryptedBuf));
    return { ...parsed, id: encryptedObj.id };
  } catch (err) {
    console.error('[VaultCrypto] Decryption failed (invalid PIN or corrupted data):', err);
    return {
      ...encryptedObj,
      title: '🔒 Decryption Failed (Wrong PIN)',
      username: '***',
      password: '***',
      notes: 'Please unlock Vault with the exact PIN used to create this entry.'
    };
  }
}
