import { host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { encodeCertificatesPem } from "./encode";
import { CERTIFICATES_DIALOG } from "./ids";
import { fail } from "./outcome";
import { cancelled, str } from "./params";
import { certEntries, certificatesOf, hasActiveStore } from "./selection";
import { writeExportedFile } from "./write";

export async function exportCertificate(params?: CommandParams): Promise<void> {
  if (!hasActiveStore()) {
    fail("storeNotWritable");
    return;
  }
  if (cancelled(params)) {
    fail("cancelled");
    return;
  }
  const entries = certEntries(str(params, "source"));
  if (entries.length === 0) {
    fail("emptySelection");
    return;
  }
  const path = str(params, "path");
  if (!path) {
    host.openDialog(CERTIFICATES_DIALOG);
    return;
  }
  const certs = entries.flatMap(certificatesOf);
  if (certs.length === 0) {
    fail("emptySelection");
    return;
  }
  writeExportedFile(path, encodeCertificatesPem(certs));
}
