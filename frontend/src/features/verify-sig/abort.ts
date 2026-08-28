import type { CommandParams } from "../../shell/types";
import { fail, succeed } from "./outcome";
import { flag } from "./params";
import { resetVerifyState } from "./report";

/** Shared cancel / dismiss path for verify dialogs. Does not mutate the store. */
export function abortIfClosed(params?: CommandParams): boolean {
  if (flag(params, "cancel") || flag(params, "confirm") === false) {
    resetVerifyState();
    fail("cancelled");
    return true;
  }
  if (flag(params, "dismiss")) {
    succeed();
    return true;
  }
  return false;
}
