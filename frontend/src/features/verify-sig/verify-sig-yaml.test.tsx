/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { hasCommand, resetRegistry } from "../../shell/registry";
import { resetSession } from "../../shell/session";
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
});
