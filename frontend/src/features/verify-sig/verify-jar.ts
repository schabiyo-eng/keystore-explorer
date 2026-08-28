import type { CommandParams } from "../../shell/types";
import { abortIfClosed } from "./abort";
import { verifyJarBytes } from "./crypto";
import { ERROR_DIALOG, VIEW_SIGNED_JAR_DIALOG } from "./dialog-ids";
import { readNamedBytes } from "./fixtures";
import { fail, showDialog } from "./outcome";
import { str } from "./params";
import { setReport, setVerifyResult } from "./report";
import { jarRows, jarStatus, payloadEntryNames } from "./status";
import { isTrusted } from "./trust";

export async function verifyJar(params?: CommandParams): Promise<void> {
  if (abortIfClosed(params)) {
    return;
  }
  const source = str(params, "path") ?? str(params, "fixture");
  if (!source) {
    return;
  }
  const bytes = readNamedBytes(source);
  if (!bytes) {
    setVerifyResult(undefined);
    fail("notFound", ERROR_DIALOG);
    return;
  }
  try {
    const verified = await verifyJarBytes(bytes);
    if (!verified) {
      setVerifyResult("invalid");
      fail("invalidFile", ERROR_DIALOG);
      return;
    }
    if (verified.incomplete) {
      setVerifyResult("incomplete");
      setReport({
        kind: "jar",
        result: "incomplete",
        status: "Not Verified",
        entries: jarRows(verified.entries, new Set()),
        signers: [],
      });
      showDialog(VIEW_SIGNED_JAR_DIALOG);
      return;
    }
    const result = verified.ok ? "valid" : "invalid";
    const trusted = isTrusted(verified.signerCerts);
    setVerifyResult(result);
    setReport({
      kind: "jar",
      result,
      status: jarStatus(verified.ok, trusted),
      entries: jarRows(verified.entries, payloadEntryNames(verified.entries)),
      signers: verified.signers,
    });
    if (!verified.ok) {
      fail("invalidFile", ERROR_DIALOG);
      return;
    }
    showDialog(VIEW_SIGNED_JAR_DIALOG);
  } catch {
    setVerifyResult("invalid");
    fail("invalidFile", ERROR_DIALOG);
  }
}
