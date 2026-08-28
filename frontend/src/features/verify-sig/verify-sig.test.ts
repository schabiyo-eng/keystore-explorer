import { beforeEach, describe, expect, it } from "vitest";
import { generateKeyPair, isKeyPairEntry, newKeyStore } from "../../kernel";
import { emptyStore } from "../../kernel/store";
import { loadFeatures } from "../../shell/loadFeatures";
import { resetRegistry } from "../../shell/registry";
import { getState, host, resetSession } from "../../shell/session";
import { signCms, signJarBytes } from "../sign/crypto";
import { abortIfClosed } from "./abort";
import { commands, canVerifyCertificate } from "./commands";
import { verifyCertificateDer, verifyCms, verifyJarBytes } from "./crypto";
import { jarStatus, signatureStatus } from "./status";
import { sameBytes } from "./trust";
import { foldCancel } from "./yaml";
import { parseZip } from "./zip";

describe("foldCancel", () => {
  it("turns a trailing cancel primitive into cancel: true on the command", () => {
    expect(foldCancel([{ verifyCertificate: {} }, { cancel: {} }])).toEqual([
      { verifyCertificate: { cancel: true } },
    ]);
  });

  it("leaves a single-step when unchanged", () => {
    const when = [{ verifyJar: { path: "verify-sig/signed.jar" } }];
    expect(foldCancel(when)).toEqual(when);
  });
});

describe("verify-sig command map", () => {
  it("does not own generateKeyPair", () => {
    expect(commands).not.toHaveProperty("generateKeyPair");
    expect(Object.keys(commands).sort()).toEqual(["verifyCertificate", "verifyJar", "verifySignature"]);
  });
});

describe("verify-sig selection and abort", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    loadFeatures();
  });

  it("canVerifyCertificate is false without a cert selection", () => {
    expect(canVerifyCertificate()).toBe(false);
    host.addTab({ id: "store", name: "store", password: "password", store: emptyStore(false) });
    expect(canVerifyCertificate()).toBe(false);
    host.setSelection(["missing"]);
    expect(canVerifyCertificate()).toBe(false);
  });

  it("canVerifyCertificate is true for a selected key pair", async () => {
    const created = await newKeyStore({ type: "PKCS12" });
    if (!created.ok) {
      throw new Error(created.errorId);
    }
    const generated = await generateKeyPair(created.store, { algorithm: "RSA", alias: "keypair" });
    if (!generated.ok) {
      throw new Error(generated.errorId);
    }
    host.addTab({
      id: "store",
      name: "store",
      password: "password",
      store: generated.store,
    });
    host.setSelection(["keypair"]);
    expect(canVerifyCertificate()).toBe(true);
  });

  it("abortIfClosed maps cancel and dismiss without touching the store", () => {
    host.addTab({ id: "store", name: "store", password: "password", store: emptyStore(false) });
    expect(abortIfClosed({ cancel: true })).toBe(true);
    expect(getState().errorId).toBe("cancelled");
    expect(getState().tabs[0]?.store.dirty).toBe(false);
    expect(abortIfClosed({ dismiss: true })).toBe(true);
    expect(getState().errorId).toBeUndefined();
    expect(abortIfClosed({})).toBe(false);
  });
});

describe("verify-sig status and trust helpers", () => {
  it("formats JAR and signature status the same way as the report dialogs", () => {
    expect(jarStatus(false, true)).toBe("Invalid");
    expect(jarStatus(true, true)).toBe("JAR verified");
    expect(jarStatus(true, false)).toBe("JAR verified - certificate not trusted");
    expect(signatureStatus(false, false)).toBe("Invalid");
    expect(signatureStatus(true, true)).toBe("Valid");
    expect(signatureStatus(true, false)).toBe("Valid - Not Trusted");
  });

  it("compares certificate bytes by length and content", () => {
    expect(sameBytes(new Uint8Array([1, 2]), new Uint8Array([1, 2]))).toBe(true);
    expect(sameBytes(new Uint8Array([1, 2]), new Uint8Array([1, 3]))).toBe(false);
    expect(sameBytes(new Uint8Array([1]), new Uint8Array([1, 2]))).toBe(false);
  });
});

describe("verify crypto", () => {
  it("accepts a kernel self-signed RSA certificate", async () => {
    const created = await newKeyStore({ type: "PKCS12" });
    if (!created.ok) {
      throw new Error(created.errorId);
    }
    const generated = await generateKeyPair(created.store, {
      algorithm: "RSA",
      alias: "keypair",
    });
    if (!generated.ok) {
      throw new Error(generated.errorId);
    }
    const entry = generated.store.entries[0];
    expect(entry && isKeyPairEntry(entry)).toBe(true);
    if (!entry || !isKeyPairEntry(entry)) {
      return;
    }
    expect(await verifyCertificateDer(entry.certificates[0]!)).toBe(true);
    const content = new TextEncoder().encode("payload");
    const cms = await signCms(content, entry);
    const verified = await verifyCms(cms, content);
    expect(verified.ok).toBe(true);
    expect(verified.signers[0]?.subject).toContain("keypair");
    const jar = await signJarBytes(entry);
    const zip = parseZip(jar);
    expect(zip?.some((item) => item.name.endsWith(".RSA"))).toBe(true);
    const jarResult = await verifyJarBytes(jar);
    expect(jarResult?.ok).toBe(true);
  });

  it("rejects non-ZIP bytes as a JAR", async () => {
    expect(await verifyJarBytes(new TextEncoder().encode("not a jar"))).toBeUndefined();
  });
});
