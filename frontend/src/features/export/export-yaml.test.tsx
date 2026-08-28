/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { resetRegistry } from "../../shell/registry";
import { resetSession } from "../../shell/session";
import { applyGiven, applyThen, applyWhen } from "../../shell/yaml-driver";
import { foldCancel, loadExportScenarios } from "./yaml";

describe("export YAML flows", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    loadFeatures();
  });

  afterEach(() => {
    cleanup();
  });

  for (const scenario of loadExportScenarios()) {
    it(scenario.id, async () => {
      expect(scenario.slice).toBe("export");
      expect(scenario.requires).toEqual(["file"]);
      render(<App />);
      await applyGiven(scenario.given);
      await applyWhen(foldCancel(scenario.when));
      await applyThen(scenario.then);
    });
  }

  it("enables Tools → Export CSV via glob, not a shell edit", async () => {
    render(<App />);
    expect(screen.getByTestId("menu.tools.export-csv")).toBeDisabled();
    await applyGiven([
      { appStarted: true },
      {
        openStores: [
          {
            id: "runtime-pkcs12",
            type: "PKCS12",
            password: "TEST_PASSWORD",
            dirty: false,
            path: "export/runtime-pkcs12.p12",
          },
        ],
      },
      { activeStore: "runtime-pkcs12" },
    ]);
    expect(screen.getByTestId("menu.tools.export-csv")).not.toBeDisabled();
    expect(screen.getByTestId("toolbar.export-csv")).not.toBeDisabled();
    expect(screen.getByTestId("context.tab.export-csv")).not.toBeDisabled();
    expect(screen.getByTestId("context.keystore.export-csv")).not.toBeDisabled();
    expect(screen.getByTestId("menu.tools.generate-key-pair")).toBeDisabled();
  });
});
