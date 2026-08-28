import { useState } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import { CertificateFields, KeyFields } from "./fields";
import { useDetailsView } from "./useDetailsView";
import {
  CERTIFICATE_DIALOG,
  PRIVATE_KEY_DIALOG,
  PUBLIC_KEY_DIALOG,
  SECRET_KEY_DIALOG,
  type KeyDialogId,
} from "./view";
import "./details.css";

function OkButton({ testId }: { testId: string }) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label="OK"
      onClick={() => void runCommand("openDetails", { dismiss: true })}
    >
      OK
    </button>
  );
}

function ViewKeyDialog({ id, fallbackTitle }: { id: KeyDialogId; fallbackTitle: string }) {
  const view = useDetailsView();
  const match = view?.dialog === id ? view : undefined;
  return (
    <FrameDialog
      id={id}
      title={match?.title ?? fallbackTitle}
      open
      actions={<OkButton testId={`${id}.ok`} />}
    >
      {match ? <KeyFields prefix={id} keyDetails={match.key} /> : null}
    </FrameDialog>
  );
}

export function ViewCertificateDialog() {
  const view = useDetailsView();
  const certs = view?.dialog === CERTIFICATE_DIALOG ? view.certs : [];
  const title = view?.dialog === CERTIFICATE_DIALOG ? view.title : "Certificate Details";
  const [index, setIndex] = useState(0);
  const selected = Math.min(index, Math.max(certs.length - 1, 0));
  const cert = certs[selected];
  const hierarchyLabelId = `${CERTIFICATE_DIALOG}.hierarchy-label`;

  return (
    <FrameDialog
      id={CERTIFICATE_DIALOG}
      title={title}
      open
      actions={<OkButton testId={`${CERTIFICATE_DIALOG}.ok`} />}
    >
      <div className="details-form">
        <span className="details-label" id={hierarchyLabelId}>
          Certificate Hierarchy:
        </span>
        <div
          className="details-hierarchy"
          role="listbox"
          aria-labelledby={hierarchyLabelId}
        >
          {certs.map((item, i) => (
            <button
              key={`${item.serialHex}-${i}`}
              type="button"
              role="option"
              aria-selected={i === selected}
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
  return <ViewKeyDialog id={PRIVATE_KEY_DIALOG} fallbackTitle="Private Key Details" />;
}

export function ViewPublicKeyDialog() {
  return <ViewKeyDialog id={PUBLIC_KEY_DIALOG} fallbackTitle="Public Key Details" />;
}

export function ViewSecretKeyDialog() {
  return <ViewKeyDialog id={SECRET_KEY_DIALOG} fallbackTitle="Secret Key Details" />;
}
