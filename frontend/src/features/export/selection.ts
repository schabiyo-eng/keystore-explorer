import type { KernelEntry } from "../../kernel";
import { isKeyPairEntry, isTrustedCertEntry } from "../../kernel";
import { getActive, getSelection } from "../../shell/session";

export function hasActiveStore(): boolean {
  return getActive() !== null;
}

export function certificatesOf(entry: KernelEntry): Uint8Array[] {
  if (entry.entryType === "KEY") {
    return [];
  }
  return entry.certificates;
}

export function selectedEntries(): KernelEntry[] {
  const active = getActive();
  if (!active) {
    return [];
  }
  const selected = new Set(getSelection());
  return active.store.entries.filter((entry) => selected.has(entry.alias));
}

export function selectedOfType(entryType: KernelEntry["entryType"]): KernelEntry | undefined {
  const matches = selectedEntries().filter((entry) => entry.entryType === entryType);
  return matches.length === 1 ? matches[0] : undefined;
}

export function selectedKeyPair(): Extract<KernelEntry, { entryType: "KEY_PAIR" }> | undefined {
  const entry = selectedOfType("KEY_PAIR");
  return entry && isKeyPairEntry(entry) ? entry : undefined;
}

/** YAML `source`: chain | trusted | selected, or infer from the current row(s). */
export function certEntries(source: string | undefined): KernelEntry[] {
  const selected = selectedEntries();
  if (source === "chain") {
    return selected.filter(isKeyPairEntry);
  }
  if (source === "trusted") {
    return selected.filter(isTrustedCertEntry);
  }
  if (source === "selected") {
    return selected.filter((entry) => certificatesOf(entry).length > 0);
  }
  if (selected.length === 1 && selected[0] && isKeyPairEntry(selected[0])) {
    return selected;
  }
  if (selected.length === 1 && selected[0] && isTrustedCertEntry(selected[0])) {
    return selected;
  }
  return selected.filter((entry) => certificatesOf(entry).length > 0);
}

export function publicKeyEntry(source: string | undefined): KernelEntry | undefined {
  if (source === "keyPair") {
    return selectedOfType("KEY_PAIR");
  }
  if (source === "trusted") {
    return selectedOfType("TRUSTED_CERT");
  }
  return selectedOfType("KEY_PAIR") ?? selectedOfType("TRUSTED_CERT");
}

export function canExportCsv(): boolean {
  return hasActiveStore();
}

export function canExportKeyPair(): boolean {
  return selectedKeyPair() !== undefined;
}

export function canExportCertificate(): boolean {
  return certEntries(undefined).length > 0;
}

export function canExportPublicKey(): boolean {
  return publicKeyEntry(undefined) !== undefined;
}
