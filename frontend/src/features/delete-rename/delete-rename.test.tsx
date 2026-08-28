/** @vitest-environment jsdom */
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import App from "../../App";
import {
  generateKeyPair,
  importTrustedCertificate,
  putSecretKey,
  save,
  TEST_PASSWORD,
} from "../../kernel";
import { emptyStore } from "../../kernel/store";
import { isControlEnabled } from "../../shell/controls";
import { loadFeatures } from "../../shell/loadFeatures";
import { resetRegistry, runCommand } from "../../shell/registry";
import { getActive, getSelection, host, resetSession } from "../../shell/session";
import { deleteAliases, renameAlias } from "./kernel";

const CERT_PEM = path.resolve(
  process.cwd(),
  "../kse/src/test/resources/testdata/CryptoFileUtilTest/cert.pem.cer",
);

function assertOk<T extends { ok: boolean }>(result: T): asserts result is T & { ok: true } {
  expect(result.ok).toBe(true);
}

describe("delete-rename kernel ops", () => {
  it("deletes selected aliases and round-trips PKCS#12", async () => {
    let store = emptyStore(true);
    const pair = await generateKeyPair(store, { algorithm: "RSA", alias: "rsa-keypair" });
    assertOk(pair);
    store = pair.store;
    const key = await putSecretKey(store, { alias: "aes-key", secret: new Uint8Array([1, 2, 3]) });
    assertOk(key);
    store = key.store;

    const deleted = deleteAliases(store, ["rsa-keypair"]);
    assertOk(deleted);
    expect(deleted.store.entries.map((entry) => entry.alias)).toEqual(["aes-key"]);
    expect(deleted.store.dirty).toBe(true);
    expect(deleted.facts.aliases).toEqual(["aes-key"]);

    const saved = await save(deleted.store, TEST_PASSWORD);
    assertOk(saved);
    expect(saved.reopenSucceeds).toBe(true);
    expect(saved.facts.aliases).toEqual(["aes-key"]);
  });

  it("renames an entry and rejects duplicates", async () => {
    const cert = new Uint8Array(readFileSync(CERT_PEM));
    let store = emptyStore(true);
    const imported = await importTrustedCertificate(store, { bytes: cert, alias: "trusted-leaf" });
    assertOk(imported);
    store = imported.store;
    const other = await importTrustedCertificate(store, { bytes: cert, alias: "other-trusted" });
    assertOk(other);
    store = other.store;

    const renamed = renameAlias(store, "trusted-leaf", "renamed-trusted");
    assertOk(renamed);
    expect(renamed.store.entries.map((entry) => entry.alias).sort()).toEqual([
      "other-trusted",
      "renamed-trusted",
    ]);
    expect(renamed.store.dirty).toBe(true);

    const dup = renameAlias(store, "trusted-leaf", "other-trusted");
    expect(dup.ok).toBe(false);
    if (!dup.ok) {
      expect(dup.errorId).toBe("duplicateAlias");
    }

    const saved = await save(renamed.store, TEST_PASSWORD);
    assertOk(saved);
    expect(saved.reopenSucceeds).toBe(true);
    expect(saved.facts.aliases.sort()).toEqual(["other-trusted", "renamed-trusted"]);
  });
});

describe("delete-rename commands on the plugin host", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    loadFeatures();
  });

  afterEach(() => {
    cleanup();
  });

  it("enables context delete/rename without enabling import chrome", async () => {
    render(<App />);
    expect(screen.getByTestId("context.keypair.delete")).toBeDisabled();
    expect(screen.getByTestId("context.keypair.rename")).toBeDisabled();
    expect(screen.getByTestId("menu.tools.import-trusted-certificate")).toBeDisabled();
    expect(screen.getByTestId("toolbar.import-trusted-certificate")).toBeDisabled();

    const created = await generateKeyPair(emptyStore(false), {
      algorithm: "RSA",
      alias: "rsa-keypair",
    });
    assertOk(created);
    host.addTab({
      id: "runtime-pkcs12",
      name: "runtime-pkcs12",
      password: TEST_PASSWORD,
      store: created.store,
    });
    host.setSelection(["rsa-keypair"]);

    expect(isControlEnabled("context.keypair.delete")).toBe(true);
    expect(isControlEnabled("context.keypair.rename")).toBe(true);
    expect(isControlEnabled("menu.tools.import-trusted-certificate")).toBe(false);
    expect(isControlEnabled("toolbar.import-trusted-certificate")).toBe(false);
  });

  it("deletes from selection via confirm and leaves the store dirty", async () => {
    const created = await putSecretKey(emptyStore(false), {
      alias: "aes-key",
      secret: new Uint8Array([9, 9, 9]),
    });
    assertOk(created);
    host.addTab({
      id: "store",
      name: "store",
      password: TEST_PASSWORD,
      store: created.store,
    });
    host.setSelection(["aes-key"]);

    await runCommand("deleteEntry", { confirm: true });
    expect(getActive()?.store.entries).toEqual([]);
    expect(getActive()?.store.dirty).toBe(true);
    expect(getSelection()).toEqual([]);
  });
});
