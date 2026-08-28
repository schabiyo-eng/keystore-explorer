import * as pkijs from "pkijs";
import { toArrayBuffer, toUint8 } from "../../kernel/bytes";
import { installWebCrypto } from "../../kernel/crypto";
import { isKeyPairEntry, isTrustedCertEntry, type KernelEntry } from "../../kernel";
import type { SignerRow } from "./report";
import { parseZip, type ZipEntry } from "./zip";

const CN_OID = "2.5.4.3";
const SHORT_OIDS: Record<string, string> = {
  "2.5.4.3": "CN",
  "2.5.4.6": "C",
  "2.5.4.7": "L",
  "2.5.4.8": "ST",
  "2.5.4.10": "O",
  "2.5.4.11": "OU",
};

function asn1Text(value: unknown): string {
  if (!value || typeof value !== "object") {
    return String(value ?? "");
  }
  const obj = value as {
    getValue?: () => unknown;
    valueBlock?: { value?: unknown };
    value?: unknown;
  };
  if (typeof obj.getValue === "function") {
    const text = obj.getValue();
    if (typeof text === "string") {
      return text;
    }
  }
  if (typeof obj.valueBlock?.value === "string") {
    return obj.valueBlock.value;
  }
  if (typeof obj.value === "string") {
    return obj.value;
  }
  return "";
}

function rdnToString(name: pkijs.RelativeDistinguishedNames): string {
  return name.typesAndValues
    .map((tv) => `${SHORT_OIDS[tv.type] ?? tv.type}=${asn1Text(tv.value)}`)
    .join(", ");
}

function attrValue(name: pkijs.RelativeDistinguishedNames, oid: string): string {
  const match = name.typesAndValues.find((tv) => tv.type === oid);
  return match ? asn1Text(match.value) : "";
}

export function certificatesOf(entry: KernelEntry): Uint8Array[] {
  if (isKeyPairEntry(entry) || isTrustedCertEntry(entry)) {
    return entry.certificates;
  }
  return [];
}

export function parseCertificate(der: Uint8Array): pkijs.Certificate {
  return pkijs.Certificate.fromBER(toArrayBuffer(der));
}

export async function verifyCertificateDer(der: Uint8Array): Promise<boolean> {
  installWebCrypto();
  const cert = parseCertificate(der);
  try {
    return await cert.verify(cert);
  } catch {
    try {
      return await cert.verify();
    } catch {
      return false;
    }
  }
}

function asCertificate(item: unknown): pkijs.Certificate | undefined {
  if (item instanceof pkijs.Certificate) {
    return item;
  }
  return undefined;
}

function parseContentInfo(bytes: Uint8Array): pkijs.ContentInfo {
  return pkijs.ContentInfo.fromBER(toArrayBuffer(bytes));
}

function signedDataOf(cms: pkijs.ContentInfo): pkijs.SignedData {
  if (cms.contentType !== pkijs.ContentInfo.SIGNED_DATA) {
    throw new Error("not-signed-data");
  }
  return new pkijs.SignedData({ schema: cms.content });
}

function isDetached(signed: pkijs.SignedData): boolean {
  return !signed.encapContentInfo.eContent;
}

export async function verifyCms(
  signature: Uint8Array,
  content?: Uint8Array,
): Promise<{ ok: boolean; signers: SignerRow[]; signerCerts: Uint8Array[] }> {
  installWebCrypto();
  const signed = signedDataOf(parseContentInfo(signature));
  const signerCerts: Uint8Array[] = [];
  const signers: SignerRow[] = [];
  const certs = (signed.certificates ?? []).map(asCertificate).filter((item): item is pkijs.Certificate =>
    Boolean(item),
  );
  for (const cert of certs) {
    signerCerts.push(toUint8(cert.toSchema().toBER(false)));
    signers.push({
      subject: rdnToString(cert.subject) || attrValue(cert.subject, CN_OID),
      issuer: rdnToString(cert.issuer) || attrValue(cert.issuer, CN_OID),
      version: String((cert.version ?? 0) + 1),
      algorithm: cert.signatureAlgorithm.algorithmId,
      signingTime: "",
    });
  }
  if (signed.signerInfos.length === 0) {
    return { ok: false, signers, signerCerts };
  }
  const data = isDetached(signed) && content ? toArrayBuffer(content) : undefined;
  try {
    const ok = await signed.verify({
      signer: 0,
      data,
      checkChain: false,
    });
    return { ok: Boolean(ok), signers, signerCerts };
  } catch {
    return { ok: false, signers, signerCerts };
  }
}

function isSignatureBlock(name: string): boolean {
  const upper = name.toUpperCase();
  return (
    upper.startsWith("META-INF/") &&
    (upper.endsWith(".RSA") || upper.endsWith(".DSA") || upper.endsWith(".EC"))
  );
}

export function isJarSignatureName(name: string): boolean {
  return isSignatureBlock(name);
}

export async function verifyJarBytes(bytes: Uint8Array): Promise<{
  ok: boolean;
  incomplete: boolean;
  entries: ZipEntry[];
  signers: SignerRow[];
  signerCerts: Uint8Array[];
} | undefined> {
  const entries = parseZip(bytes);
  if (!entries) {
    return undefined;
  }
  const blocks = entries.filter((entry) => isSignatureBlock(entry.name));
  if (blocks.length === 0) {
    return { ok: false, incomplete: true, entries, signers: [], signerCerts: [] };
  }
  const signers: SignerRow[] = [];
  const signerCerts: Uint8Array[] = [];
  let ok = true;
  for (const block of blocks) {
    try {
      const verified = await verifyCms(block.data);
      if (!verified.ok) {
        ok = false;
      }
      signers.push(...verified.signers);
      signerCerts.push(...verified.signerCerts);
    } catch {
      return undefined;
    }
  }
  return { ok, incomplete: false, entries, signers, signerCerts };
}
