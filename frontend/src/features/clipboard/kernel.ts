import type { KernelEntry, KernelResult, KeyStore } from "../../kernel";
import { fail, ok } from "../../kernel/result";
import { cloneEntry, cloneStore } from "../../kernel/store";

/**
 * Insert buffered entries into the active PKCS#12 store.
 * Duplicate aliases are replaced only when `replace` is true.
 */
export function pasteEntries(
  store: KeyStore,
  entries: readonly KernelEntry[],
  replace: boolean,
): KernelResult {
  if (entries.length === 0) {
    return fail("emptySelection", store);
  }
  const incoming = new Set(entries.map((entry) => entry.alias));
  const overlap = store.entries.some((entry) => incoming.has(entry.alias));
  if (overlap && !replace) {
    return fail("cancelled", store);
  }
  const next = cloneStore(store);
  if (overlap) {
    next.entries = next.entries.filter((entry) => !incoming.has(entry.alias));
  }
  for (const entry of entries) {
    next.entries.push(cloneEntry(entry));
  }
  next.dirty = true;
  return ok(next);
}
