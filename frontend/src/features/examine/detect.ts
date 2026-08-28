import * as pkijs from "pkijs";
import { toArrayBuffer } from "../../kernel/bytes";
import { parseCertificates } from "../../kernel/keys";

/** Oracle `examinedType` from functional-tests/ORACLES.md. */
export type ExaminedType =
  | "certificate"
  | "csr"
  | "crl"
  | "jwt"
  | "privateKey"
  | "publicKey"
  | "pkcs12"
  | "unknown";

const PEM_BLOCK = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/g;

const FRIENDLY: Record<ExaminedType, string> = {
  certificate: "X.509 Certificate",
  csr: "PKCS #10 Certificate Signing Request",
  crl: "Certificate Revocation List",
  jwt: "JSON Web Token",
  privateKey: "PKCS #8 Private Key",
  publicKey: "OpenSSL Public Key",
  pkcs12: "PKCS #12 KeyStore",
  unknown: "Unknown",
};

export function friendlyType(type: ExaminedType): string {
  return FRIENDLY[type];
}

export function reportDialogFor(type: ExaminedType): string | undefined {
  switch (type) {
    case "certificate":
      return "dialog.view-certificate";
    case "csr":
      return "dialog.view-csr";
    case "crl":
      return "dialog.view-crl";
    case "jwt":
      return "dialog.view-jwt";
    case "privateKey":
      return "dialog.view-private-key";
    case "publicKey":
      return "dialog.view-public-key";
    case "pkcs12":
      return "dialog.pkcs12-info";
    default:
      return undefined;
  }
}

function derFromB64(b64: string): Uint8Array | undefined {
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

function decodeText(bytes: Uint8Array): string {
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

function jsonFromBase64Url(part: string): unknown {
  const padded = part.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (part.length % 4)) % 4);
  const json = new TextDecoder().decode(derFromB64(padded) ?? new Uint8Array());
  return JSON.parse(json) as unknown;
}

export function isJwtText(text: string): boolean {
  const parts = text.trim().split(".");
  if (parts.length !== 3 || !parts[0] || !parts[1]) {
    return false;
  }
  try {
    const header = jsonFromBase64Url(parts[0]);
    return typeof header === "object" && header !== null && "alg" in header;
  } catch {
    return false;
  }
}

export function jwtParts(text: string): { header: string; payload: string; signature: string } | undefined {
  if (!isJwtText(text)) {
    return undefined;
  }
  const parts = text.trim().split(".");
  const pretty = (part: string | undefined) => {
    if (!part) {
      return "";
    }
    try {
      return `${JSON.stringify(jsonFromBase64Url(part), null, 2)}`;
    } catch {
      return part;
    }
  };
  return {
    header: pretty(parts[0]),
    payload: pretty(parts[1]),
    signature: parts[2] ?? "",
  };
}

function tryParse<T>(parse: () => T): T | undefined {
  try {
    return parse();
  } catch {
    return undefined;
  }
}

function isCertificateDer(der: Uint8Array): boolean {
  const cert = tryParse(() => pkijs.Certificate.fromBER(toArrayBuffer(der)));
  return Boolean(cert?.serialNumber && cert.subject);
}

function isCrlDer(der: Uint8Array): boolean {
  const crl = tryParse(() => pkijs.CertificateRevocationList.fromBER(toArrayBuffer(der)));
  return Boolean(crl?.issuer);
}

function isCsrDer(der: Uint8Array): boolean {
  const csr = tryParse(() => pkijs.CertificationRequest.fromBER(toArrayBuffer(der)));
  return Boolean(csr?.subject);
}

function isPrivateKeyDer(der: Uint8Array): boolean {
  return Boolean(tryParse(() => pkijs.PrivateKeyInfo.fromBER(toArrayBuffer(der))));
}

function isPublicKeyDer(der: Uint8Array): boolean {
  return Boolean(tryParse(() => pkijs.PublicKeyInfo.fromBER(toArrayBuffer(der))));
}

function isPkcs12Der(der: Uint8Array): boolean {
  return Boolean(tryParse(() => pkijs.PFX.fromBER(toArrayBuffer(der))));
}

function pemLabel(text: string): string | undefined {
  return /-----BEGIN ([A-Z0-9 ]+)-----/.exec(text)?.[1];
}

/**
 * Detect cryptographic object type using the PKCS#12/pkijs stack.
 * Maps Swing `CryptoFileUtil.detectFileType` onto YAML `examinedType`.
 */
export function detectExaminedType(bytes: Uint8Array): ExaminedType {
  const text = decodeText(bytes);
  if (isJwtText(text)) {
    return "jwt";
  }

  const label = pemLabel(text);
  if (label === "CERTIFICATE") {
    return "certificate";
  }
  if (label === "X509 CRL" || label === "CRL") {
    return "crl";
  }
  if (label === "CERTIFICATE REQUEST" || label === "NEW CERTIFICATE REQUEST") {
    return "csr";
  }
  if (
    label === "PRIVATE KEY" ||
    label === "ENCRYPTED PRIVATE KEY" ||
    label === "RSA PRIVATE KEY" ||
    label === "EC PRIVATE KEY"
  ) {
    return "privateKey";
  }
  if (label === "PUBLIC KEY" || label === "RSA PUBLIC KEY") {
    return "publicKey";
  }

  const payloads = decodeCryptoBytes(bytes);
  const first = payloads[0] ?? bytes;
  if (payloads.some(isCertificateDer) || isCertificateDer(bytes)) {
    return "certificate";
  }
  if (payloads.some(isCrlDer) || isCrlDer(first)) {
    return "crl";
  }
  if (payloads.some(isCsrDer) || isCsrDer(first)) {
    return "csr";
  }
  if (payloads.some(isPrivateKeyDer) || isPrivateKeyDer(first)) {
    return "privateKey";
  }
  if (payloads.some(isPublicKeyDer) || isPublicKeyDer(first)) {
    return "publicKey";
  }
  if (payloads.some(isPkcs12Der) || isPkcs12Der(first) || isPkcs12Der(bytes)) {
    return "pkcs12";
  }
  return "unknown";
}

export function certificateDers(bytes: Uint8Array): Uint8Array[] {
  const pem = parseCertificates(bytes);
  if (pem.length > 0 && pem.every(isCertificateDer)) {
    return pem;
  }
  return decodeCryptoBytes(bytes).filter(isCertificateDer);
}
