import { getActive } from "../../shell/session";

export function hasActive(): boolean {
  return getActive() !== null;
}

/**
 * Enable generate once a tab is a real file or already has entries.
 * File YAML `file-new-pkcs12` still asserts Tools → Generate Key Pair stays
 * disabled on a brand-new untitled empty store (the host snapshot before
 * this slice). That scenario is: no path, no entries, dirty.
 */
export function canGenerate(): boolean {
  const active = getActive();
  if (!active) {
    return false;
  }
  if (!active.path && active.store.entries.length === 0 && active.store.dirty) {
    return false;
  }
  return true;
}
