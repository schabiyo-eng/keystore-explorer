import { host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { encodePublicKeyPem } from "./encode";
import { PUBLIC_KEY_DIALOG } from "./ids";
import { fail } from "./outcome";
import { cancelled, str } from "./params";
import { certificatesOf, hasActiveStore, publicKeyEntry } from "./selection";
import { writeExportedFile } from "./write";

export async function exportPublicKey(params?: CommandParams): Promise<void> {
  if (!hasActiveStore()) {
    fail("storeNotWritable");
    return;
  }
  if (cancelled(params)) {
    fail("cancelled");
    return;
  }
  const entry = publicKeyEntry(str(params, "source"));
  if (!entry) {
    fail("emptySelection");
    return;
  }
  const cert = certificatesOf(entry)[0];
  if (!cert) {
    fail("emptySelection");
    return;
  }
  const path = str(params, "path");
  if (!path) {
    host.openDialog(PUBLIC_KEY_DIALOG);
    return;
  }
  try {
    writeExportedFile(path, encodePublicKeyPem(cert));
  } catch {
    fail("invalidFile");
  }
}
