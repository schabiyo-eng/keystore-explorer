/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import App from "../App";
import { loadFeatures } from "./loadFeatures";
import { resetRegistry } from "./registry";
import { resetSession } from "./session";
import { applyGiven, applyThen, applyWhen, loadFileScenarios } from "./yaml-driver";

describe("file YAML flows", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    loadFeatures();
  });

  afterEach(() => {
    cleanup();
  });

  for (const scenario of loadFileScenarios()) {
    it(scenario.id, async () => {
      expect(scenario.slice).toBe("file");
      expect(scenario.requires).toEqual([]);
      render(<App />);
      await applyGiven(scenario.given);
      await applyWhen(scenario.when);
      await applyThen(scenario.then);
    });
  }
});
