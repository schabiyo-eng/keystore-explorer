import { putSecretKey } from "../../kernel";
import { host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { commitGeneratedEntry } from "./commit";
import { absorbParams, clearDraft, getDraft } from "./draft";
import { hasActive } from "./gate";
import { fail } from "./outcome";
import { flag } from "./params";
import { generateAesKey } from "./secret";

export async function generateSecretKeyCommand(params?: CommandParams): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    clearDraft();
    fail("cancelled");
    return;
  }

  absorbParams(params);
  const draft = getDraft();

  if (draft.algorithm && draft.keySize !== undefined && draft.alias) {
    if (draft.algorithm !== "AES") {
      fail("unsupportedType");
      return;
    }
    const secret = await generateAesKey(draft.keySize);
    if (!secret) {
      fail("unsupportedType");
      return;
    }
    await commitGeneratedEntry((store) => putSecretKey(store, { alias: draft.alias ?? "", secret }));
    return;
  }

  if (!draft.algorithm || draft.keySize === undefined) {
    host.openDialog("dialog.generate-secret-key");
    return;
  }

  host.openDialog("dialog.alias");
}
