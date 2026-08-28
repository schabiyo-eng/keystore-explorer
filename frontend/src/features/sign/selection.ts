import { isKeyPairEntry } from "../../kernel";
import type { KeyPairEntry } from "../../kernel/types";
import { getActive, getSelection } from "../../shell/session";

export function selectedKeyPair(): { alias: string; entry: KeyPairEntry } | undefined {
  const active = getActive();
  const alias = getSelection()[0];
  if (!active || !alias) {
    return undefined;
  }
  const entry = active.store.entries.find((item) => item.alias === alias);
  if (!entry || !isKeyPairEntry(entry)) {
    return undefined;
  }
  return { alias, entry };
}

export function canSign(): boolean {
  return selectedKeyPair() !== undefined;
}
