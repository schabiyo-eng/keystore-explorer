import { getSubtle, installWebCrypto } from "../../kernel";

const AES_LENGTHS = new Set([128, 192, 256]);

export async function generateAesKey(keySize: number): Promise<Uint8Array | undefined> {
  if (!AES_LENGTHS.has(keySize)) {
    return undefined;
  }
  installWebCrypto();
  const subtle = getSubtle();
  const key = await subtle.generateKey(
    { name: "AES-GCM", length: keySize },
    true,
    ["encrypt", "decrypt"],
  );
  const raw = await subtle.exportKey("raw", key);
  return new Uint8Array(raw);
}
