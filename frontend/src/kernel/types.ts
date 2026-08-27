/** PKCS#12 keystore type. Other JCA types are File-shell stubs, not kernel. */
export type KeyStoreType = "PKCS12";

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

export interface KernelEntry {
  alias: string;
  entryType: EntryType;
  /** PKCS#8 private key (KEY_PAIR, or KEY when the bag was a private key). */
  pkcs8?: Uint8Array;
  /** DER certificates, leaf first. */
  certificates?: Uint8Array[];
  /** SecretBag payload (KEY). */
  secret?: Uint8Array;
  localKeyId: Uint8Array;
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
