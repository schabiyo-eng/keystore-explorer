/** @vitest-environment jsdom */
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import App from "../../App";
import { generateKeyPair, importTrustedCertificate, TEST_PASSWORD } from "../../kernel";
import { emptyStore } from "../../kernel/store";
import { isControlEnabled } from "../../shell/controls";
import { loadFeatures } from "../../shell/loadFeatures";
import { resetRegistry, runCommand } from "../../shell/registry";
import { getActive, host, resetSession } from "../../shell/session";
import {
  CERTIFICATES_DIALOG,
  CSV_DIALOG,
  KEY_PAIR_DIALOG,
  PRIVATE_KEY_DIALOG,
  PUBLIC_KEY_DIALOG,
} from "./ids";
import { canExportCertificate, canExportCsv, canExportKeyPair, canExportPublicKey } from "./selection";

function assertOk<T extends { ok: boolean }>(result: T): asserts result is T & { ok: true } {
  expect(result.ok).toBe(true);
}

describe("export commands on the plugin host", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    loadFeatures();
  });

  afterEach(() => {
    cleanup();
  });

  it("enables CSV without a selection and key-pair export only with a key pair", async () => {
    render(<App />);
    expect(screen.getByTestId("menu.tools.export-csv")).toBeDisabled();
    expect(isControlEnabled("context.keypair.export.key-pair")).toBe(false);

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

    expect(canExportCsv()).toBe(true);
    expect(canExportKeyPair()).toBe(false);
    expect(canExportCertificate()).toBe(false);
    expect(canExportPublicKey()).toBe(false);
    expect(isControlEnabled("menu.tools.export-csv")).toBe(true);
    expect(isControlEnabled("toolbar.export-csv")).toBe(true);

    host.setSelection(["rsa-keypair"]);
    expect(canExportKeyPair()).toBe(true);
    expect(canExportCertificate()).toBe(true);
    expect(canExportPublicKey()).toBe(true);
    expect(isControlEnabled("context.keypair.export.key-pair")).toBe(true);
    expect(isControlEnabled("context.keypair.export.private-key")).toBe(true);
    expect(isControlEnabled("context.keypair.export.public-key")).toBe(true);
  });

  it("writes CSV without dirtying the open store", async () => {
    const created = await generateKeyPair(emptyStore(false), {
      algorithm: "RSA",
      alias: "rsa-keypair",
    });
    assertOk(created);
    host.addTab({
      id: "store",
      name: "store",
      password: TEST_PASSWORD,
      store: created.store,
    });
    const dirtyBefore = getActive()?.store.dirty;
    await runCommand("exportCsv", { path: "export/store.csv" });
    expect(host.vfsHas("export/store.csv")).toBe(true);
    expect(getActive()?.store.dirty).toBe(dirtyBefore);
    expect(host.getState().dialog).toBeNull();
    expect(host.getState().errorId).toBeUndefined();
  });

  it("opens the CSV dialog when the path is omitted", async () => {
    render(<App />);
    host.addTab({
      id: "store",
      name: "store",
      password: TEST_PASSWORD,
      store: emptyStore(false),
    });
    await runCommand("exportCsv");
    expect(host.getState().dialog).toBe(CSV_DIALOG);
    expect(screen.getByTestId(CSV_DIALOG)).toBeVisible();
    expect(screen.getByTestId(`${CSV_DIALOG}.ok`)).toHaveAccessibleName("OK");
    expect(screen.getByTestId(`${CSV_DIALOG}.cancel`)).toHaveAccessibleName("Cancel");
    expect(screen.getByLabelText("Export File")).toBeVisible();
  });

  it("labels key-pair, certificate, private-key, and public-key dialogs", async () => {
    render(<App />);
    const created = await generateKeyPair(emptyStore(false), {
      algorithm: "RSA",
      alias: "rsa-keypair",
    });
    assertOk(created);
    host.addTab({
      id: "store",
      name: "store",
      password: TEST_PASSWORD,
      store: created.store,
    });
    host.setSelection(["rsa-keypair"]);

    await runCommand("exportKeyPair");
    expect(host.getState().dialog).toBe(KEY_PAIR_DIALOG);
    expect(screen.getByTestId(KEY_PAIR_DIALOG)).toBeVisible();
    expect(screen.getByTestId(`${KEY_PAIR_DIALOG}.ok`)).toHaveAccessibleName("OK");
    expect(screen.getByLabelText("Password for Output File")).toBeVisible();
    expect(screen.getByRole("radio", { name: "PKCS#12" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "PEM" })).toBeDisabled();

    await runCommand("exportCertificate");
    expect(host.getState().dialog).toBe(CERTIFICATES_DIALOG);
    expect(screen.getByTestId(CERTIFICATES_DIALOG)).toBeVisible();
    expect(screen.getByRole("radio", { name: "X.509" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "PKCS #7" })).toBeDisabled();

    await runCommand("exportPrivateKey");
    expect(host.getState().dialog).toBe(PRIVATE_KEY_DIALOG);
    expect(screen.getByTestId(PRIVATE_KEY_DIALOG)).toBeVisible();
    expect(screen.getByRole("radio", { name: "PKCS #8" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "PVK" })).toBeDisabled();

    await runCommand("exportPublicKey");
    expect(host.getState().dialog).toBe(PUBLIC_KEY_DIALOG);
    expect(screen.getByTestId(PUBLIC_KEY_DIALOG)).toBeVisible();
    expect(screen.getByRole("radio", { name: "OpenSSL, PEM encoded" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "JWK" })).toBeDisabled();
  });

  it("exports a trusted-certificate public key without dirtying the store", async () => {
    const certPem = path.resolve(
      process.cwd(),
      "../kse/src/test/resources/testdata/CryptoFileUtilTest/cert.pem.cer",
    );
    const imported = await importTrustedCertificate(emptyStore(false), {
      bytes: new Uint8Array(readFileSync(certPem)),
      alias: "trust",
    });
    assertOk(imported);
    host.addTab({
      id: "store",
      name: "store",
      password: TEST_PASSWORD,
      store: imported.store,
    });
    host.setSelection(["trust"]);
    const dirtyBefore = getActive()?.store.dirty;
    await runCommand("exportPublicKey", { path: "export/trust.pub", source: "trusted" });
    expect(host.vfsHas("export/trust.pub")).toBe(true);
    expect(getActive()?.store.dirty).toBe(dirtyBefore);
    const pem = new TextDecoder().decode(host.vfsRead("export/trust.pub"));
    expect(pem).toMatch(/^-----BEGIN PUBLIC KEY-----/);
  });
});
