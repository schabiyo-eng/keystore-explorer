/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { resetRegistry } from "../../shell/registry";
import { resetSession } from "../../shell/session";
import { applyGiven, applyThen, applyWhen } from "../../shell/yaml-driver";
import { loadDetailsScenarios } from "./yaml";

describe("details YAML flows", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    loadFeatures();
  });

  afterEach(() => {
    cleanup();
  });

  for (const scenario of loadDetailsScenarios()) {
    it(scenario.id, async () => {
      expect(scenario.slice).toBe("details");
      expect(scenario.requires).toEqual(["file"]);
      render(<App />);
      await applyGiven(scenario.given);
      await applyWhen(scenario.when);
      await applyThen(scenario.then);
    });
  }
});
