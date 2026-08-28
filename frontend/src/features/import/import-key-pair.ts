import { getActive, host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { applyKernelResult } from "./abortable";
import { importKeyPairIntoStore } from "./keypair";
import { fail, markPendingUndo } from "./outcome";
import { flag, str } from "./params";
import { setPendingAliasCommand } from "./pending";
import { readImportBytes } from "./source";

export async function importKeyPair(params?: CommandParams): Promise<void> {
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
    setPendingAliasCommand("importKeyPair");
    host.openDialog("dialog.alias");
    markPendingUndo(false);
    return;
  }
  const result = await importKeyPairIntoStore(active.store, { bytes, alias });
  applyKernelResult(result);
}
