import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import {
  VERIFY_CERTIFICATE_DIALOG,
  VIEW_SIGNATURE_DIALOG,
  VIEW_SIGNED_JAR_DIALOG,
} from "./dialog-ids";
import {
  CloseButton,
  RadioOption,
  ReportField,
  SignerFields,
  VerifyFormDialog,
} from "./fields";
import { useVerifyReport } from "./useVerifyReport";
import "./verify-sig.css";

const REVOCATION_OPTIONS: { id: string; value: string; label: string; defaultChecked?: boolean }[] = [
  {
    id: `${VERIFY_CERTIFICATE_DIALOG}.revocation.crl-dp`,
    value: "crl-dp",
    label: "CRL Distribution Point extension",
    defaultChecked: true,
  },
  {
    id: `${VERIFY_CERTIFICATE_DIALOG}.revocation.crl-file`,
    value: "crl-file",
    label: "CRL file",
  },
  {
    id: `${VERIFY_CERTIFICATE_DIALOG}.revocation.ocsp-aia`,
    value: "ocsp-aia",
    label: "OCSP from Authority Information Access extension",
  },
  {
    id: `${VERIFY_CERTIFICATE_DIALOG}.revocation.ocsp-url`,
    value: "ocsp-url",
    label: "OCSP with URL",
  },
  {
    id: `${VERIFY_CERTIFICATE_DIALOG}.revocation.none`,
    value: "none",
    label: "Do not check revocation status, only verify certificate chain",
  },
];

export function VerifyCertificateDialog() {
  const alternateId = `${VERIFY_CERTIFICATE_DIALOG}.alternate-ca`;
  return (
    <VerifyFormDialog
      id={VERIFY_CERTIFICATE_DIALOG}
      title="Verify Certificate"
      command="verifyCertificate"
      onOk={() => void runCommand("verifyCertificate", {})}
    >
      <fieldset className="type-radios">
        <legend>Validate certificate chain and check revocation status using</legend>
        {REVOCATION_OPTIONS.map((option) => (
          <RadioOption
            key={option.id}
            name="verify-option"
            id={option.id}
            value={option.value}
            label={option.label}
            defaultChecked={option.defaultChecked}
          />
        ))}
      </fieldset>
      <label className="field" htmlFor={alternateId}>
        <input id={alternateId} type="checkbox" />
        <span>Use an alternate CA keystore for validating the certificate:</span>
      </label>
    </VerifyFormDialog>
  );
}

export function ViewSignedJarDialog() {
  const report = useVerifyReport();
  const entries = report?.kind === "jar" ? report.entries : [];
  const status = report?.kind === "jar" ? report.status : "";
  const statusId = `${VIEW_SIGNED_JAR_DIALOG}.status`;
  return (
    <FrameDialog
      id={VIEW_SIGNED_JAR_DIALOG}
      title="Signed JAR"
      open
      actions={<CloseButton dialogId={VIEW_SIGNED_JAR_DIALOG} command="verifyJar" />}
    >
      <div className="verify-form">
        <ReportField id={statusId} label="Status:" value={status} />
        <div className="table-wrap verify-table-wrap">
          <table className="entry-table" aria-label="JAR entries">
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
  const report = useVerifyReport();
  const signer = report && "signers" in report ? report.signers[0] : undefined;
  return (
    <FrameDialog
      id={VIEW_SIGNATURE_DIALOG}
      title="Signature Details"
      open
      actions={<CloseButton dialogId={VIEW_SIGNATURE_DIALOG} command="verifySignature" />}
    >
      <SignerFields prefix={VIEW_SIGNATURE_DIALOG} status={report?.status ?? ""} signer={signer}>
        <span className="verify-label" id={`${VIEW_SIGNATURE_DIALOG}.signers-label`}>
          Signers:
        </span>
      </SignerFields>
    </FrameDialog>
  );
}
