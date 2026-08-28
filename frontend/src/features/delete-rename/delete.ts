import { getActive, getSelection, host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { applyMutation, clearAbortable } from "./abortable";
import { deleteAliases } from "./kernel";
import { fail } from "./outcome";
import { flag } from "./params";

export async function deleteEntry(params?: CommandParams): Promise<void> {
  clearAbortable();
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
