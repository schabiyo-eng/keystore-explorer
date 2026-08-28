/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { resetRegistry, runCommand } from "../../shell/registry";
import { getActive, getState, resetSession } from "../../shell/session";
import { applyGiven } from "../../shell/yaml-driver";
import { GenerateAliasDialog } from "./dialogs";
import { clearDraft, patchDraft } from "./draft";

const OPEN_STORE = [
  { appStarted: true },
  {
    openStores: [
      {
        id: "runtime-pkcs12",
        type: "PKCS12",
        password: "TEST_PASSWORD",
        dirty: false,
        path: "generate/runtime-pkcs12.p12",
      },
    ],
  },
  { activeStore: "runtime-pkcs12" },
];

describe("generate dialogs", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    clearDraft();
    loadFeatures();
  });

  afterEach(() => {
    cleanup();
    clearDraft();
  });

  it("opens Generate Key Pair with labelled type and size radios from control-ids", async () => {
    render(<App />);
    await applyGiven(OPEN_STORE);
    await runCommand("generateKeyPair");
    expect(getState().dialog).toBe("dialog.generate-key-pair");
    expect(screen.getByRole("dialog", { name: "Generate Key Pair" })).toBeTruthy();
    expect(screen.getByTestId("dialog.generate-key-pair.type.rsa")).toBeChecked();
    expect(screen.getByTestId("dialog.generate-key-pair.type.dsa")).toBeDisabled();
    expect(screen.getByTestId("dialog.generate-key-pair.type.ec")).toBeDisabled();
    expect(screen.getByTestId("dialog.generate-key-pair.size.2048")).toBeChecked();
    expect(screen.getByLabelText("Manual key size")).toBeTruthy();
    fireEvent.click(screen.getByTestId("dialog.generate-key-pair.ok"));
    expect(getState().dialog).toBe("dialog.generate-key-pair-cert");
    expect(screen.getByRole("dialog", { name: "Generate Key Pair Certificate" })).toBeTruthy();
  });

  it("puts generateKeyPair.alias and dialog.alias.value on the same labelled input", () => {
    patchDraft({ algorithm: "RSA", keySize: 2048, stage: "alias" });
    render(<GenerateAliasDialog />);
    const field = screen.getByTestId("dialog.alias.value");
    expect(field).toBe(document.getElementById("generateKeyPair.alias"));
    expect(screen.getByLabelText("Alias")).toBe(field);
    expect(screen.getByRole("dialog", { name: "New Key Pair Entry Alias" })).toBeTruthy();
  });

  it("opens Store Passphrase with a labelled passphrase field from control-ids", async () => {
    render(<App />);
    await applyGiven(OPEN_STORE);
    await runCommand("storePassphrase");
    expect(getState().dialog).toBe("dialog.store-passphrase");
    expect(screen.getByTestId("dialog.store-passphrase.value")).toHaveAccessibleName("Passphrase");
    expect(screen.getByLabelText("Alias")).toBeTruthy();
  });

  it("shows DH parameters PEM in the view dialog after choosing a size", async () => {
    render(<App />);
    await applyGiven(OPEN_STORE);
    await runCommand("generateDhParameters");
    expect(getState().dialog).toBe("dialog.generate-dh-parameters");
    fireEvent.click(screen.getByTestId("dialog.generate-dh-parameters.ok"));
    expect(getState().dialog).toBe("dialog.view-dh-parameters");
    expect(screen.getByLabelText("Parameters").textContent).toMatch(/BEGIN DH PARAMETERS/);
  });

  it("commits a key pair when the wizard is completed via commands", async () => {
    render(<App />);
    await applyGiven(OPEN_STORE);
    await runCommand("generateKeyPair", { algorithm: "RSA", keySize: 2048, alias: "from-ui" });
    const aliases = getActive()?.store.entries.map((entry) => entry.alias) ?? [];
    expect(aliases).toContain("from-ui");
    expect(getActive()?.store.dirty).toBe(true);
    expect(getState().dialog).toBeNull();
  });
});
