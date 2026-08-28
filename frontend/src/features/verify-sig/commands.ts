import { isKeyPairEntry, isTrustedCertEntry } from "../../kernel";
import { getActive, getSelection, getState, host } from "../../shell/session";
import type { CommandParams, CommandSpec } from "../../shell/types";
import { flag, str } from "../file/params";
import {
  certificatesOf,
  verifyCertificateDer,
  verifyCms,
  verifyJarBytes,
} from "./crypto";
import { readNamedBytes } from "./fixtures";
import { fail, showDialog, succeed } from "./outcome";
import {
  resetVerifyState,
  setReport,
  setVerifyResult,
  type JarEntryRow,
  type SignerRow,
} from "./report";

function selectedCertBytes(): Uint8Array | undefined {
  const active = getActive();
  const alias = getSelection()[0];
  if (!active || !alias) {
    return undefined;
  }
  const entry = active.store.entries.find((item) => item.alias === alias);
  if (!entry) {
    return undefined;
  }
  return certificatesOf(entry)[0];
}

export function canVerifyCertificate(): boolean {
  const active = getActive();
  const alias = getSelection()[0];
  if (!active || !alias) {
    return false;
  }
  const entry = active.store.entries.find((item) => item.alias === alias);
  return Boolean(entry && (isKeyPairEntry(entry) || isTrustedCertEntry(entry)));
}

function trustCerts(): Uint8Array[] {
  const certs: Uint8Array[] = [];
  for (const tab of getState().tabs) {
    for (const entry of tab.store.entries) {
      certs.push(...certificatesOf(entry));
    }
  }
  return certs;
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) {
      return false;
    }
  }
  return true;
}

function isTrusted(signerCerts: Uint8Array[]): boolean {
  const trusted = trustCerts();
  return signerCerts.some((signer) => trusted.some((cert) => sameBytes(signer, cert)));
}

function jarStatus(ok: boolean, trusted: boolean): string {
  if (!ok) {
    return "Invalid";
  }
  return trusted ? "JAR verified" : "JAR verified - certificate not trusted";
}

function signatureStatus(ok: boolean, trusted: boolean): string {
  if (!ok) {
    return "Invalid";
  }
  return trusted ? "Valid" : "Valid - Not Trusted";
}

function jarRows(
  entries: { name: string; data: Uint8Array }[],
  signedNames: Set<string>,
): JarEntryRow[] {
  const now = new Date().toUTCString();
  return entries.map((entry) => ({
    flags: signedNames.has(entry.name) || entry.name.toUpperCase().startsWith("META-INF/") ? "sm " : "  ",
    size: entry.data.length,
    date: now,
    name: entry.name,
  }));
}

function abort(params?: CommandParams): boolean {
  if (flag(params, "cancel") || flag(params, "confirm") === false) {
    resetVerifyState();
    fail("cancelled");
    return true;
  }
  if (flag(params, "dismiss")) {
    succeed();
    return true;
  }
  return false;
}

async function verifyCertificate(params?: CommandParams): Promise<void> {
  if (abort(params)) {
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
    host.openDialog("dialog.verify-certificate");
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
    fail("invalidFile", "dialog.error");
  } catch {
    setVerifyResult("invalid");
    fail("invalidFile", "dialog.error");
  }
}

async function verifyJar(params?: CommandParams): Promise<void> {
  if (abort(params)) {
    return;
  }
  const source = str(params, "path") ?? str(params, "fixture");
  if (!source) {
    return;
  }
  const bytes = readNamedBytes(source);
  if (!bytes) {
    setVerifyResult(undefined);
    fail("notFound", "dialog.error");
    return;
  }
  try {
    const verified = await verifyJarBytes(bytes);
    if (!verified) {
      setVerifyResult("invalid");
      fail("invalidFile", "dialog.error");
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
      showDialog("dialog.view-signed-jar");
      return;
    }
    const result = verified.ok ? "valid" : "invalid";
    const trusted = isTrusted(verified.signerCerts);
    setVerifyResult(result);
    setReport({
      kind: "jar",
      result,
      status: jarStatus(verified.ok, trusted),
      entries: jarRows(
        verified.entries,
        new Set(verified.entries.filter((entry) => !entry.name.toUpperCase().startsWith("META-INF/")).map((e) => e.name)),
      ),
      signers: verified.signers,
    });
    if (!verified.ok) {
      fail("invalidFile", "dialog.error");
      return;
    }
    showDialog("dialog.view-signed-jar");
  } catch {
    setVerifyResult("invalid");
    fail("invalidFile", "dialog.error");
  }
}

async function verifySignature(params?: CommandParams): Promise<void> {
  if (abort(params)) {
    return;
  }
  const signaturePath = str(params, "signature");
  if (!signaturePath) {
    return;
  }
  const signature = readNamedBytes(signaturePath);
  if (!signature) {
    setVerifyResult(undefined);
    fail("notFound", "dialog.error");
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
      signers: verified.signers.length
        ? verified.signers
        : ([
            {
              subject: "",
              issuer: "",
              version: "1",
              algorithm: "",
              signingTime: "",
            } satisfies SignerRow,
          ] as SignerRow[]),
    });
    if (!verified.ok) {
      fail("invalidFile", "dialog.error");
      return;
    }
    showDialog("dialog.view-signature");
  } catch {
    setVerifyResult("invalid");
    fail("invalidFile", "dialog.error");
  }
}

const spec = (run: (params?: CommandParams) => Promise<void>, canExecute?: () => boolean): CommandSpec =>
  canExecute ? { canExecute, run } : { run };

export const commands: Record<string, CommandSpec> = {
  verifyCertificate: spec(verifyCertificate, canVerifyCertificate),
  verifyJar: spec(verifyJar),
  verifySignature: spec(verifySignature),
};
