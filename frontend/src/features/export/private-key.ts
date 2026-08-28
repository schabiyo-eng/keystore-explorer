import { host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { encodePkcs8Pem } from "./encode";
import { PRIVATE_KEY_DIALOG } from "./ids";
import { fail } from "./outcome";
import { cancelled, str } from "./params";
import { hasActiveStore, selectedKeyPair } from "./selection";
import { requireExportPassword, writeExportedFile } from "./write";

export async function exportPrivateKey(params?: CommandParams): Promise<void> {
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
  const format = str(params, "format") ?? "PKCS8";
  if (format !== "PKCS8") {
    fail("unsupportedType");
    return;
  }
  const path = str(params, "path");
  const password = requireExportPassword(params, PRIVATE_KEY_DIALOG);
  if (!path) {
    host.openDialog(PRIVATE_KEY_DIALOG);
    return;
  }
  if (password === undefined) {
    return;
  }
  writeExportedFile(path, encodePkcs8Pem(entry.pkcs8));
}
