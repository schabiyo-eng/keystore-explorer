import { getActive, getSelection } from "../../shell/session";

export function hasActive(): boolean {
  return getActive() !== null;
}

export function selectedKeyPairAlias(): string | undefined {
  const active = getActive();
  const alias = getSelection()[0];
  if (!active || !alias) {
    return undefined;
  }
  const entry = active.store.entries.find((item) => item.alias === alias);
  return entry?.entryType === "KEY_PAIR" ? alias : undefined;
}

export function hasKeyPairSelection(): boolean {
  return selectedKeyPairAlias() !== undefined;
}
