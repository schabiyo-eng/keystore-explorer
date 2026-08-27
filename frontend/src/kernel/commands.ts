import * as pkijs from "pkijs";
import { generateRsaKeyPair, parseCertificates } from "./keys";
import {
  cloneStore,
  decodePkcs12,
  emptyFacts,
  encodePkcs12,
  factsOf,
  hasAlias,
  randomBytes,
  toArrayBuffer,
} from "./pkcs12";
import type {
  ErrorId,
  KernelFacts,
  KernelResult,
  KernelSaveResult,
  KeyStore,
} from "./types";

/** Documented in functional-tests/schema.md. Only for stores this kernel created. */
export const TEST_PASSWORD = "password";

function fail(errorId: ErrorId, store?: KeyStore): KernelResult {
  return {
    ok: false,
    errorId,
    facts: store ? factsOf(store, errorId) : emptyFacts(errorId),
  };
}

function ok(store: KeyStore): KernelResult {
  return { ok: true, store, facts: factsOf(store) };
}

export function facts(store: KeyStore): KernelFacts {
  return factsOf(store);
}

export function getEntryType(store: KeyStore, alias: string) {
  return store.entries.find((e) => e.alias === alias)?.entryType;
}

export async function newKeyStore(params: { type: string }): Promise<KernelResult> {
  if (params.type !== "PKCS12") {
    return fail("unsupportedType");
  }
  return ok({
    type: "PKCS12",
    dirty: true,
    entries: [],
  });
}

export async function load(bytes: Uint8Array, password: string): Promise<KernelResult> {
  const decoded = await decodePkcs12(bytes, password);
  if ("errorId" in decoded) {
    return fail(decoded.errorId);
  }
  return ok(decoded.store);
}

export async function save(store: KeyStore, password: string): Promise<KernelSaveResult> {
  const bytes = await encodePkcs12(store, password);
  const saved: KeyStore = { ...cloneStore(store), dirty: false };
  const reopened = await load(bytes, password);
  const reopenOk =
    reopened.ok &&
    aliasesMatch(reopened.facts.aliases, saved.entries.map((e) => e.alias)) &&
    reopened.facts.entryType.every((item) => {
      const expected = saved.entries.find((e) => e.alias === item.alias);
      return expected?.entryType === item.type;
    });

  return {
    ok: true,
    bytes,
    store: saved,
    facts: factsOf(saved),
    reopenSucceeds: reopenOk,
  };
}

function aliasesMatch(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((value, i) => value === right[i]);
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
  const next = cloneStore(store);
  next.dirty = true;
  next.entries.push({
    alias: params.alias,
    entryType: "KEY_PAIR",
    pkcs8: generated.pkcs8,
    certificates: [generated.certificate],
    localKeyId: randomBytes(20),
  });
  return ok(next);
}

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
  const next = cloneStore(store);
  next.dirty = true;
  next.entries.push({
    alias: params.alias,
    entryType: "TRUSTED_CERT",
    certificates: certs,
    localKeyId: randomBytes(20),
  });
  return ok(next);
}

export async function putSecretKey(
  store: KeyStore,
  params: { alias: string; secret: Uint8Array },
): Promise<KernelResult> {
  if (hasAlias(store, params.alias)) {
    return fail("duplicateAlias", store);
  }
  const next = cloneStore(store);
  next.dirty = true;
  next.entries.push({
    alias: params.alias,
    entryType: "KEY",
    secret: new Uint8Array(params.secret),
    localKeyId: randomBytes(20),
  });
  return ok(next);
}
