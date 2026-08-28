import { getEntryType } from "../../kernel/store";
import type { EntryType } from "../../kernel";
import { getActive, host } from "../../shell/session";

export function hasActive(): boolean {
  return getActive() !== null;
}

export function selectedAlias(): string | undefined {
  return host.getState().selection[0];
}

export function selectedAliases(): string[] {
  return host.getState().selection;
}

export function selectedEntryType(): EntryType | undefined {
  const active = getActive();
  const alias = selectedAlias();
  if (!active || !alias) {
    return undefined;
  }
  return getEntryType(active.store, alias);
}

export function hasSelectedType(entryType: "KEY" | "KEY_PAIR"): boolean {
  return hasActive() && selectedEntryType() === entryType;
}

/** YAML command used to change KEY vs KEY_PAIR entry passwords. */
export function entryPasswordCommand(): "setKeyPassword" | "setKeyPairPassword" {
  return selectedEntryType() === "KEY_PAIR" ? "setKeyPairPassword" : "setKeyPassword";
}
