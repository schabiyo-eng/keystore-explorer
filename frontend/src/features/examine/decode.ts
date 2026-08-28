const PEM_BLOCK = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/g;

export function derFromB64(b64: string): Uint8Array | undefined {
  try {
    const binary = atob(b64.replace(/\s+/g, ""));
    const der = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      der[i] = binary.charCodeAt(i);
    }
    return der;
  } catch {
    return undefined;
  }
}

export function decodeText(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

/** PEM bodies, or a single Base64 blob that decodes to ASN.1 SEQUENCE. */
export function decodeCryptoBytes(bytes: Uint8Array): Uint8Array[] {
  const text = decodeText(bytes);
  const pem = [...text.matchAll(PEM_BLOCK)]
    .map((match) => derFromB64(match[2] ?? ""))
    .filter((der): der is Uint8Array => Boolean(der && der.byteLength > 0));
  if (pem.length > 0) {
    return pem;
  }
  const compact = text.replace(/\s+/g, "");
  if (compact.length >= 8 && compact.length % 4 === 0 && /^[A-Za-z0-9+/]+=*$/.test(compact)) {
    const decoded = derFromB64(compact);
    if (decoded && decoded.byteLength > 0 && decoded[0] === 0x30) {
      return [decoded];
    }
  }
  return [bytes];
}

export function pemLabel(text: string): string | undefined {
  return /-----BEGIN ([A-Z0-9 ]+)-----/.exec(text)?.[1];
}
