/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "../App";
import { TEST_PASSWORD } from "../kernel";
import { loadFeatures } from "./loadFeatures";
import { resetRegistry, runCommand } from "./registry";
import { getActive, getState, host, resetSession } from "./session";

describe("builtin dialog clicks", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    loadFeatures();
  });

  afterEach(() => {
    cleanup();
  });

  it("saves from File → Save As via the Save and New Password buttons", async () => {
    render(<App />);
    await runCommand("newKeyStore", { type: "PKCS12" });
    expect(getActive()?.path).toBeUndefined();

    await runCommand("saveKeyStoreAs");
    expect(getState().dialog).toBe("dialog.file-save");
    fireEvent.change(screen.getByTestId("dialog.file-save.path"), {
      target: { value: "demo.p12" },
    });
    fireEvent.click(screen.getByTestId("dialog.file-save.ok"));

    await waitFor(() => {
      expect(getState().dialog).toBe("dialog.new-password");
    });
    fireEvent.change(screen.getByTestId("dialog.new-password.value"), {
      target: { value: TEST_PASSWORD },
    });
    fireEvent.change(screen.getByTestId("dialog.new-password.confirm"), {
      target: { value: TEST_PASSWORD },
    });
    fireEvent.click(screen.getByTestId("dialog.new-password.ok"));

    await waitFor(() => {
      expect(getState().dialog).toBeNull();
    });
    expect(getActive()?.path).toBe("demo.p12");
    expect(host.vfsHas("demo.p12")).toBe(true);
    expect(getActive()?.store.dirty).toBe(false);
  });

  it("cancels Examine File from the Open dialog Cancel button", async () => {
    render(<App />);
    await runCommand("examineFile");
    expect(getState().dialog).toBe("dialog.file-open");
    fireEvent.click(screen.getByTestId("dialog.file-open.cancel"));
    await waitFor(() => {
      expect(getState().dialog).toBeNull();
    });
    expect(getState().errorId).toBe("cancelled");
  });

  it("creates a PKCS#12 tab from the New KeyStore OK button", async () => {
    render(<App />);
    await runCommand("newKeyStore");
    expect(getState().dialog).toBe("dialog.new-keystore");
    fireEvent.click(screen.getByTestId("dialog.new-keystore.ok"));
    await waitFor(() => {
      expect(getState().dialog).toBeNull();
    });
    expect(getActive()?.store.type).toBe("PKCS12");
  });
});
