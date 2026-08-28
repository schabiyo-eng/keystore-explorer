import type { CommandParams } from "../../shell/types";
import { abortIfClosed } from "./abort";
import { verifyCms } from "./crypto";
import { ERROR_DIALOG, VIEW_SIGNATURE_DIALOG } from "./dialog-ids";
import { readNamedBytes } from "./fixtures";
import { fail, showDialog } from "./outcome";
import { str } from "./params";
import { setReport, setVerifyResult, type SignerRow } from "./report";
import { signatureStatus } from "./status";
import { isTrusted } from "./trust";

const EMPTY_SIGNER: SignerRow = {
  subject: "",
  issuer: "",
  version: "1",
  algorithm: "",
  signingTime: "",
};

export async function verifySignature(params?: CommandParams): Promise<void> {
  if (abortIfClosed(params)) {
    return;
  }
  const signaturePath = str(params, "signature");
  if (!signaturePath) {
    return;
  }
  const signature = readNamedBytes(signaturePath);
  if (!signature) {
    setVerifyResult(undefined);
    fail("notFound", ERROR_DIALOG);
    return;
  }
  const contentPath = str(params, "content");
  const content = contentPath ? readNamedBytes(contentPath) : undefined;
  try {
    const verified = await verifyCms(signature, content);
    const result = verified.ok ? "valid" : "invalid";
    const trusted = isTrusted(verified.signerCerts);
    setVerifyResult(result);
    setReport({
      kind: "signature",
      result,
      status: signatureStatus(verified.ok, trusted),
      signers: verified.signers.length ? verified.signers : [EMPTY_SIGNER],
    });
    if (!verified.ok) {
      fail("invalidFile", ERROR_DIALOG);
      return;
    }
    showDialog(VIEW_SIGNATURE_DIALOG);
  } catch {
    setVerifyResult("invalid");
    fail("invalidFile", ERROR_DIALOG);
  }
}
