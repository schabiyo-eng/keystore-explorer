import * as pkijs from "pkijs";
import { copyBytes, toArrayBuffer } from "../../kernel/bytes";
import { parseCertificates } from "../../kernel/keys";
import { cloneStore } from "../../kernel/store";
import type { KeyPairEntry, KeyStore } from "../../kernel/types";
import { inspectCertificate } from "../details/inspect";

export type ChainMutationError = "selfSigned" | "chainTooShort" | "invalidFile" | "emptySelection";

export type ChainMutation =
  | { ok: true; store: KeyStore }
  | { ok: false; errorId: ChainMutationError };

function keyPairOf(store: KeyStore, alias: string): KeyPairEntry | undefined {
  const entry = store.entries.find((item) => item.alias === alias);
  if (!entry || entry.entryType !== "KEY_PAIR") {
    return undefined;
  }
  return entry;
}

function lastDer(entry: KeyPairEntry): Uint8Array | undefined {
  return entry.certificates[entry.certificates.length - 1];
}

function parseCert(der: Uint8Array): pkijs.Certificate {
  return pkijs.Certificate.fromBER(toArrayBuffer(der));
}

function failed(errorId: ChainMutationError): ChainMutation {
  return { ok: false, errorId };
}

/** End-entity / last chain member is self-signed when subject equals issuer. */
export async function isSelfSignedCert(der: Uint8Array): Promise<boolean> {
  const details = await inspectCertificate(der);
  if (details.subject !== "" && details.subject === details.issuer) {
    return true;
  }
  try {
    const cert = parseCert(der);
    return cert.subject.isEqual(cert.issuer);
  } catch {
    return false;
  }
}

async function signedBy(subjectDer: Uint8Array, issuerDer: Uint8Array): Promise<boolean> {
  try {
    const subject = parseCert(subjectDer);
    const issuer = parseCert(issuerDer);
    return await subject.verify(issuer);
  } catch {
    const subject = await inspectCertificate(subjectDer);
    const issuer = await inspectCertificate(issuerDer);
    return subject.issuer !== "" && subject.issuer === issuer.subject;
  }
}

/** YAML / file chooser must supply exactly one X.509 cert (PEM or DER). */
function parseSingleCertificate(bytes: Uint8Array): Uint8Array | undefined {
  try {
    const certs = parseCertificates(bytes);
    if (certs.length !== 1) {
      return undefined;
    }
    const der = certs[0];
    if (!der) {
      return undefined;
    }
    parseCert(der);
    return der;
  } catch {
    return undefined;
  }
}

/**
 * Append one X.509 cert to the end of a KEY_PAIR chain (leaf first, signer last).
 * Uses pkijs (kernel stack) and details inspect — no second PKCS#12 parser.
 */
export async function appendCertificate(
  store: KeyStore,
  alias: string,
  bytes: Uint8Array,
): Promise<ChainMutation> {
  const entry = keyPairOf(store, alias);
  const last = entry ? lastDer(entry) : undefined;
  if (!entry || !last) {
    return failed("emptySelection");
  }
  if (await isSelfSignedCert(last)) {
    return failed("selfSigned");
  }
  const toAppend = parseSingleCertificate(bytes);
  if (!toAppend) {
    return failed("invalidFile");
  }
  if (!(await signedBy(last, toAppend))) {
    return failed("invalidFile");
  }
  const next = cloneStore(store);
  const target = keyPairOf(next, alias);
  if (!target) {
    return failed("emptySelection");
  }
  target.certificates = [...target.certificates, copyBytes(toAppend)];
  next.dirty = true;
  return { ok: true, store: next };
}

/** Drop the last (root-most) certificate. A single-cert chain cannot shrink. */
export function removeCertificate(store: KeyStore, alias: string): ChainMutation {
  const entry = keyPairOf(store, alias);
  if (!entry) {
    return failed("emptySelection");
  }
  if (entry.certificates.length < 2) {
    return failed("chainTooShort");
  }
  const next = cloneStore(store);
  const target = keyPairOf(next, alias);
  if (!target) {
    return failed("emptySelection");
  }
  target.certificates = target.certificates.slice(0, -1);
  next.dirty = true;
  return { ok: true, store: next };
}
