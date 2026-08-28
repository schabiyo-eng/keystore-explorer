import type { ReactNode, Ref } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import { host } from "../../shell/session";
import {
  EXAMINE_SSL_HOST,
  EXAMINE_SSL_PORT,
  VIEW_CERTIFICATE_DIALOG,
  VIEW_JWT_DIALOG,
} from "./dialog-ids";
import type { CertSummary, FieldRow, JwtSummary } from "./view";

function fieldInputId(dialogId: string, label: string): string {
  const slug = label
    .replace(/:$/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  return `${dialogId}.${slug}`;
}

export function OkButton({ testId }: { testId: string }) {
  return (
    <button type="button" data-testid={testId} aria-label="OK" onClick={() => host.closeDialog()}>
      OK
    </button>
  );
}

export function OkCancelButtons({
  dialogId,
  command,
  onOk,
}: {
  dialogId: string;
  command: string;
  onOk: () => void;
}) {
  return (
    <>
      <button type="button" data-testid={`${dialogId}.ok`} aria-label="OK" onClick={onOk}>
        OK
      </button>
      <button
        type="button"
        data-testid={`${dialogId}.cancel`}
        aria-label="Cancel"
        onClick={() => void runCommand(command, { cancel: true })}
      >
        Cancel
      </button>
    </>
  );
}

export function ReadField({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} readOnly value={value} autoComplete="off" />
    </label>
  );
}

export function TextAreaField({
  id,
  label,
  value,
  rows,
}: {
  id: string;
  label: string;
  value: string;
  rows: number;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <textarea id={id} readOnly rows={rows} value={value} spellCheck={false} />
    </label>
  );
}

export function DialogField({
  id,
  label,
  inputRef,
  defaultValue,
}: {
  id: string;
  label: string;
  inputRef: Ref<HTMLInputElement>;
  defaultValue?: string;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        ref={inputRef}
        data-testid={id}
        type="text"
        autoComplete="off"
        spellCheck={false}
        defaultValue={defaultValue}
      />
    </label>
  );
}

export function ReportDialog({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <FrameDialog id={id} title={title} open actions={<OkButton testId={`${id}.ok`} />}>
      {children}
    </FrameDialog>
  );
}

export function MessagePanel({ message }: { message: string }) {
  return <p className="examine-message">{message}</p>;
}

export function FieldList({ dialogId, fields }: { dialogId: string; fields: FieldRow[] }) {
  return (
    <div className="examine-form">
      {fields.map((field) => (
        <ReadField
          key={field.label}
          id={fieldInputId(dialogId, field.label)}
          label={field.label}
          value={field.value}
        />
      ))}
    </div>
  );
}

export function CertificateHierarchy({
  certs,
  selected,
  onSelect,
}: {
  certs: CertSummary[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  if (certs.length <= 1) {
    return null;
  }
  return (
    <div className="examine-hierarchy" role="listbox" aria-label="Certificate Hierarchy">
      {certs.map((item, i) => (
        <button
          key={`${item.serial}-${i}`}
          type="button"
          role="option"
          aria-selected={i === selected}
          onClick={() => onSelect(i)}
        >
          {item.subject || `Certificate ${i + 1}`}
        </button>
      ))}
    </div>
  );
}

export function CertificateFields({ cert }: { cert: CertSummary }) {
  const prefix = VIEW_CERTIFICATE_DIALOG;
  return (
    <>
      <ReadField id={`${prefix}.subject`} label="Subject:" value={cert.subject} />
      <ReadField id={`${prefix}.issuer`} label="Issuer:" value={cert.issuer} />
      <ReadField id={`${prefix}.serial-number`} label="Serial Number:" value={cert.serial} />
      <ReadField id={`${prefix}.valid-from`} label="Valid From:" value={cert.validFrom} />
      <ReadField id={`${prefix}.valid-until`} label="Valid Until:" value={cert.validUntil} />
    </>
  );
}

export function JwtFields({ jwt }: { jwt: JwtSummary }) {
  const prefix = VIEW_JWT_DIALOG;
  return (
    <div className="examine-form">
      <TextAreaField id={`${prefix}.header`} label="Header:" value={jwt.header} rows={6} />
      <TextAreaField id={`${prefix}.payload`} label="Payload:" value={jwt.payload} rows={6} />
      <TextAreaField id={`${prefix}.signature`} label="Signature:" value={jwt.signature} rows={3} />
    </div>
  );
}

export function SslForm({
  hostRef,
  portRef,
}: {
  hostRef: Ref<HTMLInputElement>;
  portRef: Ref<HTMLInputElement>;
}) {
  return (
    <>
      <DialogField id={EXAMINE_SSL_HOST} label="SSL Host" inputRef={hostRef} defaultValue="example.com" />
      <DialogField id={EXAMINE_SSL_PORT} label="SSL Port" inputRef={portRef} defaultValue="443" />
    </>
  );
}
