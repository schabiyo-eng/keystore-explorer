import type { KernelEntry, KeyStore } from "../../kernel";
import { cloneEntry } from "../../kernel/store";

/** YAML `buffer` oracle: internal cut/copy buffer, not the OS clipboard. */
export type BufferMode = "empty" | "copy" | "cut";

let mode: BufferMode = "empty";
let entries: KernelEntry[] = [];

export function resetBuffer(): void {
  mode = "empty";
  entries = [];
}

export function getBufferMode(): BufferMode {
  return mode;
}

export function hasBuffer(): boolean {
  return mode !== "empty" && entries.length > 0;
}

export function bufferEntries(): KernelEntry[] {
  return entries.map(cloneEntry);
}

export function snapshotEntries(store: KeyStore, aliases: readonly string[]): KernelEntry[] {
  const wanted = new Set(aliases);
  return store.entries.filter((entry) => wanted.has(entry.alias)).map(cloneEntry);
}

export function setBuffer(next: KernelEntry[], nextMode: "copy" | "cut"): void {
  mode = nextMode;
  entries = next.map(cloneEntry);
}
