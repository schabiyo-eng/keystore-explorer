import { useState } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import { getDetailsView } from "./view";
import type { CertDetails, KeyDetails } from "./inspect";
import "./details.css";

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input readOnly value={value} />
    </label>
  );
}

function EncodedField({ value }: { value: string }) {
  return (
    <label className="field">
      <span>Encoded:</span>
      <textarea readOnly rows={6} value={value} spellCheck={false} />
    </label>
  );
}

function OkButton({ testId }: { testId: string }) {
  return (
    <button type="button" data-testid={testId} onClick={() => void runCommand("openDetails", { dismiss: true })}>
      OK
    </button>
  );
}

function KeyFields({ keyDetails }: { keyDetails: KeyDetails }) {
  return (
    <div className="details-form">
      <ReadField label="Algorithm:" value={keyDetails.algorithm} />
      <ReadField label="Key Size:" value={keyDetails.keySize} />
      <ReadField label="Format:" value={keyDetails.format} />
      <EncodedField value={keyDetails.encoded} />
    </div>
  );
}

function CertificateFields({ cert }: { cert: CertDetails }) {
  return (
    <>
      <ReadField label="Version:" value={cert.version} />
      <ReadField label="Subject:" value={cert.subject} />
      <ReadField label="Issuer:" value={cert.issuer} />
      <ReadField label="Serial Number (hex.):" value={cert.serialHex} />
      <ReadField label="Serial Number (dec.):" value={cert.serialDec} />
      <ReadField label="Valid From:" value={cert.validFrom} />
      <ReadField label="Valid Until:" value={cert.validUntil} />
      <ReadField label="Public Key:" value={cert.publicKey} />
      <ReadField label="Signature Algorithm:" value={cert.signatureAlgorithm} />
      <ReadField label="Fingerprint:" value={cert.fingerprint} />
    </>
  );
}

export function ViewCertificateDialog() {
  const view = getDetailsView();
  const certs = view?.dialog === "dialog.view-certificate" ? view.certs : [];
  const title = view?.dialog === "dialog.view-certificate" ? view.title : "Certificate Details";
  const [index, setIndex] = useState(0);
  const cert = certs[Math.min(index, Math.max(certs.length - 1, 0))];

  return (
    <FrameDialog
      id="dialog.view-certificate"
      title={title}
      open
      actions={<OkButton testId="dialog.view-certificate.ok" />}
    >
      <div className="details-form">
        <span className="details-label">Certificate Hierarchy:</span>
        <div className="details-hierarchy" role="listbox" aria-label="Certificate Hierarchy">
          {certs.map((item, i) => (
            <button
              key={`${item.serialHex}-${i}`}
              type="button"
              role="option"
              aria-selected={i === index}
              onClick={() => setIndex(i)}
            >
              {item.subject || `Certificate ${i + 1}`}
            </button>
          ))}
        </div>
        {cert ? <CertificateFields cert={cert} /> : <p>No certificates.</p>}
      </div>
    </FrameDialog>
  );
}

export function ViewPrivateKeyDialog() {
  const view = getDetailsView();
  const key = view?.dialog === "dialog.view-private-key" ? view.key : undefined;
  const title = view?.dialog === "dialog.view-private-key" ? view.title : "Private Key Details";
  return (
    <FrameDialog
      id="dialog.view-private-key"
      title={title}
      open
      actions={<OkButton testId="dialog.view-private-key.ok" />}
    >
      {key ? <KeyFields keyDetails={key} /> : null}
    </FrameDialog>
  );
}

export function ViewPublicKeyDialog() {
  const view = getDetailsView();
  const key = view?.dialog === "dialog.view-public-key" ? view.key : undefined;
  const title = view?.dialog === "dialog.view-public-key" ? view.title : "Public Key Details";
  return (
    <FrameDialog
      id="dialog.view-public-key"
      title={title}
      open
      actions={<OkButton testId="dialog.view-public-key.ok" />}
    >
      {key ? <KeyFields keyDetails={key} /> : null}
    </FrameDialog>
  );
}

export function ViewSecretKeyDialog() {
  const view = getDetailsView();
  const key = view?.dialog === "dialog.view-secret-key" ? view.key : undefined;
  const title = view?.dialog === "dialog.view-secret-key" ? view.title : "Secret Key Details";
  return (
    <FrameDialog
      id="dialog.view-secret-key"
      title={title}
      open
      actions={<OkButton testId="dialog.view-secret-key.ok" />}
    >
      {key ? <KeyFields keyDetails={key} /> : null}
    </FrameDialog>
  );
}
