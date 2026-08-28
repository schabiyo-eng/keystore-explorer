import { describe, expect, it } from "vitest";
import { generateKeyPair, isKeyPairEntry, newKeyStore } from "../../kernel";
import { signCms, signJarBytes } from "../sign/crypto";
import { commands } from "./commands";
import { verifyCertificateDer, verifyCms, verifyJarBytes } from "./crypto";
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
