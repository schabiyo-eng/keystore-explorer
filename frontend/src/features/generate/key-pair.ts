import { generateKeyPair as kernelGenerateKeyPair } from "../../kernel";
import { getActive, host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { commitGeneratedEntry } from "./commit";
import { absorbParams, clearDraft, getDraft, patchDraft } from "./draft";
import { hasActive } from "./gate";
import { fail } from "./outcome";
import { flag } from "./params";

export async function generateKeyPairCommand(params?: CommandParams): Promise<void> {
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
    const active = getActive();
    if (!active) {
      fail("storeNotWritable");
      return;
    }
    await commitGeneratedEntry((store) =>
      kernelGenerateKeyPair(store, {
        algorithm: draft.algorithm ?? "RSA",
        keySize: draft.keySize,
        alias: draft.alias ?? "",
      }),
    );
    return;
  }

  if (!draft.algorithm || draft.keySize === undefined) {
    host.openDialog("dialog.generate-key-pair");
    return;
  }

  if (flag(params, "fromCert") || draft.stage === "cert") {
    patchDraft({ stage: "alias" });
    host.openDialog("dialog.alias");
    return;
  }

  patchDraft({ stage: "cert" });
  host.openDialog("dialog.generate-key-pair-cert");
}
