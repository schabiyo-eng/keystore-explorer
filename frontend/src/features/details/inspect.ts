import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { toArrayBuffer, toHex } from "../../kernel/bytes";
import { getSubtle } from "../../kernel/crypto";
import type { KernelEntry } from "../../kernel";

const OID_CN = "2.5.4.3";
const OID_C = "2.5.4.6";
const OID_L = "2.5.4.7";
const OID_ST = "2.5.4.8";
const OID_O = "2.5.4.10";
const OID_OU = "2.5.4.11";
const OID_EMAIL = "1.2.840.113549.1.9.1";
const OID_RSA = "1.2.840.113549.1.1.1";

const DN_OIDS: Record<string, string> = {
  [OID_CN]: "CN",
  [OID_C]: "C",
  [OID_L]: "L",
  [OID_ST]: "ST",
  [OID_O]: "O",
  [OID_OU]: "OU",
  [OID_EMAIL]: "E",
};

const SIG_OIDS: Record<string, string> = {
  "1.2.840.113549.1.1.5": "SHA1withRSA",
  "1.2.840.113549.1.1.11": "SHA256withRSA",
  "1.2.840.113549.1.1.12": "SHA384withRSA",
  "1.2.840.113549.1.1.13": "SHA512withRSA",
  [OID_RSA]: "RSA",
};

const KEY_OIDS: Record<string, string> = {
  [OID_RSA]: "RSA",
};

export interface CertDetails {
  subject: string;
  issuer: string;
  version: string;
  serialHex: string;
  serialDec: string;
  validFrom: string;
  validUntil: string;
  publicKey: string;
  signatureAlgorithm: string;
  fingerprint: string;
}

export interface KeyDetails {
  algorithm: string;
  keySize: string;
  format: string;
  encoded: string;
}

function hexView(value: unknown): Uint8Array | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const block = value as { valueBlock?: { valueHexView?: Uint8Array } };
  const view = block.valueBlock?.valueHexView;
  if (!view || view.byteLength === 0) {
    return undefined;
  }
  return new Uint8Array(view);
}

function textValue(value: unknown): string {
  if (!value || typeof value !== "object") {
    return "";
  }
  const obj = value as { getValue?: () => unknown; value?: unknown };
  if (typeof obj.getValue === "function") {
    const text = obj.getValue();
    if (typeof text === "string") {
      return text;
    }
  }
  if (typeof obj.value === "string") {
    return obj.value;
  }
  return "";
}

function formatHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ");
}

function formatColonHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0").toUpperCase()).join(":");
}

function integerDec(bytes: Uint8Array): string {
  const hex = toHex(bytes);
  if (!hex) {
    return "0";
  }
  return BigInt(`0x${hex}`).toString(10);
}

function rdnToString(name: pkijs.RelativeDistinguishedNames): string {
  return name.typesAndValues
    .map((tv) => {
      const label = DN_OIDS[tv.type] ?? tv.type;
      return `${label}=${textValue(tv.value)}`;
    })
    .join(", ");
}

function algorithmName(oid: string, table: Record<string, string>): string {
  return table[oid] ?? oid;
}

function modulusBitsFromInteger(bytes: Uint8Array | undefined): number | undefined {
  if (!bytes || bytes.byteLength === 0) {
    return undefined;
  }
  let length = bytes.byteLength;
  if (bytes[0] === 0) {
    length -= 1;
  }
  return length * 8;
}

function rsaBitsFromSpki(spki: pkijs.PublicKeyInfo): number | undefined {
  try {
    const bits = hexView(spki.subjectPublicKey);
    if (!bits) {
      return undefined;
    }
    const asn1 = asn1js.fromBER(toArrayBuffer(bits));
    const seq = asn1.result as { valueBlock?: { value?: unknown[] } };
    return modulusBitsFromInteger(hexView(seq.valueBlock?.value?.[0]));
  } catch {
    return undefined;
  }
}

