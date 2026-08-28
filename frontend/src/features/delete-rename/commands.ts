import { importTrustedCertificate as kernelImport } from "../../kernel";
import type { KernelResult } from "../../kernel";
import {
  apply,
  getActive,
  getSelection,
  host,
  isLocked,
  pushHistory,
  undo,
} from "../../shell/session";
import type { CommandParams, CommandSpec } from "../../shell/types";
import { flag, passwordOf, str } from "../file/params";
import { namedFixture } from "./fixtures";
import { deleteAliases, renameAlias } from "./kernel";
import { fail } from "./outcome";

/** True after a mutating abortable command so YAML `cancel: {}` can roll it back. */
let abortableMutation = false;

function hasStore(): boolean {
  return getActive() !== null;
}

function hasSelection(): boolean {
  return hasStore() && getSelection().length > 0;
}

function hasSingleSelection(): boolean {
  return hasStore() && getSelection().length === 1;
}

function rememberAbortable(): void {
  abortableMutation = true;
}

function forgetAbortable(): void {
  abortableMutation = false;
}

function applyMutation(result: Extract<KernelResult, { ok: true }>): void {
  pushHistory();
  apply(result);
  rememberAbortable();
}

function bytesParam(params?: CommandParams): Uint8Array | undefined {
  const raw = params?.bytes;
  if (raw instanceof Uint8Array) {
    return raw;
  }
  const fixture = str(params, "fixture");
  return fixture ? namedFixture(fixture) : undefined;
}

async function deleteEntry(params?: CommandParams): Promise<void> {
  forgetAbortable();
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  const aliases = getSelection();
  if (aliases.length === 0) {
    fail("emptySelection");
    return;
  }
  if (flag(params, "confirm") === false || flag(params, "cancel") === true) {
    fail("cancelled");
    return;
  }
  if (flag(params, "confirm") !== true) {
    host.openDialog("dialog.confirm");
    return;
  }
  const result = deleteAliases(active.store, aliases);
  if (!result.ok) {
    fail(result.errorId);
    return;
  }
  applyMutation(result);
  const current = getActive();
  if (current) {
    const removed = new Set(aliases);
    host.updateTab(current.id, {
      unlocked: (current.unlocked ?? []).filter((alias) => !removed.has(alias)),
    });
  }
  host.setSelection([]);
}

async function renameEntry(params?: CommandParams): Promise<void> {
  forgetAbortable();
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel") === true) {
    fail("cancelled");
    return;
  }
  const aliases = getSelection();
  if (aliases.length !== 1) {
    fail("emptySelection");
    return;
  }
  const alias = aliases[0];
  if (!alias) {
    fail("emptySelection");
    return;
  }
  const newAlias = str(params, "newAlias")?.trim();
  if (!newAlias) {
    host.openDialog("dialog.alias");
    return;
  }
  const entry = active.store.entries.find((item) => item.alias === alias);
  if (!entry) {
    fail("notFound");
    return;
  }
  if (entry.entryType !== "TRUSTED_CERT") {
    const password = passwordOf(params);
    if (password === undefined) {
      if (isLocked(alias)) {
        host.openDialog("dialog.password");
        return;
      }
    } else if (password !== active.password) {
      fail("wrongPassword", "dialog.problem");
      return;
    }
  }
  const result = renameAlias(active.store, alias, newAlias);
  if (!result.ok) {
    fail(result.errorId);
    return;
  }
  applyMutation(result);
  const current = getActive();
  if (current) {
    const unlocked = (current.unlocked ?? []).map((item) => (item === alias ? newAlias : item));
    if (entry.entryType !== "TRUSTED_CERT" && !unlocked.includes(newAlias)) {
      unlocked.push(newAlias);
    }
    host.updateTab(current.id, { unlocked });
  }
  host.setSelection([newAlias]);
}

/** Schema driver primitive: dismiss the open dialog, or undo the last abortable mutate. */
async function cancelCommand(): Promise<void> {
  if (abortableMutation) {
    undo();
    forgetAbortable();
  }
  fail("cancelled");
}

/** Schema driver primitive: table selection. */
function selectEntries(params?: CommandParams): void {
  const aliases = params?.aliases;
  if (!Array.isArray(aliases)) {
    host.setSelection([]);
    return;
  }
  host.setSelection(aliases.filter((item): item is string => typeof item === "string"));
}

/**
 * Kernel import used by this slice's YAML `when` steps. Menu stays disabled;
 * the import slice owns Tools → Import Trusted Certificate.
 */
async function importTrustedCertificate(params?: CommandParams): Promise<void> {
  forgetAbortable();
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel") === true) {
    fail("cancelled");
    return;
  }
  const alias = str(params, "alias");
  const bytes = bytesParam(params);
  if (!alias || !bytes) {
    fail("invalidFile");
    return;
  }
  const result = await kernelImport(active.store, { bytes, alias });
  if (!result.ok) {
    fail(result.errorId);
    return;
  }
  applyMutation(result);
}

export const commands: Record<string, CommandSpec> = {
  deleteEntry: { canExecute: hasSelection, run: deleteEntry },
  renameEntry: { canExecute: hasSingleSelection, run: renameEntry },
  cancel: { run: cancelCommand },
  selectEntries: { run: selectEntries },
  importTrustedCertificate: { canExecute: () => false, run: importTrustedCertificate },
};
