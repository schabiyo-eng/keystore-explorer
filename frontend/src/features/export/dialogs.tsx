import { useRef } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";

function DialogActions({
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

export function ExportCsvDialog() {
  const pathRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id="dialog.export-csv"
      title="Export KeyStore as CSV"
      open
      actions={
        <DialogActions
          command="exportCsv"
          okId="dialog.export-csv.ok"
          cancelId="dialog.export-csv.cancel"
          onOk={() => void runCommand("exportCsv", { path: pathRef.current?.value })}
        />
      }
    >
      <label className="field">
        <span>Export file</span>
        <input ref={pathRef} />
      </label>
    </FrameDialog>
  );
}

export function ExportKeyPairDialog() {
  const pathRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id="dialog.export-key-pair"
      title="Export Key Pair"
      open
      actions={
        <DialogActions
          command="exportKeyPair"
          okId="dialog.export-key-pair.ok"
          cancelId="dialog.export-key-pair.cancel"
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
      <p>Format: PKCS#12</p>
      <label className="field">
        <span>Export file</span>
        <input ref={pathRef} />
      </label>
      <label className="field">
        <span>Password</span>
        <input ref={passwordRef} type="password" autoComplete="off" />
      </label>
    </FrameDialog>
  );
}

export function ExportCertificatesDialog() {
  const pathRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id="dialog.export-certificates"
      title="Export Certificates"
      open
      actions={
        <DialogActions
          command="exportCertificate"
          okId="dialog.export-certificates.ok"
          cancelId="dialog.export-certificates.cancel"
          onOk={() =>
            void runCommand("exportCertificate", {
              path: pathRef.current?.value,
              format: "X509",
            })
          }
        />
      }
    >
      <p>Format: X.509</p>
      <label className="field">
        <span>Export file</span>
        <input ref={pathRef} />
      </label>
    </FrameDialog>
  );
}

export function ExportPrivateKeyDialog() {
  const pathRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id="dialog.export-private-key-type"
      title="Export Private Key"
      open
      actions={
        <DialogActions
          command="exportPrivateKey"
          okId="dialog.export-private-key-type.ok"
          cancelId="dialog.export-private-key-type.cancel"
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
      <p>Format: PKCS#8</p>
      <label className="field">
        <span>Export file</span>
        <input ref={pathRef} />
      </label>
      <label className="field">
        <span>Password</span>
        <input ref={passwordRef} type="password" autoComplete="off" />
      </label>
    </FrameDialog>
  );
}

export function ExportPublicKeyDialog() {
  const pathRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id="dialog.export-public-key"
      title="Export Public Key"
      open
      actions={
        <DialogActions
          command="exportPublicKey"
          okId="dialog.export-public-key.ok"
          cancelId="dialog.export-public-key.cancel"
          onOk={() =>
            void runCommand("exportPublicKey", {
              path: pathRef.current?.value,
              format: "PEM",
            })
          }
        />
      }
    >
      <p>Format: PEM</p>
      <label className="field">
        <span>Export file</span>
        <input ref={pathRef} />
      </label>
    </FrameDialog>
  );
}
