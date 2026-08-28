import { getActive, host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { applyMutation, clearAbortable } from "./abortable";
import { bufferEntries, getBufferMode, hasBuffer, resetBuffer } from "./buffer";
import { pasteEntries } from "./kernel";
import { fail, succeed } from "./outcome";
import { flag } from "./params";

function hasOverlap(): boolean {
  const active = getActive();
  if (!active) {
    return false;
  }
  const aliases = new Set(bufferEntries().map((entry) => entry.alias));
  return active.store.entries.some((entry) => aliases.has(entry.alias));
}

/** Insert the internal buffer into the active store. */
export async function paste(params?: CommandParams): Promise<void> {
  clearAbortable();
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  if (!hasBuffer()) {
    fail("bufferEmpty");
    return;
  }
  if (flag(params, "cancel") === true) {
    fail("cancelled");
    return;
  }
  const replace = flag(params, "replaceExisting");
  if (hasOverlap() && replace === undefined) {
    host.openDialog("dialog.confirm");
    return;
  }
  if (hasOverlap() && replace === false) {
    fail("cancelled");
    return;
  }
  const result = pasteEntries(active.store, bufferEntries(), replace === true);
  if (!result.ok) {
    fail(result.errorId);
    return;
  }
  applyMutation(result);
  const pasted = bufferEntries().map((entry) => entry.alias);
  if (getBufferMode() === "cut") {
    resetBuffer();
  }
  host.setSelection(pasted);
  succeed();
}
