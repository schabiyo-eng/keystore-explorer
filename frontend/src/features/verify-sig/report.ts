export type VerifyOutcome = "valid" | "invalid" | "incomplete";

export interface JarEntryRow {
  flags: string;
  size: number;
  date: string;
  name: string;
}

export interface SignerRow {
  subject: string;
  issuer: string;
  version: string;
  algorithm: string;
  signingTime: string;
}

export interface JarReport {
  kind: "jar";
  result: VerifyOutcome;
  status: string;
  entries: JarEntryRow[];
  signers: SignerRow[];
}

export interface SignatureReport {
  kind: "signature";
  result: VerifyOutcome;
  status: string;
  signers: SignerRow[];
}

export type VerifyReport = JarReport | SignatureReport;

let lastResult: VerifyOutcome | undefined;
let report: VerifyReport | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getVerifyResult(): VerifyOutcome | undefined {
  return lastResult;
}

export function getReport(): VerifyReport | null {
  return report;
}

export function subscribeVerifyReport(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setVerifyResult(result: VerifyOutcome | undefined): void {
  lastResult = result;
  notify();
}

export function setReport(next: VerifyReport | null): void {
  report = next;
  notify();
}

export function resetVerifyState(): void {
  lastResult = undefined;
  report = null;
  notify();
}
