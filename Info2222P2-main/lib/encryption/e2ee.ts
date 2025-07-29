export async function generateLongTermKeys(): Promise<{ publicKeyJwk: JsonWebKey; privateKey: CryptoKey }> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']
  );
  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  return { publicKeyJwk, privateKey: keyPair.privateKey };
}

export async function deriveSessionKey(
  myPrivateKey: CryptoKey,
  theirPublicJwk: JsonWebKey
): Promise<{ sessionKey: CryptoKey; ephPublicJwk: JsonWebKey }> {
  const ephPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']
  );
  const ephPublicJwk = await crypto.subtle.exportKey('jwk', ephPair.publicKey);
  const theirPub = await crypto.subtle.importKey(
    'jwk', theirPublicJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, []
  );
  const sessionKey = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: theirPub },
    ephPair.privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt','decrypt']
  );
  return { sessionKey, ephPublicJwk };
}

export async function encryptMessage(
  plainText: string,
  sessionKey: CryptoKey
): Promise<{ iv: number[]; ciphertext: number[] }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sessionKey, encoded);
  return { iv: Array.from(iv), ciphertext: Array.from(new Uint8Array(cipher)) };
}

export async function decryptMessage(
  payload: { ephPublicJwk: JsonWebKey; iv: number[]; ciphertext: number[] },
  myLongTermKey: CryptoKey
): Promise<string> {
  const ephPub = await crypto.subtle.importKey(
    'jwk', payload.ephPublicJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, []
  );
  const sharedKey = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: ephPub },
    myLongTermKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const dec = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(payload.iv) },
    sharedKey,
    new Uint8Array(payload.ciphertext)
  );
  return new TextDecoder().decode(dec);
}

// 暂时挂载到全局用于调试
;(window as any).generateLongTermKeys = generateLongTermKeys;
;(window as any).deriveSessionKey   = deriveSessionKey;
;(window as any).encryptMessage     = encryptMessage;
;(window as any).decryptMessage     = decryptMessage;

// 自测脚本
;(async () => {
  const { publicKeyJwk, privateKey } = await generateLongTermKeys();
  const { sessionKey, ephPublicJwk } = await deriveSessionKey(privateKey, publicKeyJwk);
  const { iv, ciphertext } = await encryptMessage('CursorTest', sessionKey);
  const decrypted = await decryptMessage({ ephPublicJwk, iv, ciphertext }, privateKey);
  console.log(decrypted === 'CursorTest' ? '🟢 E2EE self test pass' : '🔴 self test fail');
})(); 