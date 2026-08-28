import { save as kernelSave } from "../../kernel";
import { cloneEntry } from "../../kernel/store";
import { host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { KEY_PAIR_DIALOG } from "./ids";
import { fail } from "./outcome";
import { cancelled, str } from "./params";
import { hasActiveStore, selectedKeyPair } from "./selection";
import { requireExportPassword, writeExportedFile } from "./write";

export async function exportKeyPair(params?: CommandParams): Promise<void> {
  if (!hasActiveStore()) {
    fail("storeNotWritable");
    return;
  }
  if (cancelled(params)) {
    fail("cancelled");
    return;
  }
  const entry = selectedKeyPair();
  if (!entry) {
    fail("emptySelection");
    return;
  }
  const format = str(params, "format") ?? "PKCS12";
  if (format !== "PKCS12") {
    fail("unsupportedType");
    return;
  }
  const path = str(params, "path");
  const password = requireExportPassword(params, KEY_PAIR_DIALOG);
  if (!path) {
    host.openDialog(KEY_PAIR_DIALOG);
    return;
  }
  if (password === undefined) {
    return;
  }
  const saved = await kernelSave(
    {
      type: "PKCS12",
      dirty: false,
      entries: [cloneEntry(entry)],
    },
    password,
  );
  if (!saved.ok) {
    fail(saved.errorId);
    return;
  }
  writeExportedFile(path, saved.bytes, password);
}
