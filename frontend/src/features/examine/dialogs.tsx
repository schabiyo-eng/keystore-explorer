import { useRef, useState } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import {
  DETECT_FILE_TYPE_DIALOG,
  EXAMINE_SSL_DIALOG,
  PKCS12_INFO_DIALOG,
  VIEW_CERTIFICATE_DIALOG,
  VIEW_CRL_DIALOG,
  VIEW_CSR_DIALOG,
  VIEW_JWT_DIALOG,
} from "./dialog-ids";
import {
  CertificateFields,
  CertificateHierarchy,
  FieldList,
  JwtFields,
  MessagePanel,
  OkCancelButtons,
  ReportDialog,
  SslForm,
} from "./fields";
import { useMatchedView } from "./useExamineView";
import "./examine.css";

export function ViewCertificateDialog() {
  const view = useMatchedView(VIEW_CERTIFICATE_DIALOG);
  const certs = view?.certs ?? [];
  const [index, setIndex] = useState(0);
  const selected = Math.min(index, Math.max(certs.length - 1, 0));
  const cert = certs[selected];

  return (
    <ReportDialog id={VIEW_CERTIFICATE_DIALOG} title={view?.title ?? "Certificate Details"}>
      <div className="examine-form">
        <CertificateHierarchy certs={certs} selected={selected} onSelect={setIndex} />
        {cert ? <CertificateFields cert={cert} /> : <MessagePanel message="X.509 certificate" />}
      </div>
    </ReportDialog>
  );
}

export function ViewCsrDialog() {
  const view = useMatchedView(VIEW_CSR_DIALOG);
  return (
    <ReportDialog id={VIEW_CSR_DIALOG} title={view?.title ?? "Certification Request Details"}>
      <FieldList dialogId={VIEW_CSR_DIALOG} fields={view?.fields ?? []} />
    </ReportDialog>
  );
}

export function ViewCrlDialog() {
  const view = useMatchedView(VIEW_CRL_DIALOG);
  return (
    <ReportDialog id={VIEW_CRL_DIALOG} title={view?.title ?? "CRL Details"}>
      <FieldList dialogId={VIEW_CRL_DIALOG} fields={view?.fields ?? []} />
    </ReportDialog>
  );
}

export function ViewJwtDialog() {
  const view = useMatchedView(VIEW_JWT_DIALOG);
  return (
    <ReportDialog id={VIEW_JWT_DIALOG} title={view?.title ?? "JSON Web Token Details"}>
      <JwtFields jwt={view?.jwt ?? { header: "", payload: "", signature: "" }} />
    </ReportDialog>
  );
}

export function Pkcs12InfoDialog() {
  const view = useMatchedView(PKCS12_INFO_DIALOG);
  return (
    <ReportDialog id={PKCS12_INFO_DIALOG} title={view?.title ?? "PKCS #12 Information"}>
      <MessagePanel message={view?.message ?? "PKCS #12 KeyStore"} />
    </ReportDialog>
  );
}

export function DetectFileTypeDialog() {
  const view = useMatchedView(DETECT_FILE_TYPE_DIALOG);
  return (
    <ReportDialog id={DETECT_FILE_TYPE_DIALOG} title={view?.title ?? "Cryptographic File Type"}>
      <MessagePanel message={view?.message ?? "File type"} />
    </ReportDialog>
  );
}

export function ExamineSslDialog() {
  const hostRef = useRef<HTMLInputElement>(null);
  const portRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id={EXAMINE_SSL_DIALOG}
      title="Examine SSL"
      open
      actions={
        <OkCancelButtons
          dialogId={EXAMINE_SSL_DIALOG}
          command="examineSsl"
          onOk={() =>
            void runCommand("examineSsl", {
              host: hostRef.current?.value,
              port: portRef.current?.value,
            })
          }
        />
      }
    >
      <SslForm hostRef={hostRef} portRef={portRef} />
    </FrameDialog>
  );
}
