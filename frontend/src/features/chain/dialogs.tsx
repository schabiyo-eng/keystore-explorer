import { useState } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import { CertificateFields } from "../details/fields";
import { useDetailsView } from "../details/useDetailsView";
import { CERTIFICATE_DIALOG } from "../details/view";

/**
 * Inspect a certificate that will be appended using details fields.
 * Not registered: `dialog.view-certificate` belongs to the details slice.
 */
export function AppendCertificatePreview() {
  const view = useDetailsView();
  const certs = view?.dialog === CERTIFICATE_DIALOG ? view.certs : [];
  const [index, setIndex] = useState(0);
  const selected = Math.min(index, Math.max(certs.length - 1, 0));
  const cert = certs[selected];

  return (
    <FrameDialog
      id={CERTIFICATE_DIALOG}
      title={view?.dialog === CERTIFICATE_DIALOG ? view.title : "Append Certificate"}
      open
      actions={
        <>
          <button
            type="button"
            data-testid={`${CERTIFICATE_DIALOG}.ok`}
            aria-label="OK"
            onClick={() => void runCommand("appendToCertificateChain", { confirm: true })}
          >
            OK
          </button>
          <button
            type="button"
            data-testid="dialog.file-open.cancel"
            aria-label="Cancel"
            onClick={() => void runCommand("appendToCertificateChain", { cancel: true })}
          >
            Cancel
          </button>
        </>
      }
    >
      <div className="details-form">
        {certs.map((item, i) => (
          <button key={`${item.serialHex}-${i}`} type="button" onClick={() => setIndex(i)}>
            {item.subject || `Certificate ${i + 1}`}
          </button>
        ))}
        {cert ? <CertificateFields cert={cert} /> : <p>Choose a certificate to append.</p>}
      </div>
    </FrameDialog>
  );
}
