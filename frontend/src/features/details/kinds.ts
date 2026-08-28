import { isKeyEntry, isKeyPairEntry, isTrustedCertEntry } from "../../kernel";
import { getActive, getSelection } from "../../shell/session";

export const DETAILS_KINDS = [
  "key",
  "keyPairChain",
  "keyPairPrivateKey",
  "keyPairPublicKey",
  "trustedCertificate",
  "trustedCertificatePublicKey",
  "selectedCertificatesChain",
] as const;

export type DetailsKind = (typeof DETAILS_KINDS)[number];

const KIND_SET = new Set<string>(DETAILS_KINDS);

export function isDetailsKind(value: string | undefined): value is DetailsKind {
  return value !== undefined && KIND_SET.has(value);
}

export function selectedEntries() {
  const active = getActive();
  if (!active) {
    return [];
  }
  const wanted = new Set(getSelection());
  return active.store.entries.filter((entry) => wanted.has(entry.alias));
}

export function inferKind(): DetailsKind | undefined {
  const aliases = getSelection();
  if (aliases.length === 0) {
    return undefined;
  }
  if (aliases.length > 1) {
    return "selectedCertificatesChain";
  }
  const [entry] = selectedEntries();
  if (!entry) {
    return undefined;
  }
  if (isKeyEntry(entry)) {
    return "key";
  }
  if (isKeyPairEntry(entry)) {
    return "keyPairChain";
  }
  if (isTrustedCertEntry(entry)) {
    return "trustedCertificate";
  }
  return undefined;
}

export function selectionMatches(kind: DetailsKind): boolean {
  const aliases = getSelection();
  if (kind === "selectedCertificatesChain") {
    return aliases.length > 0;
  }
  if (aliases.length !== 1) {
    return false;
  }
  const [entry] = selectedEntries();
  if (!entry) {
    return false;
  }
  switch (kind) {
    case "key":
      return isKeyEntry(entry);
    case "keyPairChain":
    case "keyPairPrivateKey":
    case "keyPairPublicKey":
      return isKeyPairEntry(entry);
    case "trustedCertificate":
    case "trustedCertificatePublicKey":
      return isTrustedCertEntry(entry);
  }
}

export function needsPassword(kind: DetailsKind): boolean {
  return kind === "key" || kind === "keyPairPrivateKey";
}
