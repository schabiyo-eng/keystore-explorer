import type { ReactNode } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import type { SignerRow } from "./report";

export function ReportField({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} readOnly value={value} autoComplete="off" spellCheck={false} />
    </label>
  );
}

export function RadioOption({
  name,
  id,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  id: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label htmlFor={id}>
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
      />
      {label}
    </label>
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

export function CloseButton({
  dialogId,
  command,
}: {
  dialogId: string;
  command: string;
}) {
  return (
    <button
      type="button"
      data-testid={`${dialogId}.ok`}
      aria-label="OK"
      onClick={() => void runCommand(command, { dismiss: true })}
    >
      OK
    </button>
  );
}

export function VerifyFormDialog({
  id,
  title,
  command,
  onOk,
  children,
}: {
  id: string;
  title: string;
  command: string;
  onOk: () => void;
  children: ReactNode;
}) {
  return (
    <FrameDialog
      id={id}
      title={title}
      open
      actions={<OkCancelButtons dialogId={id} command={command} onOk={onOk} />}
    >
      {children}
    </FrameDialog>
  );
}

export function SignerFields({
  prefix,
  status,
  signer,
  children,
}: {
  prefix: string;
  status: string;
  signer?: SignerRow;
  children?: ReactNode;
}) {
  return (
    <div className="verify-form">
      {children}
      <ReportField id={`${prefix}.status`} label="Status:" value={status} />
      {signer ? (
        <>
          <ReportField id={`${prefix}.version`} label="Version:" value={signer.version} />
          <ReportField id={`${prefix}.subject`} label="Subject:" value={signer.subject} />
          <ReportField id={`${prefix}.issuer`} label="Issuer:" value={signer.issuer} />
          <ReportField id={`${prefix}.signing-time`} label="Signing Time:" value={signer.signingTime} />
          <ReportField id={`${prefix}.algorithm`} label="Signature Algorithm:" value={signer.algorithm} />
        </>
      ) : null}
    </div>
  );
}
