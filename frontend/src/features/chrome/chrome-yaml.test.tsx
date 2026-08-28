/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { resetRegistry, runCommand } from "../../shell/registry";
import { resetSession } from "../../shell/session";
import { applyGiven, applyThen, applyWhen } from "../../shell/yaml-driver";
import { setFetchLatestVersion } from "./update";
import { foldCancel, loadChromeScenarios } from "./yaml";

const HELP_IDS = [
  "menu.help.about",
  "menu.help.jars",
  "menu.help.security-providers",
  "menu.help.system-information",
  "menu.help.check-update",
] as const;

describe("chrome YAML flows", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    loadFeatures();
    setFetchLatestVersion(async () => "5.7.0");
  });

  afterEach(() => {
    cleanup();
    setFetchLatestVersion();
  });

  it("enables Help chrome items with no store open via glob registration", () => {
    render(<App />);
    for (const id of HELP_IDS) {
      expect(screen.getByTestId(id), id).not.toBeDisabled();
    }
  });

  it("paints About controls from control-ids.md", async () => {
    render(<App />);
    await runCommand("about");
    expect(screen.getByTestId("dialog.about")).toBeTruthy();
    expect(screen.getByTestId("dialog.about.ok")).toBeTruthy();
    expect(screen.getByText("KeyStore Explorer")).toBeTruthy();
  });

  for (const scenario of loadChromeScenarios()) {
    it(scenario.id, async () => {
      expect(scenario.slice).toBe("chrome");
      expect(scenario.requires).toEqual(["file"]);
      if (scenario.id === "check-update-network-error") {
        setFetchLatestVersion(async () => {
          throw new Error("offline");
        });
      }
      render(<App />);
      await applyGiven(scenario.given);
      await applyWhen(foldCancel(scenario.when));
      await applyThen(scenario.then);
    });
  }
});
