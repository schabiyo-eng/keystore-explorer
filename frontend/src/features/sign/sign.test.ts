import { describe, expect, it } from "vitest";
import { generateKeyPair, isKeyPairEntry, newKeyStore } from "../../kernel";
import { generateCsrPem, signCsrToCertPem, signJwt } from "./crypto";

describe("sign crypto", () => {
  it("emits a PKCS#10 CSR from a kernel RSA key pair", async () => {
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
    const pem = await generateCsrPem(entry);
    expect(pem).toMatch(/BEGIN CERTIFICATE REQUEST/);
    const signed = await signCsrToCertPem(new TextEncoder().encode(pem), entry);
    expect(signed).toMatch(/BEGIN CERTIFICATE/);
    const jwt = await signJwt({ subject: "s", issuer: "i", audience: "a" }, entry);
    expect(jwt.split(".").length).toBe(3);
  });
});
