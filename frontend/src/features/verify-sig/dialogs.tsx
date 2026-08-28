import type { ReactNode } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import { getReport } from "./report";
import "./verify-sig.css";

function OkCancel({
  command,
  okId,
  cancelId,
  onOk,
}: {
  command: string;
  okId: string;
  cancelId: string;
  onOk: () => void;
}) {
  return (
    <>
      <button type="button" data-testid={okId} onClick={onOk}>
        OK
      </button>
      <button
        type="button"
        data-testid={cancelId}
        onClick={() => void runCommand(command, { cancel: true })}
      >
        Cancel
      </button>
    </>
  );
}

export function VerifyCertificateDialog() {
  return (
    <FrameDialog
      id="dialog.verify-certificate"
      title="Verify Certificate"
      open
      actions={
        <OkCancel
          command="verifyCertificate"
          okId="dialog.verify-certificate.ok"
          cancelId="dialog.verify-certificate.cancel"
          onOk={() => void runCommand("verifyCertificate", {})}
        />
      }
    >
      <fieldset className="type-radios">
        <legend>Validate certificate chain and check revocation status using</legend>
        <label>
          <input type="radio" name="verify-option" defaultChecked />
          CRL Distribution Point extension
        </label>
        <label>
          <input type="radio" name="verify-option" />
          CRL file
        </label>
        <label>
          <input type="radio" name="verify-option" />
          OCSP from Authority Information Access extension
        </label>
        <label>
          <input type="radio" name="verify-option" />
          OCSP with URL
        </label>
        <label>
          <input type="radio" name="verify-option" />
          Do not check revocation status, only verify certificate chain
        </label>
      </fieldset>
      <label className="field">
        <span>
          <input type="checkbox" /> Use an alternate CA keystore for validating the certificate:
        </span>
      </label>
    </FrameDialog>
  );
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input readOnly value={value} />
    </label>
  );
}

function CloseReport({ id, command }: { id: string; command: string }) {
  return (
    <button type="button" data-testid={`${id}.ok`} onClick={() => void runCommand(command, { dismiss: true })}>
      OK
    </button>
  );
}

function SignerFields({ children }: { children?: ReactNode }) {
  const report = getReport();
  const signer = report && "signers" in report ? report.signers[0] : undefined;
  return (
    <div className="verify-form">
      {children}
      <ReportField label="Status:" value={report?.status ?? ""} />
      {signer ? (
        <>
          <ReportField label="Version:" value={signer.version} />
          <ReportField label="Subject:" value={signer.subject} />
          <ReportField label="Issuer:" value={signer.issuer} />
          <ReportField label="Signing Time:" value={signer.signingTime} />
          <ReportField label="Signature Algorithm:" value={signer.algorithm} />
        </>
      ) : null}
    </div>
  );
}

export function ViewSignedJarDialog() {
  const report = getReport();
  const entries = report?.kind === "jar" ? report.entries : [];
  return (
    <FrameDialog
      id="dialog.view-signed-jar"
      title="Signed JAR"
      open
      actions={<CloseReport id="dialog.view-signed-jar" command="verifyJar" />}
    >
      <div className="verify-form">
        <ReportField label="Status:" value={report?.kind === "jar" ? report.status : ""} />
        <div className="table-wrap verify-table-wrap">
          <table className="entry-table">
            <thead>
              <tr>
                <th>Flags</th>
                <th>Size</th>
                <th>Date</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.name}>
                  <td>{entry.flags}</td>
                  <td>{entry.size}</td>
                  <td>{entry.date}</td>
                  <td>{entry.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </FrameDialog>
  );
}

export function ViewSignatureDialog() {
  return (
    <FrameDialog
      id="dialog.view-signature"
      title="Signature Details"
      open
      actions={<CloseReport id="dialog.view-signature" command="verifySignature" />}
    >
      <SignerFields>
        <span className="verify-label">Signers:</span>
      </SignerFields>
    </FrameDialog>
  );
}
