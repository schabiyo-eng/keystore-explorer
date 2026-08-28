import { putSecretKey } from "../../kernel";
import { host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { commitGeneratedEntry } from "./commit";
import { clearDraft, getDraft, patchDraft } from "./draft";
import { hasActive } from "./gate";
import { fail } from "./outcome";
import { flag, resolvePassword, str } from "./params";

export async function storePassphraseCommand(params?: CommandParams): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    clearDraft();
    fail("cancelled");
    return;
  }

  const passphrase = resolvePassword(params?.passphrase) ?? str(params, "passphrase");
  if (passphrase !== undefined) {
    patchDraft({ passphrase });
  }
  const alias = str(params, "alias");
  if (alias !== undefined) {
    patchDraft({ alias });
  }
  const draft = getDraft();

  if (draft.passphrase && draft.alias) {
    const secret = new TextEncoder().encode(draft.passphrase);
    await commitGeneratedEntry((store) => putSecretKey(store, { alias: draft.alias ?? "", secret }));
    return;
  }

  host.openDialog("dialog.store-passphrase");
}
