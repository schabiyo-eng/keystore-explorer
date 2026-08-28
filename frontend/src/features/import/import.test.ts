import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  TEST_PASSWORD,
  generateKeyPair,
  getEntryType,
  newKeyStore,
  reopenSucceeds,
  save,
} from "../../kernel";
import { importCaReplyIntoStore } from "./ca-reply";
import { importKeyPairIntoStore } from "./keypair";

const testdata = path.resolve(process.cwd(), "../kse/src/test/resources/testdata");

function fixture(rel: string): Uint8Array {
  return new Uint8Array(readFileSync(path.join(testdata, rel)));
}

describe("import kernel operations", () => {
  it("imports unencrypted RSA PKCS#8 as KEY_PAIR and round-trips PKCS#12", async () => {
    const created = await newKeyStore({ type: "PKCS12" });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const pkcs8 = fixture("CryptoFileUtilTest/rsa.unenc.pem.pkcs8");
    const imported = await importKeyPairIntoStore(created.store, {
      bytes: pkcs8,
      alias: "imported-rsa",
    });
    expect(imported.ok).toBe(true);
    if (!imported.ok) {
      return;
    }
    expect(getEntryType(imported.store, "imported-rsa")).toBe("KEY_PAIR");
    expect(imported.facts.dirty).toBe(true);

    const saved = await save(imported.store, TEST_PASSWORD);
    expect(saved.ok).toBe(true);
    if (!saved.ok) {
      return;
    }
    expect(saved.reopenSucceeds).toBe(true);
    expect(await reopenSucceeds(saved.bytes, TEST_PASSWORD)).toBe(true);
  });

  it("rejects duplicate alias on key-pair import", async () => {
    const created = await newKeyStore({ type: "PKCS12" });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const pkcs8 = fixture("CryptoFileUtilTest/rsa.unenc.pem.pkcs8");
    const first = await importKeyPairIntoStore(created.store, {
      bytes: pkcs8,
      alias: "imported-rsa",
    });
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    const again = await importKeyPairIntoStore(first.store, {
      bytes: pkcs8,
      alias: "imported-rsa",
    });
    expect(again.ok).toBe(false);
    if (again.ok) {
      return;
    }
    expect(again.errorId).toBe("duplicateAlias");
  });

  it("imports a matching CA reply onto a generated KEY_PAIR", async () => {
    const created = await newKeyStore({ type: "PKCS12" });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const generated = await generateKeyPair(created.store, {
      algorithm: "RSA",
      alias: "keypair",
    });
    expect(generated.ok).toBe(true);
    if (!generated.ok) {
      return;
    }
    const leaf = generated.store.entries[0];
    expect(leaf?.entryType).toBe("KEY_PAIR");
    if (leaf?.entryType !== "KEY_PAIR") {
      return;
    }
    const replied = importCaReplyIntoStore(generated.store, "keypair", leaf.certificates[0]!);
    expect(replied.ok).toBe(true);
    if (!replied.ok) {
      return;
    }
    expect(getEntryType(replied.store, "keypair")).toBe("KEY_PAIR");
    expect(replied.facts.dirty).toBe(true);
  });

  it("rejects unknown.txt as an invalid CA reply", async () => {
    const created = await newKeyStore({ type: "PKCS12" });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const generated = await generateKeyPair(created.store, {
      algorithm: "RSA",
      alias: "keypair",
    });
    expect(generated.ok).toBe(true);
    if (!generated.ok) {
      return;
    }
    const result = importCaReplyIntoStore(
      generated.store,
      "keypair",
      fixture("CryptoFileUtilTest/unknown.txt"),
    );
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.errorId).toBe("invalidFile");
  });
});
