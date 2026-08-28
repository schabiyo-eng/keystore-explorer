/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { resetRegistry } from "../../shell/registry";
import { resetSession } from "../../shell/session";
import { applyGiven, applyThen, applyWhen } from "../../shell/yaml-driver";
import { clearDraft } from "./draft";
import { foldCancel, loadGenerateScenarios } from "./yaml";

describe("generate YAML flows", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    clearDraft();
    loadFeatures();
  });

  afterEach(() => {
    cleanup();
    clearDraft();
  });

  for (const scenario of loadGenerateScenarios()) {
    it(scenario.id, async () => {
      expect(scenario.slice).toBe("generate");
      expect(scenario.requires).toEqual(["file"]);
      render(<App />);
      await applyGiven(scenario.given);
      await applyWhen(foldCancel(scenario.when));
      await applyThen(scenario.then);
    });
  }

  it("enables Tools → Generate Key Pair on an opened PKCS#12 via glob, not a shell edit", async () => {
    render(<App />);
    expect(screen.getByTestId("menu.tools.generate-key-pair")).toBeDisabled();
    await applyGiven([
      { appStarted: true },
      {
        openStores: [
          {
            id: "runtime-pkcs12",
            type: "PKCS12",
            password: "TEST_PASSWORD",
            dirty: false,
            path: "generate/runtime-pkcs12.p12",
          },
        ],
      },
      { activeStore: "runtime-pkcs12" },
    ]);
    expect(screen.getByTestId("menu.tools.generate-key-pair")).not.toBeDisabled();
    expect(screen.getByTestId("toolbar.generate-key-pair")).not.toBeDisabled();
    expect(screen.getByTestId("menu.tools.generate-secret-key")).not.toBeDisabled();
    expect(screen.getByTestId("menu.tools.generate-dh-parameters")).not.toBeDisabled();
    expect(screen.getByTestId("menu.tools.store-passphrase")).not.toBeDisabled();
  });
});
