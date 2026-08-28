/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { hasCommand, resetRegistry } from "../../shell/registry";
import { resetSession } from "../../shell/session";
import { resetBuffer } from "./buffer";
import { CLIPBOARD_COMMANDS, commands } from "./commands";
import { applyClipboardGiven, applyClipboardThen, applyClipboardWhen, loadClipboardScenarios } from "./yaml";

describe("clipboard YAML flows", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    resetBuffer();
    loadFeatures();
  });

  afterEach(() => {
    cleanup();
    resetBuffer();
  });

  it("this module's command map does not own generateKeyPair", () => {
    for (const name of CLIPBOARD_COMMANDS) {
      expect(hasCommand(name)).toBe(true);
      expect(Object.hasOwn(commands, name)).toBe(true);
    }
    expect(Object.hasOwn(commands, "generateKeyPair")).toBe(false);
  });

  for (const scenario of loadClipboardScenarios()) {
    it(scenario.id, async () => {
      expect(scenario.slice).toBe("clipboard");
      expect(scenario.requires).toEqual(["file", "delete-rename"]);
      render(<App />);
      await applyClipboardGiven(scenario.given);
      await applyClipboardWhen(scenario.when);
      await applyClipboardThen(scenario.then);
    });
  }
});
