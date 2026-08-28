/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { resetRegistry, runCommand } from "../../shell/registry";
import { getState, resetSession } from "../../shell/session";
import { commands } from "./commands";
import { resetUpdateState, setFetchLatestVersion } from "./update";

describe("chrome dialogs", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    resetUpdateState();
    loadFeatures();
    setFetchLatestVersion(async () => "5.7.0");
  });

  afterEach(() => {
    cleanup();
    resetUpdateState();
  });

  it("labels About OK and Credits and keeps generateKeyPair off this command map", async () => {
    render(<App />);
    await runCommand("about");
    expect(screen.getByRole("dialog", { name: "About KeyStore Explorer" })).toBeTruthy();
    expect(screen.getByTestId("dialog.about.ok")).toHaveAccessibleName("OK");
    expect(screen.getByRole("button", { name: "Credits" })).toHaveAccessibleName("Credits");
    expect(Object.keys(commands)).not.toContain("generateKeyPair");
  });

  it("associates System Information fields with htmlFor labels", async () => {
    render(<App />);
    await runCommand("systemInformation");
    const hostname = screen.getByLabelText("Hostname:");
    expect(hostname).toHaveAttribute("id", "dialog.system-information.hostname");
    expect((hostname as HTMLInputElement).readOnly).toBe(true);
    expect(screen.getByLabelText("Operating System:")).toBeTruthy();
    expect(screen.getByTestId("dialog.system-information.ok")).toHaveAccessibleName("OK");
  });

  it("shows JAR column headers and a labelled OK close", async () => {
    render(<App />);
    await runCommand("jars");
    expect(screen.getByRole("columnheader", { name: "JAR File" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Implementation Vendor" })).toBeTruthy();
    expect(screen.getByText("pkijs")).toBeTruthy();
    expect(screen.getByTestId("dialog.jars.ok")).toHaveAccessibleName("OK");
  });

  it("dismisses About via the labelled OK without opening a store", async () => {
    render(<App />);
    await runCommand("about");
    fireEvent.click(screen.getByTestId("dialog.about.ok"));
    expect(getState().dialog).toBeNull();
    expect(getState().errorId).toBeUndefined();
    expect(getState().tabs).toEqual([]);
  });

  it("renders the injected check-update fixture in a status region", async () => {
    render(<App />);
    await runCommand("checkUpdate");
    expect(screen.getByRole("status").textContent).toContain("is the latest");
    expect(screen.getByTestId("dialog.check-update.ok")).toHaveAccessibleName("OK");
  });
});
