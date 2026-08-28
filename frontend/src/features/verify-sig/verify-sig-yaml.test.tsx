/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { hasCommand, resetRegistry } from "../../shell/registry";
import { getState, resetSession } from "../../shell/session";
import { applyGiven, applyWhen } from "../../shell/yaml-driver";
import { commands } from "./commands";
import { resetVerifyState } from "./report";
import { applyVerifyThen, foldCancel, loadVerifySigScenarios } from "./yaml";

describe("verify-sig YAML flows", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    resetVerifyState();
    loadFeatures();
  });

  afterEach(() => {
    cleanup();
    resetVerifyState();
  });

  it("registers verify commands and does not own generateKeyPair", () => {
    expect(hasCommand("verifyCertificate")).toBe(true);
    expect(hasCommand("verifyJar")).toBe(true);
    expect(hasCommand("verifySignature")).toBe(true);
    expect(Object.keys(commands)).not.toContain("generateKeyPair");
  });

  for (const scenario of loadVerifySigScenarios()) {
    it(scenario.id, async () => {
      expect(scenario.slice).toBe("verify-sig");
      expect(scenario.requires).toEqual(["file"]);
      render(<App />);
      await applyGiven(scenario.given);
      await applyWhen(foldCancel(scenario.when));
      await applyVerifyThen(scenario.then);
    });
  }

  it("enables Tools → Verify JAR / Verify Signature via glob, not a shell edit", async () => {
    render(<App />);
    expect(screen.getByTestId("menu.tools.verify-jar")).toBeDisabled();
    expect(screen.getByTestId("menu.tools.verify-signature")).toBeDisabled();
    await applyGiven([
      { appStarted: true },
      {
        openStores: [
          {
            id: "runtime-pkcs12",
            type: "PKCS12",
            password: "TEST_PASSWORD",
            dirty: false,
            path: "verify-sig/runtime-pkcs12.p12",
          },
        ],
      },
      { activeStore: "runtime-pkcs12" },
    ]);
    expect(screen.getByTestId("menu.tools.verify-jar")).not.toBeDisabled();
    expect(screen.getByTestId("menu.tools.verify-signature")).not.toBeDisabled();
    expect(screen.getByTestId("toolbar.verify-jar")).not.toBeDisabled();
    expect(screen.getByTestId("toolbar.verify-signature")).not.toBeDisabled();
  });

  it("opens verify-certificate options from a UI click and does not dirty the store", async () => {
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
            entries: [{ alias: "keypair", entryType: "KEY_PAIR" }],
          },
        ],
      },
      { activeStore: "runtime-pkcs12-keypair" },
      { selection: ["keypair"] },
    ]);
    expect(screen.getByTestId("context.keypair.verify-certificate")).not.toBeDisabled();
    fireEvent.click(screen.getByTestId("context.keypair.verify-certificate"));
    await waitFor(() => {
      expect(getState().dialog).toBe("dialog.verify-certificate");
    });
    expect(screen.getByTestId("dialog.verify-certificate")).toBeTruthy();
    expect(screen.getByTestId("dialog.verify-certificate.ok")).toHaveAccessibleName("OK");
    expect(screen.getByTestId("dialog.verify-certificate.cancel")).toHaveAccessibleName("Cancel");
    expect(getState().tabs[0]?.store.dirty).toBe(false);
  });
});
