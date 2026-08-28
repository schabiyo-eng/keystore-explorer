import * as pkijs from "pkijs";
import { toArrayBuffer } from "../../kernel/bytes";
import { parseCertificates } from "../../kernel/keys";
import { decodeCryptoBytes, decodeText, pemLabel } from "./decode";
import {
  PKCS12_INFO_DIALOG,
  VIEW_CERTIFICATE_DIALOG,
  VIEW_CRL_DIALOG,
  VIEW_CSR_DIALOG,
  VIEW_JWT_DIALOG,
  VIEW_PRIVATE_KEY_DIALOG,
  VIEW_PUBLIC_KEY_DIALOG,
} from "./dialog-ids";
import { isJwtText } from "./jwt";

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
      return VIEW_CERTIFICATE_DIALOG;
    case "csr":
      return VIEW_CSR_DIALOG;
    case "crl":
      return VIEW_CRL_DIALOG;
    case "jwt":
      return VIEW_JWT_DIALOG;
    case "privateKey":
      return VIEW_PRIVATE_KEY_DIALOG;
    case "publicKey":
      return VIEW_PUBLIC_KEY_DIALOG;
    case "pkcs12":
      return PKCS12_INFO_DIALOG;
    default:
      return undefined;
  }
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
