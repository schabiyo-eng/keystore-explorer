import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  TEST_PASSWORD,
  facts,
  generateKeyPair,
  getEntryType,
  importTrustedCertificate,
  load,
  newKeyStore,
  putSecretKey,
  reopenSucceeds,
  save,
} from "./index";

const WRONG_PASSWORD = "wrong";

const testdataCert = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../kse/src/test/resources/testdata/CryptoFileUtilTest/cert.pem.cer",
);

describe("PKCS#12 kernel", () => {
  it("does not ship a dummy store", () => {
    const dummy = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../dummy");
    expect(existsSync(dummy)).toBe(false);
  });

  it("creates an empty PKCS#12 that YAML oracles can read", async () => {
    const created = await newKeyStore({ type: "PKCS12" });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    expect(created.facts.type).toBe("PKCS12");
    expect(created.facts.aliases).toEqual([]);
    expect(created.facts.entryType).toEqual([]);
    expect(created.facts.dirty).toBe(true);
    expect(created.facts.errorId).toBeUndefined();
  });

  it("rejects non-PKCS#12 types", async () => {
    const created = await newKeyStore({ type: "JKS" });
    expect(created.ok).toBe(false);
    if (created.ok) {
      return;
    }
    expect(created.errorId).toBe("unsupportedType");
    expect(created.facts.errorId).toBe("unsupportedType");
  });

  it("round-trips an empty store with TEST_PASSWORD and reopenSucceeds", async () => {
    const created = await newKeyStore({ type: "PKCS12" });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const saved = await save(created.store, TEST_PASSWORD);
    expect(saved.ok).toBe(true);
    if (!saved.ok) {
      return;
    }
    expect(saved.bytes.byteLength).toBeGreaterThan(0);
    expect(saved.facts.dirty).toBe(false);
    expect(saved.reopenSucceeds).toBe(true);
    expect(await reopenSucceeds(saved.bytes, TEST_PASSWORD)).toBe(true);

    const loaded = await load(saved.bytes, TEST_PASSWORD);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }
    expect(loaded.facts.type).toBe("PKCS12");
    expect(loaded.facts.aliases).toEqual([]);
    expect(loaded.facts.dirty).toBe(false);
    expect(loaded.facts.errorId).toBeUndefined();
  });

  it("maps a real MAC failure to errorId wrongPassword", async () => {
    const created = await newKeyStore({ type: "PKCS12" });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const saved = await save(created.store, TEST_PASSWORD);
    expect(saved.ok).toBe(true);
    if (!saved.ok) {
      return;
    }

    const failed = await load(saved.bytes, WRONG_PASSWORD);
    expect(failed.ok).toBe(false);
    if (failed.ok) {
      return;
    }
    expect(failed.errorId).toBe("wrongPassword");
    expect(failed.facts.errorId).toBe("wrongPassword");
    expect(failed.facts.aliases).toEqual([]);
    expect(await reopenSucceeds(saved.bytes, WRONG_PASSWORD)).toBe(false);
  });

  it("rejects garbage bytes as invalidFile, not a canned password string", async () => {
    const failed = await load(new Uint8Array([1, 2, 3, 4, 5]), TEST_PASSWORD);
    expect(failed.ok).toBe(false);
    if (failed.ok) {
      return;
    }
    expect(failed.errorId).toBe("invalidFile");
    expect(failed.facts.errorId).toBe("invalidFile");
  });

  it("generates an RSA KEY_PAIR and round-trips it", async () => {
    const created = await newKeyStore({ type: "PKCS12" });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const generated = await generateKeyPair(created.store, {
      algorithm: "RSA",
      keySize: 2048,
      alias: "mykey",
    });
    expect(generated.ok).toBe(true);
    if (!generated.ok) {
      return;
    }
    expect(generated.facts.dirty).toBe(true);
    expect(generated.facts.aliases).toEqual(["mykey"]);
    expect(generated.facts.entryType).toContainEqual({
      alias: "mykey",
      type: "KEY_PAIR",
    });
    expect(getEntryType(generated.store, "mykey")).toBe("KEY_PAIR");

    const saved = await save(generated.store, TEST_PASSWORD);
    expect(saved.ok).toBe(true);
    if (!saved.ok) {
      return;
    }
    expect(saved.reopenSucceeds).toBe(true);

    const loaded = await load(saved.bytes, TEST_PASSWORD);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }
    expect(loaded.facts.aliases).toEqual(["mykey"]);
    expect(loaded.facts.entryType).toContainEqual({
      alias: "mykey",
      type: "KEY_PAIR",
    });
    expect(loaded.facts.dirty).toBe(false);
    expect(facts(loaded.store).type).toBe("PKCS12");
  });

  it("returns duplicateAlias when generate reuses an alias", async () => {
    const created = await newKeyStore({ type: "PKCS12" });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const generated = await generateKeyPair(created.store, {
      algorithm: "RSA",
      alias: "dup",
    });
    expect(generated.ok).toBe(true);
    if (!generated.ok) {
      return;
    }
    const again = await generateKeyPair(generated.store, {
      algorithm: "RSA",
      alias: "dup",
    });
    expect(again.ok).toBe(false);
    if (again.ok) {
      return;
    }
    expect(again.errorId).toBe("duplicateAlias");
    expect(again.facts.aliases).toEqual(["dup"]);
  });

  it("imports a testdata PEM as TRUSTED_CERT and round-trips it", async () => {
    const pem = new Uint8Array(readFileSync(testdataCert));
    const created = await newKeyStore({ type: "PKCS12" });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const imported = await importTrustedCertificate(created.store, {
      bytes: pem,
      alias: "gts-root",
    });
    expect(imported.ok).toBe(true);
    if (!imported.ok) {
      return;
    }
    expect(imported.facts.entryType).toContainEqual({
      alias: "gts-root",
      type: "TRUSTED_CERT",
    });

    const saved = await save(imported.store, TEST_PASSWORD);
    expect(saved.ok).toBe(true);
    if (!saved.ok) {
      return;
    }
    expect(saved.reopenSucceeds).toBe(true);

    const loaded = await load(saved.bytes, TEST_PASSWORD);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }
    expect(getEntryType(loaded.store, "gts-root")).toBe("TRUSTED_CERT");
  });

  it("stores a KEY secret bag and round-trips it", async () => {
    const created = await newKeyStore({ type: "PKCS12" });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const secret = new Uint8Array(32);
    crypto.getRandomValues(secret);

    const withKey = await putSecretKey(created.store, {
      alias: "passphrase",
      secret,
    });
    expect(withKey.ok).toBe(true);
    if (!withKey.ok) {
      return;
    }
    expect(withKey.facts.entryType).toContainEqual({
      alias: "passphrase",
      type: "KEY",
    });

    const saved = await save(withKey.store, TEST_PASSWORD);
    expect(saved.ok).toBe(true);
    if (!saved.ok) {
      return;
    }
    expect(saved.reopenSucceeds).toBe(true);

    const loaded = await load(saved.bytes, TEST_PASSWORD);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }
    expect(getEntryType(loaded.store, "passphrase")).toBe("KEY");
    expect(loaded.store.entries[0]?.secret).toEqual(secret);
  });
});
