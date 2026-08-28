import { getActive, getSelection, host, isLocked } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { applyMutation, clearAbortable } from "./abortable";
import { renameAlias } from "./kernel";
import { fail } from "./outcome";
import { flag, passwordOf, str } from "./params";

export async function renameEntry(params?: CommandParams): Promise<void> {
  clearAbortable();
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
