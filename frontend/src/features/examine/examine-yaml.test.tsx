/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { resetRegistry, runCommand } from "../../shell/registry";
import { getState, resetSession } from "../../shell/session";
import { applyWhen } from "../../shell/yaml-driver";
import { commands, resetExamineState } from "./commands";
import { examinedType } from "./outcome";
import {
  applyExamineGiven,
  applyExamineThen,
  foldCancel,
  loadExamineScenarios,
  seedNamedFixtures,
} from "./yaml";

describe("examine YAML flows", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    resetExamineState();
    loadFeatures();
    seedNamedFixtures();
  });

  afterEach(() => {
    cleanup();
  });

  for (const scenario of loadExamineScenarios()) {
    it(scenario.id, async () => {
      expect(scenario.slice).toBe("examine");
      expect(scenario.requires).toEqual([]);
      render(<App />);
      await applyExamineGiven(scenario.given);
      await applyWhen(foldCancel(scenario.when));
      await applyExamineThen(scenario.then);
    });
  }

  it("enables Examine menu items via glob without an open store", async () => {
    render(<App />);
    expect(screen.getByTestId("menu.examine.file")).not.toBeDisabled();
    expect(screen.getByTestId("menu.examine.clipboard")).not.toBeDisabled();
    expect(screen.getByTestId("menu.examine.ssl")).not.toBeDisabled();
    expect(screen.getByTestId("menu.examine.detect-file-type")).not.toBeDisabled();
    expect(screen.getByTestId("toolbar.examine-file")).not.toBeDisabled();
    expect(screen.getByTestId("quickstart.examine-file")).not.toBeDisabled();
  });

  it("does not apply() or open a keystore when examining a certificate", async () => {
    render(<App />);
    await runCommand("examineFile", { fixture: "cert-pem" });
    expect(examinedType()).toBe("certificate");
    expect(getState().tabs).toHaveLength(0);
    expect(getState().dialog).toBe("dialog.view-certificate");
    expect(getState().errorId).toBeUndefined();
  });

  it("this module's command map does not own generateKeyPair", () => {
    expect(Object.hasOwn(commands, "generateKeyPair")).toBe(false);
  });
});
