import type { KernelEntry } from "../../kernel";
import { getActive, getSelection } from "../../shell/session";
import { snapshotEntries } from "./buffer";
import { fail } from "./outcome";

/**
 * Snapshot the current table selection into cloned kernel entries, or fail
 * with the YAML emptySelection / storeNotWritable oracles.
 */
export function snapshotSelection(): KernelEntry[] | undefined {
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return undefined;
  }
  const aliases = getSelection();
  if (aliases.length === 0) {
    fail("emptySelection");
    return undefined;
  }
  const entries = snapshotEntries(active.store, aliases);
  if (entries.length === 0) {
    fail("emptySelection");
    return undefined;
  }
  return entries;
}
