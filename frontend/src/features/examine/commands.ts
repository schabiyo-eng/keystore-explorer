import { host } from "../../shell/session";
import type { CommandParams, CommandSpec } from "../../shell/types";
import { getOsClipboard, resetClipboard, setClipboardCommand } from "./clipboard";
import { flag, num, str } from "./params";
import { fail, resetExamineOutcome } from "./outcome";
import { presentBytes, presentCertificates, presentDetect } from "./present";
import { detectExaminedType } from "./detect";
import { fetchSslCertificates, resetSslStub } from "./ssl";
import { resetExamineView } from "./view";

function cancelled(params?: CommandParams): boolean {
  return flag(params, "cancel") === true;
}

function readNamedBytes(params?: CommandParams): Uint8Array | undefined {
  const ref = str(params, "fixture") ?? str(params, "path");
  if (!ref) {
    return undefined;
  }
  const stored = host.vfsRead(ref);
  return stored ? new Uint8Array(stored) : undefined;
}

function alwaysEnabled(): boolean {
  return true;
}

export function resetExamineState(): void {
  resetClipboard();
  resetExamineOutcome();
  resetExamineView();
  resetSslStub();
}

export async function examineFile(params?: CommandParams): Promise<void> {
  if (cancelled(params)) {
    fail("cancelled");
    return;
  }
  const bytes = readNamedBytes(params);
  if (!bytes) {
    host.openDialog("dialog.file-open");
    return;
  }
  presentBytes(bytes, "dialog.error");
}

export async function examineClipboard(params?: CommandParams): Promise<void> {
  if (cancelled(params)) {
    fail("cancelled");
    return;
  }
  const bytes = getOsClipboard();
  if (!bytes || bytes.byteLength === 0) {
    presentBytes(new Uint8Array(), "dialog.error");
    return;
  }
  presentBytes(bytes, "dialog.error");
}

export async function examineSsl(params?: CommandParams): Promise<void> {
  if (cancelled(params)) {
    fail("cancelled");
    return;
  }
  const hostname = str(params, "host");
  const port = num(params, "port") ?? 443;
  if (!hostname) {
    host.openDialog("dialog.examine-ssl");
    return;
  }
  const fetched = await fetchSslCertificates(hostname, port);
  if (!fetched.ok) {
    fail("networkError", "dialog.error");
    return;
  }
  presentCertificates(fetched.certs, `Certificate Details for SSL Connection '${hostname}:${port}'`);
}

export async function detectFileType(params?: CommandParams): Promise<void> {
  if (cancelled(params)) {
    fail("cancelled");
    return;
  }
  const bytes = readNamedBytes(params);
  if (!bytes) {
    host.openDialog("dialog.file-open");
    return;
  }
  presentDetect(detectExaminedType(bytes));
}

export const commands: Record<string, CommandSpec> = {
  examineFile: { canExecute: alwaysEnabled, run: examineFile },
  examineClipboard: { canExecute: alwaysEnabled, run: examineClipboard },
  examineSsl: { canExecute: alwaysEnabled, run: examineSsl },
  detectFileType: { canExecute: alwaysEnabled, run: detectFileType },
  setClipboard: { run: setClipboardCommand },
  cancel: { run: () => fail("cancelled") },
};
