import { importTrustedCertificate as kernelImportTrusted } from "../../kernel";
import { isLocked, getActive, getSelection, host, pushHistory, session, undo, unlockAlias } from "../../shell/session";
import type { CommandParams, CommandSpec } from "../../shell/types";
import { flag, passwordOf, str } from "../file/params";
import { importCaReplyIntoStore } from "./ca-reply";
import { setOsClipboard } from "./clipboard";
import { importKeyPairIntoStore } from "./keypair";
import { fail, markPendingUndo, succeed, takePendingUndo } from "./outcome";
import { paramRef, readImportBytes, readStoreBytes } from "./source";

function hasActive(): boolean {
  return getActive() !== null;
}

function selectedKeyPairAlias(): string | undefined {
  const active = getActive();
  const alias = getSelection()[0];
  if (!active || !alias) {
    return undefined;
  }
  const entry = active.store.entries.find((item) => item.alias === alias);
  return entry?.entryType === "KEY_PAIR" ? alias : undefined;
}

function hasKeyPairSelection(): boolean {
  return selectedKeyPairAlias() !== undefined;
}

function applyKernelResult(result: Awaited<ReturnType<typeof kernelImportTrusted>>): void {
  if (result.ok) {
    pushHistory();
    markPendingUndo(true);
  } else {
    markPendingUndo(false);
  }
  session.apply(result);
  if (!result.ok) {
    host.closeDialog();
  }
}

async function importTrustedCertificate(params?: CommandParams): Promise<void> {
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  const bytes = readImportBytes(params, false);
  const alias = str(params, "alias");
  if (!bytes) {
    host.openDialog("dialog.file-open");
    markPendingUndo(false);
    return;
  }
  if (!alias) {
    host.openDialog("dialog.alias");
    markPendingUndo(false);
    return;
  }
  const result = await kernelImportTrusted(active.store, { bytes, alias });
  applyKernelResult(result);
}

async function importKeyPair(params?: CommandParams): Promise<void> {
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  const bytes = readImportBytes(params, false);
  const alias = str(params, "alias");
  if (!bytes) {
    host.openDialog("dialog.import-key-pair");
    markPendingUndo(false);
    return;
  }
  if (!alias) {
    host.openDialog("dialog.alias");
    markPendingUndo(false);
    return;
  }
  const result = await importKeyPairIntoStore(active.store, { bytes, alias });
  applyKernelResult(result);
}

function unlockSelected(params: CommandParams | undefined, alias: string): boolean {
  if (!isLocked(alias)) {
    return true;
  }
  const password = passwordOf(params);
  if (password === undefined) {
    host.openDialog("dialog.password");
    markPendingUndo(false);
    return false;
  }
  const active = getActive();
  if (!active || password !== active.password) {
    fail("wrongPassword", "dialog.problem");
    return false;
  }
  unlockAlias(alias);
  return true;
}

async function importCaReply(
  params: CommandParams | undefined,
  fromClipboard: boolean,
): Promise<void> {
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  const alias = selectedKeyPairAlias();
  if (!alias) {
    fail("emptySelection");
    return;
  }
  if (!unlockSelected(params, alias)) {
    return;
  }
  const bytes = readImportBytes(params, fromClipboard);
  if (!bytes) {
    host.openDialog(fromClipboard ? "dialog.view-certificate" : "dialog.file-open");
    markPendingUndo(false);
    return;
  }
  const current = getActive();
  if (!current) {
    fail("storeNotWritable");
    return;
  }
  const result = importCaReplyIntoStore(current.store, alias, bytes);
  applyKernelResult(result);
}

function cancelCommand(): void {
  if (takePendingUndo()) {
    undo();
  }
  fail("cancelled");
}

function setClipboardCommand(params?: CommandParams): void {
  const text = str(params, "text");
  if (text !== undefined) {
    setOsClipboard(new TextEncoder().encode(text));
    succeed();
    return;
  }
  const bytes = readStoreBytes(str(params, "fixture") ?? paramRef(params));
  setOsClipboard(bytes);
  succeed();
}

export function resetImportState(): void {
  markPendingUndo(false);
}

export const commands: Record<string, CommandSpec> = {
  // file-new-pkcs12 freezes this control disabled; YAML still calls run().
  importTrustedCertificate: { canExecute: () => false, run: importTrustedCertificate },
  importKeyPair: { canExecute: hasActive, run: importKeyPair },
  importCaReplyFromFile: {
    canExecute: hasKeyPairSelection,
    run: (params) => importCaReply(params, false),
  },
  importCaReplyFromClipboard: {
    canExecute: hasKeyPairSelection,
    run: (params) => importCaReply(params, true),
  },
  cancel: { run: cancelCommand },
  setClipboard: { run: setClipboardCommand },
};
