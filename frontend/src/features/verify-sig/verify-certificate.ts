import { getActive, host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { abortIfClosed } from "./abort";
import { verifyCertificateDer } from "./crypto";
import { ERROR_DIALOG, VERIFY_CERTIFICATE_DIALOG } from "./dialog-ids";
import { fail, succeed } from "./outcome";
import { setReport, setVerifyResult } from "./report";
import { selectedCertBytes } from "./selection";

export async function verifyCertificate(params?: CommandParams): Promise<void> {
  if (abortIfClosed(params)) {
    return;
  }
  if (!getActive()) {
    fail("storeNotWritable");
    return;
  }
  const der = selectedCertBytes();
  if (!der) {
    fail("emptySelection");
    return;
  }
  if (params === undefined) {
    host.openDialog(VERIFY_CERTIFICATE_DIALOG);
    return;
  }
  try {
    const ok = await verifyCertificateDer(der);
    setVerifyResult(ok ? "valid" : "invalid");
    setReport(null);
    if (ok) {
      succeed();
      return;
    }
    fail("invalidFile", ERROR_DIALOG);
  } catch {
    setVerifyResult("invalid");
    fail("invalidFile", ERROR_DIALOG);
  }
}
