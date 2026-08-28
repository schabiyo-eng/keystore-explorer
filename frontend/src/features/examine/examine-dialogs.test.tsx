/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { resetRegistry, runCommand } from "../../shell/registry";
import { getState, host, resetSession } from "../../shell/session";
import { commands, resetExamineState } from "./commands";
import { ViewCertificateDialog, ViewCrlDialog, ViewCsrDialog, ViewJwtDialog } from "./dialogs";
import {
  DETECT_FILE_TYPE_DIALOG,
  ERROR_DIALOG,
  EXAMINE_SSL_DIALOG,
  EXAMINE_SSL_HOST,
  VIEW_CERTIFICATE_DIALOG,
  VIEW_CRL_DIALOG,
  VIEW_CSR_DIALOG,
  VIEW_JWT_DIALOG,
} from "./dialog-ids";
import { presentBytes } from "./present";
import { seedNamedFixtures } from "./yaml";

function fixtureBytes(id: string): Uint8Array {
  const bytes = host.vfsRead(id);
  expect(bytes).toBeDefined();
  return new Uint8Array(bytes ?? []);
}

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

  it("labels certificate fields with htmlFor and does not own generateKeyPair", () => {
    presentBytes(fixtureBytes("cert-pem"), ERROR_DIALOG);
    render(<ViewCertificateDialog />);
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

  it("dismisses the certificate report via labelled OK without opening a store", () => {
    presentBytes(fixtureBytes("cert-pem"), ERROR_DIALOG);
    render(<ViewCertificateDialog />);
    fireEvent.click(screen.getByTestId(`${VIEW_CERTIFICATE_DIALOG}.ok`));
    expect(getState().dialog).toBeNull();
    expect(getState().errorId).toBeUndefined();
    expect(getState().tabs).toEqual([]);
  });

  it("labels JWT header, payload, and signature textareas", () => {
    presentBytes(fixtureBytes("jwt-sample"), ERROR_DIALOG);
    render(<ViewJwtDialog />);
    expect(screen.getByRole("dialog", { name: "JSON Web Token Details" })).toBeTruthy();
    const header = screen.getByLabelText("Header:");
    expect(header).toHaveAttribute("id", `${VIEW_JWT_DIALOG}.header`);
    expect(screen.getByLabelText("Payload:")).toHaveAttribute("id", `${VIEW_JWT_DIALOG}.payload`);
    expect(screen.getByLabelText("Signature:")).toHaveAttribute("id", `${VIEW_JWT_DIALOG}.signature`);
    expect(screen.getByTestId(`${VIEW_JWT_DIALOG}.ok`)).toHaveAccessibleName("OK");
  });

  it("labels CSR format and subject fields", () => {
    presentBytes(fixtureBytes("csr-p10"), ERROR_DIALOG);
    render(<ViewCsrDialog />);
    expect(screen.getByRole("dialog", { name: "Certification Request Details" })).toBeTruthy();
    expect(screen.getByLabelText("Format:")).toHaveAttribute("id", `${VIEW_CSR_DIALOG}.format`);
    expect(screen.getByLabelText("Subject:")).toHaveAttribute("id", `${VIEW_CSR_DIALOG}.subject`);
    expect(screen.getByTestId(`${VIEW_CSR_DIALOG}.ok`)).toHaveAccessibleName("OK");
  });

  it("labels CRL issuer and this-update fields", () => {
    presentBytes(fixtureBytes("crl-pem"), ERROR_DIALOG);
    render(<ViewCrlDialog />);
    expect(screen.getByRole("dialog", { name: "CRL Details" })).toBeTruthy();
    expect(screen.getByLabelText("Issuer:")).toHaveAttribute("id", `${VIEW_CRL_DIALOG}.issuer`);
    expect(screen.getByLabelText("This Update:")).toHaveAttribute("id", `${VIEW_CRL_DIALOG}.this-update`);
    expect(screen.getByTestId(`${VIEW_CRL_DIALOG}.ok`)).toHaveAccessibleName("OK");
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
