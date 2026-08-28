import type { JarEntryRow } from "./report";

function isMetaInf(name: string): boolean {
  return name.toUpperCase().startsWith("META-INF/");
}

export function jarStatus(ok: boolean, trusted: boolean): string {
  if (!ok) {
    return "Invalid";
  }
  return trusted ? "JAR verified" : "JAR verified - certificate not trusted";
}

export function signatureStatus(ok: boolean, trusted: boolean): string {
  if (!ok) {
    return "Invalid";
  }
  return trusted ? "Valid" : "Valid - Not Trusted";
}

export function payloadEntryNames(entries: { name: string }[]): Set<string> {
  return new Set(entries.filter((entry) => !isMetaInf(entry.name)).map((entry) => entry.name));
}

export function jarRows(
  entries: { name: string; data: Uint8Array }[],
  signedNames: Set<string>,
): JarEntryRow[] {
  const now = new Date().toUTCString();
  return entries.map((entry) => ({
    flags: signedNames.has(entry.name) || isMetaInf(entry.name) ? "sm " : "  ",
    size: entry.data.length,
    date: now,
    name: entry.name,
  }));
}
