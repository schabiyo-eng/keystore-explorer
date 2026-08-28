import type { KeyPairEntry } from "../../kernel/types";
import { getActive, host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { clearOsClipboard } from "./clipboard";
import { fail, succeed } from "./outcome";
import { flag, passwordOf } from "./params";
import { selectedKeyPair } from "./selection";

/**
 * Shared gate for key-pair signing: cancel, password, then the action dialog.
 * Command runners stay in commands.ts; this does not change YAML `when` names.
 */
export async function withSigner(
  params: CommandParams | undefined,
  dialogId: string,
  ready: (params: CommandParams) => boolean,
  run: (entry: KeyPairEntry, params: CommandParams) => Promise<void>,
): Promise<void> {
  if (flag(params, "cancel")) {
    clearOsClipboard();
    fail("cancelled");
    return;
  }
  if (flag(params, "dismiss")) {
    succeed();
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
  const password = passwordOf(params);
  if (password === undefined) {
    host.openDialog("dialog.password");
    return;
  }
  if (password !== active.password) {
    clearOsClipboard();
    fail("wrongPassword");
    return;
  }
  if (!ready(params ?? {})) {
    host.openDialog(dialogId);
    return;
  }
  try {
    await run(selected.entry, params ?? {});
  } catch {
    fail("invalidFile");
  }
}
