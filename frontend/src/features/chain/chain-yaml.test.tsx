/** @vitest-environment jsdom */
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { hasCommand, resetRegistry } from "../../shell/registry";
import { getState, host, resetSession } from "../../shell/session";
import { applyGiven, applyThen, applyWhen } from "../../shell/yaml-driver";
import { commands } from "./commands";
import { foldCancel, loadChainScenarios } from "./yaml";

const CERT_PEM = path.resolve(
  process.cwd(),
  "../kse/src/test/resources/testdata/CryptoFileUtilTest/cert.pem.cer",
);

describe("chain YAML flows", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    loadFeatures();
    host.vfsWrite("cert-pem", new Uint8Array(readFileSync(CERT_PEM)));
  });

  afterEach(() => {
    cleanup();
  });

  it("this module's command map does not own generateKeyPair", () => {
    expect(hasCommand("appendToCertificateChain")).toBe(true);
    expect(hasCommand("removeFromCertificateChain")).toBe(true);
    expect(Object.hasOwn(commands, "generateKeyPair")).toBe(false);
    expect(Object.keys(commands)).not.toContain("generateKeyPair");
  });

  for (const scenario of loadChainScenarios()) {
    it(scenario.id, async () => {
      expect(scenario.slice).toBe("chain");
      expect(scenario.requires).toEqual(["file", "details"]);
      render(<App />);
      await applyGiven(scenario.given);
      await applyWhen(foldCancel(scenario.when));
      await applyThen(scenario.then);
    });
  }

  it("enables Edit Certificate Chain via glob, not a shell edit", async () => {
    expect(hasCommand("appendToCertificateChain")).toBe(true);
    expect(hasCommand("removeFromCertificateChain")).toBe(true);
    render(<App />);
    expect(screen.getByTestId("context.keypair.edit-chain.append")).toBeDisabled();
    expect(screen.getByTestId("context.keypair.edit-chain.remove")).toBeDisabled();
    await applyGiven([
      { appStarted: true },
      {
        openStores: [
          {
            id: "runtime-pkcs12-keypair",
            type: "PKCS12",
            password: "TEST_PASSWORD",
            dirty: false,
            path: "chain/runtime-pkcs12-keypair.p12",
            entries: [{ alias: "keypair", entryType: "KEY_PAIR" }],
          },
        ],
      },
      { activeStore: "runtime-pkcs12-keypair" },
      { selection: ["keypair"] },
    ]);
    expect(screen.getByTestId("context.keypair.edit-chain.append")).not.toBeDisabled();
    expect(screen.getByTestId("context.keypair.edit-chain.remove")).not.toBeDisabled();
  });

  it("prompts for the entry password from a UI click and does not dirty the store", async () => {
    render(<App />);
    await applyGiven([
      { appStarted: true },
      {
        openStores: [
          {
            id: "runtime-pkcs12-keypair",
            type: "PKCS12",
            password: "TEST_PASSWORD",
            dirty: false,
            path: "chain/runtime-pkcs12-keypair.p12",
            entries: [{ alias: "keypair", entryType: "KEY_PAIR" }],
          },
        ],
      },
      { activeStore: "runtime-pkcs12-keypair" },
      { selection: ["keypair"] },
    ]);
    fireEvent.click(screen.getByTestId("context.keypair.edit-chain.append"));
    await waitFor(() => {
      expect(getState().dialog).toBe("dialog.password");
    });
    expect(getState().tabs[0]?.store.dirty).toBe(false);
  });
});
