import { ok } from "../../kernel/result";
import { apply, getActive, host, isLocked, pushHistory, unlockAlias } from "../../shell/session";
import type { CommandParams, CommandSpec } from "../../shell/types";
import { setDetailsView } from "../details/view";
import { flag, passwordOf } from "../file/params";
import { appendCertificate, isSelfSignedCert, removeCertificate } from "./kernel";
import { fail, succeed } from "./outcome";
import { canEditChain, selectedKeyPair } from "./selection";
import { readChainBytes } from "./source";

async function unlockSelected(params: CommandParams | undefined, alias: string): Promise<boolean> {
  const password = passwordOf(params);
  if (isLocked(alias) && password === undefined) {
    host.openDialog("dialog.password");
    return false;
  }
  const active = getActive();
  if (password !== undefined && active?.password !== undefined && password !== active.password) {
    fail("wrongPassword", "dialog.problem");
    return false;
  }
  unlockAlias(alias);
  return true;
}

export async function appendToCertificateChain(params?: CommandParams): Promise<void> {
  if (flag(params, "cancel") === true) {
    setDetailsView(null);
    fail("cancelled");
    return;
  }
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  const selected = selectedKeyPair();
  if (!selected) {
    fail("emptySelection");
    return;
  }
  if (!(await unlockSelected(params, selected.alias))) {
    return;
  }
  const last = selected.entry.certificates[selected.entry.certificates.length - 1];
  if (!last || (await isSelfSignedCert(last))) {
    fail("selfSigned");
    return;
  }
  const bytes = readChainBytes(params);
  if (!bytes) {
    host.openDialog("dialog.file-open");
    return;
  }
  const current = getActive();
  if (!current) {
    fail("storeNotWritable");
    return;
  }
  const result = await appendCertificate(current.store, selected.alias, bytes);
  if (!result.ok) {
    fail(result.errorId);
    return;
  }
  pushHistory();
  apply(ok(result.store));
  succeed();
}

export async function removeFromCertificateChain(params?: CommandParams): Promise<void> {
  if (flag(params, "cancel") === true || flag(params, "confirm") === false) {
    setDetailsView(null);
    fail("cancelled");
    return;
  }
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  const selected = selectedKeyPair();
  if (!selected) {
    fail("emptySelection");
    return;
  }
  if (!(await unlockSelected(params, selected.alias))) {
    return;
  }
  if (selected.entry.certificates.length < 2) {
    fail("chainTooShort");
    return;
  }
  if (flag(params, "confirm") !== true) {
    host.openDialog("dialog.confirm");
    return;
  }
  const current = getActive();
  if (!current) {
    fail("storeNotWritable");
    return;
  }
  const result = removeCertificate(current.store, selected.alias);
  if (!result.ok) {
    fail(result.errorId);
    return;
  }
  pushHistory();
  apply(ok(result.store));
  succeed();
}

function cancelCommand(): void {
  setDetailsView(null);
  fail("cancelled");
}

export const commands: Record<string, CommandSpec> = {
  appendToCertificateChain: { canExecute: canEditChain, run: appendToCertificateChain },
  removeFromCertificateChain: { canExecute: canEditChain, run: removeFromCertificateChain },
  cancel: { run: cancelCommand },
};