function rsaBitsFromPkcs8(pkcs8: Uint8Array): number | undefined {
  try {
    const pki = pkijs.PrivateKeyInfo.fromBER(toArrayBuffer(pkcs8));
    const inner = hexView(pki.privateKey);
    if (!inner) {
      return undefined;
    }
    const asn1 = asn1js.fromBER(toArrayBuffer(inner));
    const seq = asn1.result as { valueBlock?: { value?: unknown[] } };
    // RSAPrivateKey: version, modulus, publicExponent, ...
    return modulusBitsFromInteger(hexView(seq.valueBlock?.value?.[1]));
  } catch {
    return undefined;
  }
}

function formatDate(value: Date): string {
  return value.toUTCString();
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await getSubtle().digest("SHA-256", toArrayBuffer(bytes));
  return formatColonHex(new Uint8Array(digest));
}

export async function inspectCertificate(der: Uint8Array): Promise<CertDetails> {
  const cert = pkijs.Certificate.fromBER(toArrayBuffer(der));
  const serial = hexView(cert.serialNumber) ?? new Uint8Array();
  const bits = rsaBitsFromSpki(cert.subjectPublicKeyInfo);
  const keyAlg = algorithmName(cert.subjectPublicKeyInfo.algorithm.algorithmId, KEY_OIDS);
  const publicKey = bits ? `${keyAlg} ${bits} bits` : keyAlg;
  return {
    subject: rdnToString(cert.subject),
    issuer: rdnToString(cert.issuer),
    version: String((cert.version ?? 0) + 1),
    serialHex: `0x${toHex(serial).toUpperCase()}`,
    serialDec: integerDec(serial),
    validFrom: formatDate(cert.notBefore.value),
    validUntil: formatDate(cert.notAfter.value),
    publicKey,
    signatureAlgorithm: algorithmName(cert.signatureAlgorithm.algorithmId, SIG_OIDS),
    fingerprint: await sha256(der),
  };
}

export async function inspectCertificates(ders: Uint8Array[]): Promise<CertDetails[]> {
  const certs: CertDetails[] = [];
  for (const der of ders) {
    certs.push(await inspectCertificate(der));
  }
  return certs;
}

export function inspectPrivateKey(pkcs8: Uint8Array, fallbackBits?: number): KeyDetails {
  let algorithm = "RSA";
  try {
    const pki = pkijs.PrivateKeyInfo.fromBER(toArrayBuffer(pkcs8));
    algorithm = algorithmName(pki.privateKeyAlgorithm.algorithmId, KEY_OIDS);
  } catch {
    algorithm = "RSA";
  }
  const bits = rsaBitsFromPkcs8(pkcs8) ?? fallbackBits;
  return {
    algorithm,
    keySize: bits ? `${bits} bits` : "",
    format: "PKCS#8",
    encoded: formatHex(pkcs8),
  };
}

export function inspectPublicKeyFromCert(der: Uint8Array): KeyDetails {
  const cert = pkijs.Certificate.fromBER(toArrayBuffer(der));
  const spkiDer = toUint8Safe(cert.subjectPublicKeyInfo.toSchema().toBER(false));
  const bits = rsaBitsFromSpki(cert.subjectPublicKeyInfo);
  const algorithm = algorithmName(cert.subjectPublicKeyInfo.algorithm.algorithmId, KEY_OIDS);
  return {
    algorithm,
    keySize: bits ? `${bits} bits` : "",
    format: "X.509",
    encoded: formatHex(spkiDer),
  };
}

export function inspectSecretKey(secret: Uint8Array): KeyDetails {
  return {
    algorithm: "RAW",
    keySize: `${secret.byteLength * 8} bits`,
    format: "RAW",
    encoded: formatHex(secret),
  };
}

export function certificatesOf(entry: KernelEntry): Uint8Array[] {
  if (entry.entryType === "KEY_PAIR" || entry.entryType === "TRUSTED_CERT") {
    return entry.certificates;
  }
  return [];
}

function toUint8Safe(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer.slice(0));
}
