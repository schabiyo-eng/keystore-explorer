import { APP_VERSION } from "./info";

/** Swing `URLs.LATEST_VERSION_ADDRESS`. */
export const LATEST_VERSION_URL = "https://keystore-explorer.org/version.txt";

export type FetchLatestVersion = () => Promise<string>;

export async function defaultFetchLatestVersion(): Promise<string> {
  const response = await fetch(LATEST_VERSION_URL);
  if (!response.ok) {
    throw new Error("network");
  }
  const version = (await response.text()).trim();
  if (!version) {
    throw new Error("network");
  }
  return version;
}

let fetchLatestVersion: FetchLatestVersion = defaultFetchLatestVersion;
let updateResult = "";
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

/** Tests inject a fixture so YAML does not hit a live update server. */
export function setFetchLatestVersion(fn?: FetchLatestVersion): void {
  fetchLatestVersion = fn ?? defaultFetchLatestVersion;
}

export function getUpdateResult(): string {
  return updateResult;
}

export function setUpdateResult(message: string): void {
  updateResult = message;
  notify();
}

export function subscribeUpdateResult(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetUpdateState(): void {
  fetchLatestVersion = defaultFetchLatestVersion;
  updateResult = "";
  notify();
}

export function versionParts(value: string): number[] {
  return value
    .trim()
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
}

export function isNewer(latest: string, current: string): boolean {
  const a = versionParts(latest);
  const b = versionParts(current);
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const delta = (a[i] ?? 0) - (b[i] ?? 0);
    if (delta !== 0) {
      return delta > 0;
    }
  }
  return false;
}

export function updateResultMessage(latest: string, current = APP_VERSION): string {
  if (isNewer(latest, current)) {
    return `A newer version of KeyStore Explorer (${latest}) is available from the KeyStore Explorer website.`;
  }
  return `This version of KeyStore Explorer (${current}) is the latest.`;
}

export async function fetchLatest(): Promise<string> {
  return fetchLatestVersion();
}
