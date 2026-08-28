import { describe, expect, it } from "vitest";
import { generateKeyPair, isKeyPairEntry, newKeyStore, TEST_PASSWORD, save, reopenSucceeds } from "../../kernel";
import { issueKeyPairCertificate } from "../sign/crypto";
import { inspectCertificate } from "../details/inspect";
import { appendCertificate, isSelfSignedCert, removeCertificate } from "./kernel";
import { foldCancel } from "./yaml";

describe("foldCancel", () => {
  it("turns a trailing cancel primitive into cancel: true on the command", () => {
    const folded = foldCancel([
      { appendToCertificateChain: { password: "TEST_PASSWORD" } },
      { cancel: {} },
    ]);
    expect(folded).toEqual([
      { appendToCertificateChain: { password: "TEST_PASSWORD", cancel: true } },
    ]);
  });
});

describe("chain kernel", () => {
  it("rejects remove when the chain is a single certificate", async () => {
    const created = await newKeyStore({ type: "PKCS12" });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const generated = await generateKeyPair(created.store, { algorithm: "RSA", alias: "keypair" });
    expect(generated.ok).toBe(true);
    if (!generated.ok) {
      return;
    }
    const result = removeCertificate(generated.store, "keypair");
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.errorId).toBe("chainTooShort");
  });

  it("rejects append onto a self-signed end entity", async () => {
    const created = await newKeyStore({ type: "PKCS12" });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const generated = await generateKeyPair(created.store, { algorithm: "RSA", alias: "keypair" });
    expect(generated.ok).toBe(true);
    if (!generated.ok) {
      return;
    }
    const entry = generated.store.entries[0];
    expect(entry && isKeyPairEntry(entry)).toBe(true);
    if (!entry || !isKeyPairEntry(entry)) {
      return;
    }
    expect(await isSelfSignedCert(entry.certificates[0]!)).toBe(true);
    const details = await inspectCertificate(entry.certificates[0]!);
    expect(details.subject).toBe(details.issuer);
    const result = await appendCertificate(generated.store, "keypair", entry.certificates[0]!);
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.errorId).toBe("selfSigned");
    expect(generated.store.dirty).toBe(true);
  });

  it("removes the last cert then appends the signer back and round-trips PKCS#12", async () => {
    const created = await newKeyStore({ type: "PKCS12" });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const caStore = await generateKeyPair(created.store, { algorithm: "RSA", alias: "ca" });
    expect(caStore.ok).toBe(true);
    if (!caStore.ok) {
      return;
    }
    const leafStore = await generateKeyPair(caStore.store, { algorithm: "RSA", alias: "leaf" });
    expect(leafStore.ok).toBe(true);
    if (!leafStore.ok) {
      return;
    }
    const ca = leafStore.store.entries.find((item) => item.alias === "ca");
    const leaf = leafStore.store.entries.find((item) => item.alias === "leaf");
    expect(ca && isKeyPairEntry(ca)).toBe(true);
    expect(leaf && isKeyPairEntry(leaf)).toBe(true);
    if (!ca || !isKeyPairEntry(ca) || !leaf || !isKeyPairEntry(leaf)) {
      return;
    }
    const issued = await issueKeyPairCertificate(leaf.certificates[0]!, ca);
    leaf.certificates = [issued, ca.certificates[0]!];
    expect(leaf.certificates.length).toBe(2);

    const removed = removeCertificate(leafStore.store, "leaf");
    expect(removed.ok).toBe(true);
    if (!removed.ok) {
      return;
    }
    const afterRemove = removed.store.entries.find((item) => item.alias === "leaf");
    expect(afterRemove && isKeyPairEntry(afterRemove) && afterRemove.certificates.length).toBe(1);
    expect(removed.store.dirty).toBe(true);

    const appended = await appendCertificate(removed.store, "leaf", ca.certificates[0]!);
    expect(appended.ok).toBe(true);
    if (!appended.ok) {
      return;
    }
    const afterAppend = appended.store.entries.find((item) => item.alias === "leaf");
    expect(afterAppend && isKeyPairEntry(afterAppend) && afterAppend.certificates.length).toBe(2);
    expect(appended.store.dirty).toBe(true);

    const saved = await save(appended.store, TEST_PASSWORD);
    expect(saved.ok).toBe(true);
    if (!saved.ok) {
      return;
    }
    expect(saved.reopenSucceeds).toBe(true);
    expect(await reopenSucceeds(saved.bytes, TEST_PASSWORD)).toBe(true);
  });
});
