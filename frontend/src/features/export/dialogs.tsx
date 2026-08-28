import { useRef } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import { DialogActions, ExportField, FormatChoice } from "./fields";
import {
  CERTIFICATES_DIALOG,
  CSV_DIALOG,
  KEY_PAIR_DIALOG,
  PRIVATE_KEY_DIALOG,
  PUBLIC_KEY_DIALOG,
} from "./ids";

export function ExportCsvDialog() {
  const pathRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id={CSV_DIALOG}
      title="Export as CSV"
      open
      actions={
        <DialogActions
          command="exportCsv"
          okId={`${CSV_DIALOG}.ok`}
          cancelId={`${CSV_DIALOG}.cancel`}
          onOk={() => void runCommand("exportCsv", { path: pathRef.current?.value })}
        />
      }
    >
      <ExportField id={`${CSV_DIALOG}.path`} label="Export File" inputRef={pathRef} />
    </FrameDialog>
  );
}

export function ExportKeyPairDialog() {
  const pathRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id={KEY_PAIR_DIALOG}
      title="Export Key Pair"
      open
      actions={
        <DialogActions
          command="exportKeyPair"
          okId={`${KEY_PAIR_DIALOG}.ok`}
          cancelId={`${KEY_PAIR_DIALOG}.cancel`}
          onOk={() =>
            void runCommand("exportKeyPair", {
              path: pathRef.current?.value,
              format: "PKCS12",
              password: passwordRef.current?.value,
            })
          }
        />
      }
    >
      <FormatChoice
        legend="Format"
        name="export-key-pair-format"
        options={[
          { value: "PKCS12", label: "PKCS#12" },
          { value: "PEM", label: "PEM", enabled: false },
          { value: "JWK", label: "JWK", enabled: false },
        ]}
      />
      <ExportField id={`${KEY_PAIR_DIALOG}.path`} label="Export File" inputRef={pathRef} />
      <ExportField
        id={`${KEY_PAIR_DIALOG}.password`}
        label="Password for Output File"
        type="password"
        inputRef={passwordRef}
      />
    </FrameDialog>
  );
}

export function ExportCertificatesDialog() {
  const pathRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id={CERTIFICATES_DIALOG}
      title="Export Certificates"
      open
      actions={
        <DialogActions
          command="exportCertificate"
          okId={`${CERTIFICATES_DIALOG}.ok`}
          cancelId={`${CERTIFICATES_DIALOG}.cancel`}
          onOk={() =>
            void runCommand("exportCertificate", {
              path: pathRef.current?.value,
              format: "X509",
            })
          }
        />
      }
    >
      <FormatChoice
        legend="Export Format"
        name="export-certificates-format"
        options={[
          { value: "X509", label: "X.509" },
          { value: "PKCS7", label: "PKCS #7", enabled: false },
          { value: "PKIPATH", label: "PKI Path", enabled: false },
          { value: "SPC", label: "SPC", enabled: false },
        ]}
      />
      <ExportField id={`${CERTIFICATES_DIALOG}.path`} label="Export File" inputRef={pathRef} />
    </FrameDialog>
  );
}

export function ExportPrivateKeyDialog() {
  const pathRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id={PRIVATE_KEY_DIALOG}
      title="Export Private Key Type"
      open
      actions={
        <DialogActions
          command="exportPrivateKey"
          okId={`${PRIVATE_KEY_DIALOG}.ok`}
          cancelId={`${PRIVATE_KEY_DIALOG}.cancel`}
          onOk={() =>
            void runCommand("exportPrivateKey", {
              path: pathRef.current?.value,
              format: "PKCS8",
              password: passwordRef.current?.value,
            })
          }
        />
      }
    >
      <FormatChoice
        legend="Export Type"
        name="export-private-key-format"
        options={[
          { value: "PKCS8", label: "PKCS #8" },
          { value: "PVK", label: "PVK", enabled: false },
          { value: "OPENSSL", label: "OpenSSL", enabled: false },
          { value: "JWK", label: "JWK", enabled: false },
        ]}
      />
      <ExportField id={`${PRIVATE_KEY_DIALOG}.path`} label="Export File" inputRef={pathRef} />
      <ExportField
        id={`${PRIVATE_KEY_DIALOG}.password`}
        label="Password for Output File"
        type="password"
        inputRef={passwordRef}
      />
    </FrameDialog>
  );
}

export function ExportPublicKeyDialog() {
  const pathRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id={PUBLIC_KEY_DIALOG}
      title="Export Public Key"
      open
      actions={
        <DialogActions
          command="exportPublicKey"
          okId={`${PUBLIC_KEY_DIALOG}.ok`}
          cancelId={`${PUBLIC_KEY_DIALOG}.cancel`}
          onOk={() =>
            void runCommand("exportPublicKey", {
              path: pathRef.current?.value,
              format: "PEM",
            })
          }
        />
      }
    >
      <FormatChoice
        legend="Export Format"
        name="export-public-key-format"
        options={[
          { value: "PEM", label: "OpenSSL, PEM encoded" },
          { value: "OPENSSL", label: "OpenSSL", enabled: false },
          { value: "JWK", label: "JWK", enabled: false },
        ]}
      />
      <ExportField id={`${PUBLIC_KEY_DIALOG}.path`} label="Export File" inputRef={pathRef} />
    </FrameDialog>
  );
}
