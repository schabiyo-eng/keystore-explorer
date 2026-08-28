import { getActive, host, isLocked, unlockAlias } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { applyKernelResult } from "./abortable";
import { importCaReplyIntoStore } from "./ca-reply";
import { fail, markPendingUndo } from "./outcome";
import { flag, passwordOf } from "./params";
import { selectedKeyPairAlias } from "./selection";
import { readImportBytes } from "./source";

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

async function importCaReply(params: CommandParams | undefined, fromClipboard: boolean): Promise<void> {
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

export function importCaReplyFromFile(params?: CommandParams): Promise<void> {
  return importCaReply(params, false);
}

export function importCaReplyFromClipboard(params?: CommandParams): Promise<void> {
  return importCaReply(params, true);
}
