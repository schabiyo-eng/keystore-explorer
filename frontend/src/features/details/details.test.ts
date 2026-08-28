import { beforeEach, describe, expect, it } from "vitest";
import { generateKeyPair, putSecretKey } from "../../kernel";
import { emptyStore } from "../../kernel/store";
import { host, isLocked, resetSession } from "../../shell/session";
import { resetRegistry } from "../../shell/registry";
import { loadFeatures } from "../../shell/loadFeatures";
import { runCommand } from "../../shell/registry";
import { inspectCertificate, inspectPrivateKey, inspectSecretKey } from "./inspect";
import { canOpenDetails } from "./commands";
import { getDetailsView } from "./view";

describe("details inspect and commands", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    loadFeatures();
  });

  it("canOpenDetails is false without a selection", () => {
    expect(canOpenDetails()).toBe(false);
    host.addTab({ id: "store", name: "store", password: "password", store: emptyStore(true) });
    expect(canOpenDetails()).toBe(false);
    host.setSelection(["missing"]);
    expect(canOpenDetails()).toBe(true);
  });

  it("reads RSA certificate and PKCS#8 fields from a generated key pair", async () => {
    const created = await generateKeyPair(emptyStore(true), {
      algorithm: "RSA",
      alias: "rsa-keypair",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const entry = created.store.entries[0];
    expect(entry?.entryType).toBe("KEY_PAIR");
    if (!entry || entry.entryType !== "KEY_PAIR") {
      return;
    }
    const cert = await inspectCertificate(entry.certificates[0]!);
    expect(cert.subject).toContain("CN=rsa-keypair");
    expect(cert.publicKey).toContain("RSA");
    expect(cert.publicKey).toContain("2048");
    expect(cert.fingerprint).toMatch(/^[0-9A-F:]+$/);
    const key = inspectPrivateKey(entry.pkcs8);
    expect(key.format).toBe("PKCS#8");
    expect(key.algorithm).toBe("RSA");
    expect(key.keySize).toBe("2048 bits");
  });

  it("shows secret-key details after the store password and leaves the store unchanged", async () => {
    const seeded = await putSecretKey(emptyStore(true), {
      alias: "aes-key",
      secret: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
    });
    expect(seeded.ok).toBe(true);
    if (!seeded.ok) {
      return;
    }
    host.addTab({
      id: "store",
      name: "store",
      password: "password",
      store: seeded.store,
      unlocked: [],
    });
    host.setSelection(["aes-key"]);
    expect(isLocked("aes-key")).toBe(true);

    await runCommand("openDetails", { kind: "key", password: "password" });
    expect(host.getState().dialog).toBe("dialog.view-secret-key");
    expect(host.getState().errorId).toBeUndefined();
    expect(isLocked("aes-key")).toBe(false);
    expect(host.getState().tabs[0]?.store.dirty).toBe(true);
    expect(getDetailsView()?.dialog).toBe("dialog.view-secret-key");
    expect(inspectSecretKey(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])).keySize).toBe("64 bits");
  });
});
