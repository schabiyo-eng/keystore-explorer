import { isKeyPairEntry } from "../../kernel";
import { getActive, getSelection } from "../../shell/session";
import type { KeyPairEntry } from "../../kernel/types";

export function selectedKeyPair(): { alias: string; entry: KeyPairEntry } | undefined {
  const active = getActive();
  const alias = getSelection()[0];
  if (!active || getSelection().length !== 1 || !alias) {
    return undefined;
  }
  const entry = active.store.entries.find((item) => item.alias === alias);
  if (!entry || !isKeyPairEntry(entry)) {
    return undefined;
  }
  return { alias, entry };
}

export function canEditChain(): boolean {
  return selectedKeyPair() !== undefined;
}
