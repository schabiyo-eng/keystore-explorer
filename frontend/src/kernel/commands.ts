import * as pkijs from "pkijs";
import { randomBytes, toArrayBuffer } from "./bytes";
import { generateRsaKeyPair, parseCertificates } from "./keys";
import { decodePkcs12, encodePkcs12 } from "./pkcs12";
import { fail, ok } from "./result";
import {
  appendEntry,
  cloneStore,
  emptyStore,
  factsOf,
  getEntryType as entryTypeOf,
  hasAlias,
  sameEntryFacts,
} from "./store";
import { PKCS12 } from "./types";
import type {
  KernelFacts,
  KernelResult,
  KernelSaveResult,
  KeyStore,
} from "./types";

/** Documented in functional-tests/schema.md. Only for stores this kernel created. */
export const TEST_PASSWORD = "password";

export function facts(store: KeyStore): KernelFacts {
  return factsOf(store);
}

export function getEntryType(store: KeyStore, alias: string) {
  return entryTypeOf(store, alias);
}

/** YAML `when`: `newKeyStore`. */
export async function newKeyStore(params: { type: string }): Promise<KernelResult> {
  if (params.type !== PKCS12) {
    return fail("unsupportedType");
  }
  return ok(emptyStore(true));
}

/**
 * Byte-level load. YAML `openKeyStore` is File-shell (path + password) over this.
 */
export async function load(bytes: Uint8Array, password: string): Promise<KernelResult> {
  const decoded = await decodePkcs12(bytes, password);
  if (!decoded.ok) {
    return fail(decoded.errorId);
  }
  return ok(decoded.store);
}

/**
 * Byte-level save. YAML `saveKeyStore` / `saveKeyStoreAs` are File-shell over this.
 */
export async function save(store: KeyStore, password: string): Promise<KernelSaveResult> {
  const bytes = await encodePkcs12(store, password);
  const saved = cloneStore(store);
  saved.dirty = false;
  const reopened = await load(bytes, password);
  const reopenOk = reopened.ok && sameEntryFacts(reopened.facts, factsOf(saved));

  return {
    ok: true,
    bytes,
    store: saved,
    facts: factsOf(saved),
    reopenSucceeds: reopenOk,
  };
}

/**
 * ARCH.md: reopenSucceeds = load of the bytes save just wrote, same password.
 * Not JCA/BouncyCastle bag-for-bag equality.
 */
export async function reopenSucceeds(
  savedBytes: Uint8Array,
  password: string,
): Promise<boolean> {
  const reopened = await load(savedBytes, password);
  return reopened.ok;
}

/** YAML `when`: `generateKeyPair`. */
export async function generateKeyPair(
  store: KeyStore,
  params: { algorithm: string; keySize?: number; alias: string },
): Promise<KernelResult> {
  if (params.algorithm !== "RSA") {
    return fail("unsupportedType", store);
  }
  if (hasAlias(store, params.alias)) {
    return fail("duplicateAlias", store);
  }
  const generated = await generateRsaKeyPair(params.alias, params.keySize ?? 2048);
  return ok(
    appendEntry(store, {
      alias: params.alias,
      entryType: "KEY_PAIR",
      pkcs8: generated.pkcs8,
      certificates: [generated.certificate],
      localKeyId: randomBytes(20),
    }),
  );
}

/** YAML `when`: `importTrustedCertificate`. */
export async function importTrustedCertificate(
  store: KeyStore,
  params: { bytes: Uint8Array; alias: string },
): Promise<KernelResult> {
  if (hasAlias(store, params.alias)) {
    return fail("duplicateAlias", store);
  }
  const certs = parseCertificates(params.bytes);
  try {
    for (const der of certs) {
      pkijs.Certificate.fromBER(toArrayBuffer(der));
    }
  } catch {
    return fail("invalidFile", store);
  }
  return ok(
    appendEntry(store, {
      alias: params.alias,
      entryType: "TRUSTED_CERT",
      certificates: certs,
      localKeyId: randomBytes(20),
    }),
  );
}

/** Kernel primitive for YAML `storePassphrase` (File/generate slice owns the dialog). */
export async function putSecretKey(
  store: KeyStore,
  params: { alias: string; secret: Uint8Array },
): Promise<KernelResult> {
  if (hasAlias(store, params.alias)) {
    return fail("duplicateAlias", store);
  }
  return ok(
    appendEntry(store, {
      alias: params.alias,
      entryType: "KEY",
      secret: new Uint8Array(params.secret),
      localKeyId: randomBytes(20),
    }),
  );
}
