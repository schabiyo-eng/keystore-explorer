import { copyBytes } from "./bytes";
import { PKCS12 } from "./types";
import type {
  EntryType,
  ErrorId,
  KernelEntry,
  KernelFacts,
  KeyStore,
} from "./types";

export function cloneEntry(entry: KernelEntry): KernelEntry {
  const localKeyId = copyBytes(entry.localKeyId);
  switch (entry.entryType) {
    case "KEY_PAIR":
      return {
        alias: entry.alias,
        entryType: "KEY_PAIR",
        pkcs8: copyBytes(entry.pkcs8),
        certificates: entry.certificates.map(copyBytes),
        localKeyId,
      };
    case "TRUSTED_CERT":
      return {
        alias: entry.alias,
        entryType: "TRUSTED_CERT",
        certificates: entry.certificates.map(copyBytes),
        localKeyId,
      };
    case "KEY":
      return {
        alias: entry.alias,
        entryType: "KEY",
        pkcs8: entry.pkcs8 ? copyBytes(entry.pkcs8) : undefined,
        secret: entry.secret ? copyBytes(entry.secret) : undefined,
        localKeyId,
      };
  }
}

export function cloneStore(store: KeyStore): KeyStore {
  return {
    type: store.type,
    dirty: store.dirty,
    entries: store.entries.map(cloneEntry),
  };
}

export function emptyStore(dirty = true): KeyStore {
  return { type: PKCS12, dirty, entries: [] };
}

export function appendEntry(store: KeyStore, entry: KernelEntry): KeyStore {
  const next = cloneStore(store);
  next.dirty = true;
  next.entries.push(cloneEntry(entry));
  return next;
}

export function factsOf(store: KeyStore, errorId?: ErrorId): KernelFacts {
  return {
    type: store.type,
    aliases: store.entries.map((e) => e.alias),
    entryType: store.entries.map((e) => ({
      alias: e.alias,
      type: e.entryType,
    })),
    dirty: store.dirty,
    errorId,
  };
}

export function emptyFacts(errorId?: ErrorId): KernelFacts {
  return {
    type: PKCS12,
    aliases: [],
    entryType: [],
    dirty: false,
    errorId,
  };
}

export function hasAlias(store: KeyStore, alias: string): boolean {
  return store.entries.some((e) => e.alias === alias);
}

export function getEntryType(store: KeyStore, alias: string): EntryType | undefined {
  return store.entries.find((e) => e.alias === alias)?.entryType;
}

/** Compare alias sets and per-alias entry types (order-independent). */
export function sameEntryFacts(left: KernelFacts, right: KernelFacts): boolean {
  if (left.aliases.length !== right.aliases.length) {
    return false;
  }
  const a = [...left.aliases].sort();
  const b = [...right.aliases].sort();
  if (!a.every((value, i) => value === b[i])) {
    return false;
  }
  const expected = new Map(right.entryType.map((item) => [item.alias, item.type]));
  return left.entryType.every((item) => expected.get(item.alias) === item.type);
}
