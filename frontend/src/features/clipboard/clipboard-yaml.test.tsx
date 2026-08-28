/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { hasCommand, resetRegistry } from "../../shell/registry";
import { resetSession } from "../../shell/session";
import { resetBuffer } from "./buffer";
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

  it("registers clipboard commands without generateKeyPair", () => {
    expect(hasCommand("copy")).toBe(true);
    expect(hasCommand("copyKeyPair")).toBe(true);
    expect(hasCommand("copyTrustedCertificate")).toBe(true);
    expect(hasCommand("cut")).toBe(true);
    expect(hasCommand("cutKeyPair")).toBe(true);
    expect(hasCommand("cutTrustedCertificate")).toBe(true);
    expect(hasCommand("paste")).toBe(true);
    expect(hasCommand("selectTab")).toBe(true);
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
