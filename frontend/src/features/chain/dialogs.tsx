import { useState } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import { CertificateFields } from "../details/fields";
import { useDetailsView } from "../details/useDetailsView";
import { CERTIFICATE_DIALOG } from "../details/view";
import "../details/details.css";

function DialogActions({
  okId,
  cancelId,
  onOk,
  onCancel,
}: {
  okId: string;
  cancelId: string;
  onOk: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <button type="button" data-testid={okId} aria-label="OK" onClick={onOk}>
        OK
      </button>
      <button type="button" data-testid={cancelId} aria-label="Cancel" onClick={onCancel}>
        Cancel
      </button>
    </>
  );
}

/**
 * Inspect a certificate that will be appended using details fields.
 * Not registered: `dialog.view-certificate` belongs to the details slice.
 */
export function AppendCertificatePreview() {
  const view = useDetailsView();
  const certs = view?.dialog === CERTIFICATE_DIALOG ? view.certs : [];
  const title = view?.dialog === CERTIFICATE_DIALOG ? view.title : "Append Certificate";
  const [index, setIndex] = useState(0);
  const selected = Math.min(index, Math.max(certs.length - 1, 0));
  const cert = certs[selected];
  const hierarchyLabelId = `${CERTIFICATE_DIALOG}.hierarchy-label`;

  return (
    <FrameDialog
      id={CERTIFICATE_DIALOG}
      title={title}
      open
      actions={
        <DialogActions
          okId={`${CERTIFICATE_DIALOG}.ok`}
          cancelId="dialog.file-open.cancel"
          onOk={() => void runCommand("appendToCertificateChain", { confirm: true })}
          onCancel={() => void runCommand("appendToCertificateChain", { cancel: true })}
        />
      }
    >
      <div className="details-form">
        <span className="details-label" id={hierarchyLabelId}>
          Certificate Hierarchy:
        </span>
        <div className="details-hierarchy" role="listbox" aria-labelledby={hierarchyLabelId}>
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
        {cert ? <CertificateFields cert={cert} /> : <p>Choose a certificate to append.</p>}
      </div>
    </FrameDialog>
  );
}

/**
 * Remove-confirm chrome. The File shell already hosts `dialog.confirm`;
 * this is the chain-specific OK/Cancel wiring for tests and modernize.
 * Not registered under that id.
 */
export function RemoveCertificateConfirm() {
  return (
    <FrameDialog
      id="dialog.confirm"
      title="Remove Certificate"
      open
      actions={
        <DialogActions
          okId="dialog.confirm.ok"
          cancelId="dialog.confirm.cancel"
          onOk={() => void runCommand("removeFromCertificateChain", { confirm: true })}
          onCancel={() => void runCommand("removeFromCertificateChain", { confirm: false })}
        />
      }
    >
      <p>Remove the last certificate from the chain?</p>
    </FrameDialog>
  );
}
