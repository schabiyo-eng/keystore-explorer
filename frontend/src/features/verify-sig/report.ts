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

export function getVerifyResult(): VerifyOutcome | undefined {
  return lastResult;
}

export function getReport(): VerifyReport | null {
  return report;
}

export function setVerifyResult(result: VerifyOutcome | undefined): void {
  lastResult = result;
}

export function setReport(next: VerifyReport | null): void {
  report = next;
}

export function resetVerifyState(): void {
  lastResult = undefined;
  report = null;
}
