/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { resetRegistry, runCommand } from "../../shell/registry";
import { getState, resetSession } from "../../shell/session";
import { commands, resetExamineState } from "./commands";
import {
  DETECT_FILE_TYPE_DIALOG,
  EXAMINE_SSL_DIALOG,
  EXAMINE_SSL_HOST,
  VIEW_CERTIFICATE_DIALOG,
  VIEW_JWT_DIALOG,
} from "./dialog-ids";
import { seedNamedFixtures } from "./yaml";

describe("examine dialogs", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    resetExamineState();
    loadFeatures();
    seedNamedFixtures();
  });

  afterEach(() => {
    cleanup();
  });

  it("labels certificate fields with htmlFor and does not own generateKeyPair", async () => {
    render(<App />);
    await runCommand("examineFile", { fixture: "cert-pem" });
    expect(getState().dialog).toBe(VIEW_CERTIFICATE_DIALOG);
    expect(screen.getByRole("dialog", { name: "Certificate Details" })).toBeTruthy();
    const subject = screen.getByLabelText("Subject:");
    expect(subject).toHaveAttribute("id", `${VIEW_CERTIFICATE_DIALOG}.subject`);
    expect((subject as HTMLInputElement).readOnly).toBe(true);
    expect(screen.getByLabelText("Issuer:")).toBeTruthy();
    expect(screen.getByLabelText("Serial Number:")).toBeTruthy();
    expect(screen.getByLabelText("Valid From:")).toBeTruthy();
    expect(screen.getByLabelText("Valid Until:")).toBeTruthy();
    expect(screen.getByTestId(`${VIEW_CERTIFICATE_DIALOG}.ok`)).toHaveAccessibleName("OK");
    expect(Object.hasOwn(commands, "generateKeyPair")).toBe(false);
  });

  it("dismisses the certificate report via labelled OK without opening a store", async () => {
    render(<App />);
    await runCommand("examineFile", { fixture: "cert-pem" });
    fireEvent.click(screen.getByTestId(`${VIEW_CERTIFICATE_DIALOG}.ok`));
    expect(getState().dialog).toBeNull();
    expect(getState().errorId).toBeUndefined();
    expect(getState().tabs).toEqual([]);
  });

  it("labels JWT header, payload, and signature textareas", async () => {
    render(<App />);
    await runCommand("setClipboard", { fixture: "jwt-sample" });
    await runCommand("examineClipboard");
    expect(getState().dialog).toBe(VIEW_JWT_DIALOG);
    expect(screen.getByRole("dialog", { name: "JSON Web Token Details" })).toBeTruthy();
    const header = screen.getByLabelText("Header:");
    expect(header).toHaveAttribute("id", `${VIEW_JWT_DIALOG}.header`);
    expect(screen.getByLabelText("Payload:")).toHaveAttribute("id", `${VIEW_JWT_DIALOG}.payload`);
    expect(screen.getByLabelText("Signature:")).toHaveAttribute("id", `${VIEW_JWT_DIALOG}.signature`);
    expect(screen.getByTestId(`${VIEW_JWT_DIALOG}.ok`)).toHaveAccessibleName("OK");
  });

  it("associates Examine SSL host and port with htmlFor and labelled OK/Cancel", async () => {
    render(<App />);
    await runCommand("examineSsl");
    expect(getState().dialog).toBe(EXAMINE_SSL_DIALOG);
    const hostField = screen.getByLabelText("SSL Host");
    expect(hostField).toHaveAttribute("id", EXAMINE_SSL_HOST);
    expect(hostField).toHaveAttribute("data-testid", EXAMINE_SSL_HOST);
    expect(screen.getByLabelText("SSL Port")).toHaveAttribute("data-testid", `${EXAMINE_SSL_DIALOG}.port`);
    expect(screen.getByTestId(`${EXAMINE_SSL_DIALOG}.ok`)).toHaveAccessibleName("OK");
    expect(screen.getByTestId(`${EXAMINE_SSL_DIALOG}.cancel`)).toHaveAccessibleName("Cancel");
  });

  it("shows detect-file-type with a labelled OK close", async () => {
    render(<App />);
    await runCommand("detectFileType", { fixture: "cert-base64" });
    expect(getState().dialog).toBe(DETECT_FILE_TYPE_DIALOG);
    expect(screen.getByRole("dialog", { name: "Cryptographic File Type" })).toBeTruthy();
    expect(screen.getByTestId(DETECT_FILE_TYPE_DIALOG).textContent).toMatch(/X\.509 Certificate/);
    expect(screen.getByTestId(`${DETECT_FILE_TYPE_DIALOG}.ok`)).toHaveAccessibleName("OK");
  });
});
