import * as pkijs from "pkijs";
import { toArrayBuffer, toHex, toUint8 } from "../../kernel/bytes";
import { getSubtle } from "../../kernel/crypto";
import { isKeyPairEntry, isTrustedCertEntry, type KernelEntry } from "../../kernel";
import {
  formatColonHex,
  formatHex,
  hexView,
  integerDec,
  rdnToString,
  rsaBitsFromPkcs8,
  rsaBitsFromSpki,
} from "./asn1";
import { algorithmName, KEY_OIDS, SIG_OIDS } from "./oids";

export type CertDetails = {
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
};

export type KeyDetails = {
  algorithm: string;
  keySize: string;
  format: string;
  encoded: string;
};

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
  const spkiDer = toUint8(cert.subjectPublicKeyInfo.toSchema().toBER(false));
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
  if (isKeyPairEntry(entry) || isTrustedCertEntry(entry)) {
    return entry.certificates;
  }
  return [];
}
