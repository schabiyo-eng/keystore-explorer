/** PKCS#12 keystore type. Other JCA types are File-shell stubs, not kernel. */
export type KeyStoreType = "PKCS12";

export const PKCS12: KeyStoreType = "PKCS12";

/** Oracle `entryType` from functional-tests/ORACLES.md. */
export type EntryType = "KEY_PAIR" | "TRUSTED_CERT" | "KEY";

/** Oracle `errorId` values the kernel can produce. */
export type ErrorId =
  | "wrongPassword"
  | "cancelled"
  | "duplicateAlias"
  | "notFound"
  | "invalidFile"
  | "unsupportedType"
  | "emptySelection"
  | "lockedEntry"
  | "storeNotWritable";

interface EntryBase {
  alias: string;
  localKeyId: Uint8Array;
}

/** Private key plus certificate chain. */
export interface KeyPairEntry extends EntryBase {
  entryType: "KEY_PAIR";
  pkcs8: Uint8Array;
  certificates: Uint8Array[];
}

/** Certificate-only bag (no private key). */
export interface TrustedCertEntry extends EntryBase {
  entryType: "TRUSTED_CERT";
  certificates: Uint8Array[];
}

/** SecretBag passphrase/secret, or a private key without a chain. */
export interface KeyEntry extends EntryBase {
  entryType: "KEY";
  /** PKCS#8 private key when the bag was a private key without a cert chain. */
  pkcs8?: Uint8Array;
  /** SecretBag payload. */
  secret?: Uint8Array;
}

export type KernelEntry = KeyPairEntry | TrustedCertEntry | KeyEntry;

export function isKeyPairEntry(entry: KernelEntry): entry is KeyPairEntry {
  return entry.entryType === "KEY_PAIR";
}

export function isTrustedCertEntry(entry: KernelEntry): entry is TrustedCertEntry {
  return entry.entryType === "TRUSTED_CERT";
}

export function isKeyEntry(entry: KernelEntry): entry is KeyEntry {
  return entry.entryType === "KEY";
}

export interface KeyStore {
  type: KeyStoreType;
  dirty: boolean;
  entries: KernelEntry[];
}

/**
 * Facts YAML oracles need: type, aliases, entryType, dirty, errorId.
 * `entryType` is the per-alias list; a scenario asserts one `{ alias, type }`.
 */
export interface KernelFacts {
  type: KeyStoreType;
  aliases: string[];
  entryType: { alias: string; type: EntryType }[];
  dirty: boolean;
  errorId?: ErrorId;
}

export type KernelSuccess = {
  ok: true;
  store: KeyStore;
  facts: KernelFacts;
};

export type KernelFailure = {
  ok: false;
  errorId: ErrorId;
  facts: KernelFacts;
};

export type KernelResult = KernelSuccess | KernelFailure;

export type KernelSaveResult =
  | {
      ok: true;
      bytes: Uint8Array;
      store: KeyStore;
      facts: KernelFacts;
      reopenSucceeds: boolean;
    }
  | KernelFailure;

export type DecodePkcs12Result =
  | { ok: true; store: KeyStore }
  | { ok: false; errorId: ErrorId };
