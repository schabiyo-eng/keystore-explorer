/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { hasCommand, resetRegistry } from "../../shell/registry";
import { resetSession } from "../../shell/session";
import { applyGiven } from "../../shell/yaml-driver";
import { resetSignState } from "./clipboard";
import { commands } from "./commands";
import { applySignThen, applySignWhen, loadSignScenarios } from "./yaml";

const SIGN_COMMANDS = [
  "signCsr",
  "signFile",
  "signJar",
  "signJwt",
  "signCrl",
  "signMidlet",
  "signNewKeyPair",
  "generateCsr",
] as const;

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

  it("registers sign commands without owning generateKeyPair", () => {
    for (const name of SIGN_COMMANDS) {
      expect(hasCommand(name)).toBe(true);
      expect(name in commands).toBe(true);
    }
    expect("generateKeyPair" in commands).toBe(false);
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
