/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { generateKeyPair, newKeyStore } from "../../kernel";
import { inspectCertificate } from "../details/inspect";
import { setDetailsView, CERTIFICATE_DIALOG } from "../details/view";
import { AppendCertificatePreview } from "./dialogs";

describe("chain dialogs", () => {
  it("renders details certificate fields for a chain preview", async () => {
    const created = await newKeyStore({ type: "PKCS12" });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const generated = await generateKeyPair(created.store, { algorithm: "RSA", alias: "keypair" });
    expect(generated.ok).toBe(true);
    if (!generated.ok) {
      return;
    }
    const der = generated.store.entries[0] && generated.store.entries[0].entryType === "KEY_PAIR"
      ? generated.store.entries[0].certificates[0]
      : undefined;
    expect(der).toBeDefined();
    if (!der) {
      return;
    }
    const cert = await inspectCertificate(der);
    setDetailsView({
      dialog: CERTIFICATE_DIALOG,
      title: "Certificate Details for Entry 'keypair'",
      certs: [cert],
    });
    render(<AppendCertificatePreview />);
    expect(screen.getByTestId("dialog.view-certificate")).toBeInTheDocument();
    expect(screen.getByLabelText("Subject:")).toHaveValue(cert.subject);
    expect(screen.getByLabelText("Issuer:")).toHaveValue(cert.issuer);
    expect(screen.getByLabelText("Fingerprint:")).toHaveValue(cert.fingerprint);
    setDetailsView(null);
  });
});
