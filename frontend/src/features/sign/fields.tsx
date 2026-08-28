import type { ReactNode, Ref } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";

export function Field({
  id,
  label,
  inputRef,
  type = "text",
  defaultValue,
}: {
  id: string;
  label: string;
  inputRef: Ref<HTMLInputElement>;
  type?: "text" | "password";
  defaultValue?: string;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        ref={inputRef}
        type={type}
        autoComplete="off"
        spellCheck={false}
        defaultValue={defaultValue}
      />
    </label>
  );
}

export function DialogActions({
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
      <button type="button" data-testid={okId} aria-label="OK" onClick={onOk}>
        OK
      </button>
      <button
        type="button"
        data-testid={cancelId}
        aria-label="Cancel"
        onClick={() => void runCommand(command, { cancel: true })}
      >
        Cancel
      </button>
    </>
  );
}

export function SignFormDialog({
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
      actions={
        <DialogActions
          command={command}
          okId={`${id}.ok`}
          cancelId={`${id}.cancel`}
          onOk={onOk}
        />
      }
    >
      {children}
    </FrameDialog>
  );
}
