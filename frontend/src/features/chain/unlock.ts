import { getActive, host, isLocked, unlockAlias } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { fail } from "./outcome";
import { passwordOf } from "./params";

/** Unlock a KEY_PAIR alias for chain edit. Wrong password is a problem dialog. */
export function unlockSelected(params: CommandParams | undefined, alias: string): boolean {
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
