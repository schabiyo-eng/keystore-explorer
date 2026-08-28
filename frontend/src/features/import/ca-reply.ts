import * as pkijs from "pkijs";
import { copyBytes, toArrayBuffer, toUint8 } from "../../kernel/bytes";
import { parseCertificates } from "../../kernel/keys";
import { fail, ok } from "../../kernel/result";
import { cloneStore } from "../../kernel/store";
import type { KernelResult, KeyStore } from "../../kernel";

function spkiBytes(certDer: Uint8Array): Uint8Array | undefined {
  try {
    const cert = pkijs.Certificate.fromBER(toArrayBuffer(certDer));
    return toUint8(cert.subjectPublicKeyInfo.toSchema().toBER(false));
  } catch {
    return undefined;
  }
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) {
    return false;
  }
  return left.every((value, index) => value === right[index]);
}

function parseReplyCerts(bytes: Uint8Array): Uint8Array[] | undefined {
  try {
    const certs = parseCertificates(bytes);
    if (certs.length === 0) {
      return undefined;
    }
    for (const der of certs) {
      pkijs.Certificate.fromBER(toArrayBuffer(der));
    }
    return certs;
  } catch {
    return undefined;
  }
}

/**
 * Replace the selected KEY_PAIR chain with a CA reply whose leaf public key matches.
 * Uses pkijs (kernel stack) only — no second PKCS#12 parser.
 */
export function importCaReplyIntoStore(
  store: KeyStore,
  alias: string,
  bytes: Uint8Array,
): KernelResult {
  const entry = store.entries.find((item) => item.alias === alias);
  if (!entry || entry.entryType !== "KEY_PAIR") {
    return fail("emptySelection", store);
  }
  const certs = parseReplyCerts(bytes);
  if (!certs) {
    return fail("invalidFile", store);
  }
  const leaf = certs[0];
  const existing = entry.certificates[0];
  if (!leaf || !existing) {
    return fail("invalidFile", store);
  }
  const replySpki = spkiBytes(leaf);
  const entrySpki = spkiBytes(existing);
  if (!replySpki || !entrySpki || !sameBytes(replySpki, entrySpki)) {
    return fail("invalidFile", store);
  }
  const next = cloneStore(store);
  const target = next.entries.find((item) => item.alias === alias);
  if (!target || target.entryType !== "KEY_PAIR") {
    return fail("emptySelection", store);
  }
  target.certificates = certs.map(copyBytes);
  next.dirty = true;
  return ok(next);
}
