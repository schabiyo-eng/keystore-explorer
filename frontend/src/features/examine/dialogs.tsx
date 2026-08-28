import { useRef, useState } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import { host } from "../../shell/session";
import { useExamineView } from "./useExamineView";
import "./examine.css";

function CloseButton({ testId }: { testId: string }) {
  return (
    <button type="button" data-testid={testId} aria-label="OK" onClick={() => host.closeDialog()}>
      OK
    </button>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input readOnly value={value} autoComplete="off" />
    </label>
  );
}

export function ViewCertificateDialog() {
  const view = useExamineView();
  const certs = view?.dialog === "dialog.view-certificate" ? (view.certs ?? []) : [];
  const title = view?.dialog === "dialog.view-certificate" ? view.title : "Certificate Details";
  const [index, setIndex] = useState(0);
  const selected = Math.min(index, Math.max(certs.length - 1, 0));
  const cert = certs[selected];

  return (
    <FrameDialog
      id="dialog.view-certificate"
      title={title}
      open
      actions={<CloseButton testId="dialog.view-certificate.ok" />}
    >
      <div className="examine-form">
        {certs.length > 1 ? (
          <div className="examine-hierarchy" role="listbox" aria-label="Certificate Hierarchy">
            {certs.map((item, i) => (
              <button
                key={`${item.serial}-${i}`}
                type="button"
                role="option"
                aria-selected={i === selected}
                onClick={() => setIndex(i)}
              >
                {item.subject || `Certificate ${i + 1}`}
              </button>
            ))}
          </div>
        ) : null}
        {cert ? (
          <>
            <ReadField label="Subject:" value={cert.subject} />
            <ReadField label="Issuer:" value={cert.issuer} />
            <ReadField label="Serial Number:" value={cert.serial} />
            <ReadField label="Valid From:" value={cert.validFrom} />
            <ReadField label="Valid Until:" value={cert.validUntil} />
          </>
        ) : (
          <p className="examine-message">{view?.message ?? "X.509 certificate"}</p>
        )}
      </div>
    </FrameDialog>
  );
}

export function ViewCsrDialog() {
  const view = useExamineView();
  const fields = view?.dialog === "dialog.view-csr" ? (view.fields ?? []) : [];
  return (
    <FrameDialog
      id="dialog.view-csr"
      title={view?.dialog === "dialog.view-csr" ? view.title : "Certification Request Details"}
      open
      actions={<CloseButton testId="dialog.view-csr.ok" />}
    >
      <div className="examine-form">
        {fields.map((field) => (
          <ReadField key={field.label} label={field.label} value={field.value} />
        ))}
      </div>
    </FrameDialog>
  );
}

export function ViewCrlDialog() {
  const view = useExamineView();
  const fields = view?.dialog === "dialog.view-crl" ? (view.fields ?? []) : [];
  return (
    <FrameDialog
      id="dialog.view-crl"
      title={view?.dialog === "dialog.view-crl" ? view.title : "CRL Details"}
      open
      actions={<CloseButton testId="dialog.view-crl.ok" />}
    >
      <div className="examine-form">
        {fields.map((field) => (
          <ReadField key={field.label} label={field.label} value={field.value} />
        ))}
      </div>
    </FrameDialog>
  );
}

export function ViewJwtDialog() {
  const view = useExamineView();
  const jwt = view?.dialog === "dialog.view-jwt" ? view.jwt : undefined;
  return (
    <FrameDialog
      id="dialog.view-jwt"
      title={view?.dialog === "dialog.view-jwt" ? view.title : "JSON Web Token Details"}
      open
      actions={<CloseButton testId="dialog.view-jwt.ok" />}
    >
      <div className="examine-form">
        <label className="field">
          <span>Header:</span>
          <textarea readOnly rows={6} value={jwt?.header ?? ""} spellCheck={false} />
        </label>
        <label className="field">
          <span>Payload:</span>
          <textarea readOnly rows={6} value={jwt?.payload ?? ""} spellCheck={false} />
        </label>
        <label className="field">
          <span>Signature:</span>
          <textarea readOnly rows={3} value={jwt?.signature ?? ""} spellCheck={false} />
        </label>
      </div>
    </FrameDialog>
  );
}

export function Pkcs12InfoDialog() {
  const view = useExamineView();
  return (
    <FrameDialog
      id="dialog.pkcs12-info"
      title={view?.dialog === "dialog.pkcs12-info" ? view.title : "PKCS #12 Information"}
      open
      actions={<CloseButton testId="dialog.pkcs12-info.ok" />}
    >
      <p className="examine-message">{view?.message ?? "PKCS #12 KeyStore"}</p>
    </FrameDialog>
  );
}

export function DetectFileTypeDialog() {
  const view = useExamineView();
  return (
    <FrameDialog
      id="dialog.detect-file-type"
      title={view?.dialog === "dialog.detect-file-type" ? view.title : "Cryptographic File Type"}
      open
      actions={<CloseButton testId="dialog.detect-file-type.ok" />}
    >
      <p className="examine-message">{view?.message ?? "File type"}</p>
    </FrameDialog>
  );
}

export function ExamineSslDialog() {
  const hostRef = useRef<HTMLInputElement>(null);
  const portRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id="dialog.examine-ssl"
      title="Examine SSL"
      open
      actions={
        <>
          <button
            type="button"
            data-testid="dialog.examine-ssl.ok"
            aria-label="OK"
            onClick={() =>
              void runCommand("examineSsl", {
                host: hostRef.current?.value,
                port: portRef.current?.value,
              })
            }
          >
            OK
          </button>
          <button
            type="button"
            data-testid="dialog.examine-ssl.cancel"
            aria-label="Cancel"
            onClick={() => void runCommand("examineSsl", { cancel: true })}
          >
            Cancel
          </button>
        </>
      }
    >
      <label className="field" htmlFor="dialog.examine-ssl.host">
        <span>SSL Host</span>
        <input
          id="dialog.examine-ssl.host"
          ref={hostRef}
          data-testid="dialog.examine-ssl.host"
          type="text"
          autoComplete="off"
          spellCheck={false}
          defaultValue="example.com"
        />
      </label>
      <label className="field" htmlFor="dialog.examine-ssl.port">
        <span>SSL Port</span>
        <input
          id="dialog.examine-ssl.port"
          ref={portRef}
          data-testid="dialog.examine-ssl.port"
          type="text"
          autoComplete="off"
          defaultValue="443"
        />
      </label>
    </FrameDialog>
  );
}
