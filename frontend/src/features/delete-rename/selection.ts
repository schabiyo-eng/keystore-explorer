import { getActive, getSelection, host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";

export function hasStore(): boolean {
  return getActive() !== null;
}

export function hasSelection(): boolean {
  return hasStore() && getSelection().length > 0;
}

export function hasSingleSelection(): boolean {
  return hasStore() && getSelection().length === 1;
}

/** Schema driver primitive: table selection. */
export function selectEntries(params?: CommandParams): void {
  const aliases = params?.aliases;
  if (!Array.isArray(aliases)) {
    host.setSelection([]);
    return;
  }
  host.setSelection(aliases.filter((item): item is string => typeof item === "string"));
}
