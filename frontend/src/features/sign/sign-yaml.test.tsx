/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { hasCommand, resetRegistry } from "../../shell/registry";
import { resetSession } from "../../shell/session";
import { applyGiven } from "../../shell/yaml-driver";
import { resetSignState } from "./clipboard";
import { applySignThen, applySignWhen, loadSignScenarios } from "./yaml";

describe("sign YAML flows", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    resetSignState();
    loadFeatures();
  });

  afterEach(() => {
    cleanup();
  });

  it("registers sign commands without generateKeyPair", () => {
    expect(hasCommand("signCsr")).toBe(true);
    expect(hasCommand("signFile")).toBe(true);
    expect(hasCommand("signJar")).toBe(true);
    expect(hasCommand("signJwt")).toBe(true);
    expect(hasCommand("signCrl")).toBe(true);
    expect(hasCommand("signMidlet")).toBe(true);
    expect(hasCommand("signNewKeyPair")).toBe(true);
    expect(hasCommand("generateCsr")).toBe(true);
    expect(hasCommand("generateKeyPair")).toBe(false);
  });

  for (const scenario of loadSignScenarios()) {
    it(scenario.id, async () => {
      expect(scenario.slice).toBe("sign");
      expect(scenario.requires).toEqual(["file"]);
      render(<App />);
      await applyGiven(scenario.given);
      await applySignWhen(scenario.when);
      await applySignThen(scenario.then);
    });
  }
});
