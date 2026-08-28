import { isKeyPairEntry, isTrustedCertEntry } from "../../kernel";
import { getActive, getSelection } from "../../shell/session";
import { certificatesOf } from "./crypto";

export function selectedCertBytes(): Uint8Array | undefined {
  const active = getActive();
  const alias = getSelection()[0];
  if (!active || !alias) {
    return undefined;
  }
  const entry = active.store.entries.find((item) => item.alias === alias);
  if (!entry) {
    return undefined;
  }
  return certificatesOf(entry)[0];
}

export function canVerifyCertificate(): boolean {
  const active = getActive();
  const alias = getSelection()[0];
  if (!active || !alias) {
    return false;
  }
  const entry = active.store.entries.find((item) => item.alias === alias);
  return Boolean(entry && (isKeyPairEntry(entry) || isTrustedCertEntry(entry)));
}
