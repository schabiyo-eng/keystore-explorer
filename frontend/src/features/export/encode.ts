import * as pkijs from "pkijs";
import { toArrayBuffer, toUint8 } from "../../kernel/bytes";
import type { KernelEntry } from "../../kernel";

const CSV_HEADERS = [
  "Type",
  "Lock",
  "Expiry",
  "Entry Name",
  "Algorithm",
  "Key Size",
  "Certificate Expiry",
  "Last Modified",
];

function toBase64(bytes: Uint8Array): string {
  const btoaFn = globalThis.btoa;
  if (typeof btoaFn === "function") {
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoaFn(binary);
  }
  return Buffer.from(bytes).toString("base64");
}

function wrap64(value: string): string {
  const lines: string[] = [];
  for (let i = 0; i < value.length; i += 64) {
    lines.push(value.slice(i, i + 64));
  }
  return lines.join("\n");
}

export function pemBlock(label: string, der: Uint8Array): string {
  return `-----BEGIN ${label}-----\n${wrap64(toBase64(der))}\n-----END ${label}-----\n`;
}

export function encodeCertificatesPem(certificates: Uint8Array[]): Uint8Array {
  const pem = certificates.map((der) => pemBlock("CERTIFICATE", der)).join("");
  return new TextEncoder().encode(pem);
}

export function encodePkcs8Pem(pkcs8: Uint8Array): Uint8Array {
  return new TextEncoder().encode(pemBlock("PRIVATE KEY", pkcs8));
}

export function encodePublicKeyPem(certDer: Uint8Array): Uint8Array {
  const cert = pkijs.Certificate.fromBER(toArrayBuffer(certDer));
  const spki = toUint8(cert.subjectPublicKeyInfo.toSchema().toBER(false));
  return new TextEncoder().encode(pemBlock("PUBLIC KEY", spki));
}

function typeLabel(entry: KernelEntry): string {
  switch (entry.entryType) {
    case "KEY_PAIR":
      return "Key Pair";
    case "TRUSTED_CERT":
      return "Trusted Certificate";
    case "KEY":
      return "Key";
  }
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export function encodeCsv(
  entries: KernelEntry[],
  locked: (alias: string) => boolean = () => false,
): Uint8Array {
  const rows = [CSV_HEADERS.map(csvCell).join(",")];
  for (const entry of entries) {
    const lock = locked(entry.alias) ? "Locked" : "Unlocked";
    rows.push(
      [typeLabel(entry), lock, "—", entry.alias, "—", "—", "—", "—"].map(csvCell).join(","),
    );
  }
  return new TextEncoder().encode(`${rows.join("\n")}\n`);
}
