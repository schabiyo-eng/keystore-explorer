/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { resetRegistry, runCommand } from "../../shell/registry";
import { getState, resetSession } from "../../shell/session";
import { applyGiven, applyWhen } from "../../shell/yaml-driver";
import { VERIFY_CERTIFICATE_DIALOG, VIEW_SIGNED_JAR_DIALOG, VIEW_SIGNATURE_DIALOG } from "./dialog-ids";
import { resetVerifyState } from "./report";

const KEY_PAIR_STORE = [
  { appStarted: true },
  {
    openStores: [
      {
        id: "runtime-pkcs12-keypair",
        type: "PKCS12",
        password: "TEST_PASSWORD",
        dirty: false,
        entries: [{ alias: "keypair", entryType: "KEY_PAIR" }],
      },
    ],
  },
  { activeStore: "runtime-pkcs12-keypair" },
  { selection: ["keypair"] },
];

describe("verify-sig dialogs", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    resetVerifyState();
    loadFeatures();
  });

  afterEach(() => {
    cleanup();
    resetVerifyState();
  });

  it("opens Verify Certificate with labelled options and aria-labelled OK/Cancel", async () => {
    render(<App />);
    await applyGiven(KEY_PAIR_STORE);
    await runCommand("verifyCertificate");
    expect(getState().dialog).toBe(VERIFY_CERTIFICATE_DIALOG);
    expect(screen.getByRole("dialog", { name: "Verify Certificate" })).toBeTruthy();
    expect(screen.getByLabelText("CRL Distribution Point extension")).toBeChecked();
    expect(screen.getByLabelText("CRL file")).not.toBeChecked();
    expect(screen.getByLabelText("OCSP from Authority Information Access extension")).toBeTruthy();
    expect(screen.getByLabelText("OCSP with URL")).toBeTruthy();
    expect(
      screen.getByLabelText("Do not check revocation status, only verify certificate chain"),
    ).toBeTruthy();
    expect(
      screen.getByLabelText("Use an alternate CA keystore for validating the certificate:"),
    ).toBeTruthy();
    expect(screen.getByTestId(`${VERIFY_CERTIFICATE_DIALOG}.ok`)).toHaveAccessibleName("OK");
    expect(screen.getByTestId(`${VERIFY_CERTIFICATE_DIALOG}.cancel`)).toHaveAccessibleName("Cancel");
    expect(getState().tabs[0]?.store.dirty).toBe(false);
  });

  it("keeps the store clean when Cancel is clicked on Verify Certificate", async () => {
    render(<App />);
    await applyGiven(KEY_PAIR_STORE);
    await runCommand("verifyCertificate");
    fireEvent.click(screen.getByTestId(`${VERIFY_CERTIFICATE_DIALOG}.cancel`));
    await waitFor(() => {
      expect(getState().dialog).toBeNull();
    });
    expect(getState().errorId).toBe("cancelled");
    expect(getState().tabs[0]?.store.dirty).toBe(false);
  });

  it("labels JAR report status and entries after verifyJar", async () => {
    render(<App />);
    await applyGiven(KEY_PAIR_STORE);
    await applyWhen([
      { signJar: { path: "verify-sig/signed.jar", password: "TEST_PASSWORD" } },
      { verifyJar: { path: "verify-sig/signed.jar" } },
    ]);
    expect(getState().dialog).toBe(VIEW_SIGNED_JAR_DIALOG);
    expect(screen.getByRole("dialog", { name: "Signed JAR" })).toBeTruthy();
    expect(screen.getByLabelText("Status:")).toHaveValue("JAR verified");
    expect(screen.getByRole("table", { name: "JAR entries" })).toBeTruthy();
    expect(screen.getByTestId(`${VIEW_SIGNED_JAR_DIALOG}.ok`)).toHaveAccessibleName("OK");
    expect(getState().tabs[0]?.store.dirty).toBe(false);
  });

  it("labels signature report fields after verifySignature", async () => {
    render(<App />);
    await applyGiven(KEY_PAIR_STORE);
    await applyWhen([
      {
        signFile: {
          fixture: "unknown-txt",
          path: "verify-sig/file.p7s",
          password: "TEST_PASSWORD",
        },
      },
      { verifySignature: { signature: "verify-sig/file.p7s", content: "unknown-txt" } },
    ]);
    expect(getState().dialog).toBe(VIEW_SIGNATURE_DIALOG);
    expect(screen.getByRole("dialog", { name: "Signature Details" })).toBeTruthy();
    expect(screen.getByLabelText("Status:")).toHaveValue("Valid");
    expect(screen.getByLabelText("Subject:")).toBeTruthy();
    expect(screen.getByLabelText("Issuer:")).toBeTruthy();
    expect(screen.getByLabelText("Signature Algorithm:")).toBeTruthy();
    expect(screen.getByTestId(`${VIEW_SIGNATURE_DIALOG}.ok`)).toHaveAccessibleName("OK");
    expect(getState().tabs[0]?.store.dirty).toBe(false);
  });
});
