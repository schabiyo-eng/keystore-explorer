import { fail, ok } from "../../kernel/result";
import { cloneStore, hasAlias } from "../../kernel/store";
import type { KernelResult, KeyStore } from "../../kernel";

/** Remove selected aliases from the kernel store. Does not parse PKCS#12. */
export function deleteAliases(store: KeyStore, aliases: readonly string[]): KernelResult {
  if (aliases.length === 0) {
    return fail("emptySelection", store);
  }
  const remove = new Set(aliases);
  const next = cloneStore(store);
  next.entries = next.entries.filter((entry) => !remove.has(entry.alias));
  next.dirty = true;
  return ok(next);
}

/** Move one alias. Duplicate names fail; PKCS#12 bytes stay in the kernel store. */
export function renameAlias(store: KeyStore, alias: string, newAlias: string): KernelResult {
  const trimmed = newAlias.trim();
  if (!alias || !trimmed) {
    return fail("emptySelection", store);
  }
  if (hasAlias(store, trimmed) && alias !== trimmed) {
    return fail("duplicateAlias", store);
  }
  const next = cloneStore(store);
  const entry = next.entries.find((item) => item.alias === alias);
  if (!entry) {
    return fail("notFound", store);
  }
  if (entry.alias !== trimmed) {
    entry.alias = trimmed;
    next.dirty = true;
  }
  return ok(next);
}
