const PEM_BLOCK = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/;

export function derFromPemOrDer(bytes: Uint8Array): Uint8Array {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const match = PEM_BLOCK.exec(text);
  if (!match?.[2]) {
    return bytes;
  }
  const binary = atob(match[2].replace(/\s+/g, ""));
  const der = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    der[i] = binary.charCodeAt(i);
  }
  return der;
}

export function toPem(label: string, der: Uint8Array): string {
  const b64 = bytesToBase64(der);
  const lines = b64.match(/.{1,64}/g)?.join("\n") ?? b64;
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----\n`;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const byte of bytes) {
    bin += String.fromCharCode(byte);
  }
  return btoa(bin);
}

export function base64Url(bytes: Uint8Array | string): string {
  const raw = typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
  return bytesToBase64(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function textBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}
