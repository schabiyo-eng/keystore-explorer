import type { CommandParams } from "../../shell/types";
import { fail, show, succeed } from "./outcome";
import { flag } from "./params";

/**
 * Help dialogs are read-only: dismiss / Escape-cancel / show.
 * They never `apply()` or dirty the store.
 */
export function runHelpDialog(dialog: string, params?: CommandParams): void {
  if (flag(params, "dismiss")) {
    succeed();
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  show(dialog);
}

export function cancelCommand(): void {
  fail("cancelled");
}
