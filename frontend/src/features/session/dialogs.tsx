import { useRef, type Ref } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import { useSession } from "../../shell/useSession";
import { entryPasswordCommand } from "./active";

function DialogField({
  testId,
  label,
  type = "text",
  inputRef,
}: {
  testId: string;
  label: string;
  type?: "text" | "password";
  inputRef?: Ref<HTMLInputElement>;
}) {
  return (
    <label className="field" htmlFor={testId}>
      <span>{label}</span>
      <input
        id={testId}
        ref={inputRef}
        data-testid={testId}
        type={type}
        autoComplete="off"
      />
    </label>
  );
}

export function FindDialog() {
  const queryRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id="dialog.find"
      title="Find"
      open
      actions={
        <>
          <button
            type="button"
            data-testid="dialog.find.ok"
            onClick={() => void runCommand("find", { query: queryRef.current?.value })}
          >
            Find
          </button>
          <button
            type="button"
            data-testid="dialog.find.cancel"
            onClick={() => void runCommand("find", { cancel: true })}
          >
            Cancel
          </button>
        </>
      }
    >
      <DialogField testId="dialog.find.query" label="Entry name" inputRef={queryRef} />
    </FrameDialog>
  );
}

export function ChangePasswordDialog() {
  const oldRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLInputElement>(null);
  const command = entryPasswordCommand();
  return (
    <FrameDialog
      id="dialog.change-password"
      title="Change Password"
      open
      actions={
        <>
          <button
            type="button"
            data-testid="dialog.change-password.ok"
            onClick={() =>
              void runCommand(command, {
                oldPassword: oldRef.current?.value,
                newPassword: nextRef.current?.value,
              })
            }
          >
            OK
          </button>
          <button
            type="button"
            data-testid="dialog.change-password.cancel"
            onClick={() => void runCommand(command, { cancel: true })}
          >
            Cancel
          </button>
        </>
      }
    >
      <DialogField
        testId="dialog.change-password.old"
        label="Current password"
        type="password"
        inputRef={oldRef}
      />
      <DialogField
        testId="dialog.change-password.value"
        label="New password"
        type="password"
        inputRef={nextRef}
      />
      <DialogField
        testId="dialog.change-password.confirm"
        label="Confirm"
        type="password"
      />
    </FrameDialog>
  );
}

export function PropertiesDialog() {
  const { tabs, activeId } = useSession();
  const active = tabs.find((tab) => tab.id === activeId) ?? null;
  return (
    <FrameDialog
      id="dialog.properties"
      title="KeyStore Properties"
      open
      actions={
        <button
          type="button"
          data-testid="dialog.properties.ok"
          onClick={() => void runCommand("properties", { dismiss: true })}
        >
          OK
        </button>
      }
    >
      <p>Type: {active?.store.type ?? "PKCS12"}</p>
      <p>Name: {active?.name ?? ""}</p>
      <p>Path: {active?.path ?? "(unsaved)"}</p>
      <p>Entries: {active?.store.entries.length ?? 0}</p>
    </FrameDialog>
  );
}

export function CompareCertificatesDialog() {
  const { selection } = useSession();
  return (
    <FrameDialog
      id="dialog.compare-certificates"
      title="Compare Certificates"
      open
      actions={
        <button
          type="button"
          data-testid="dialog.compare-certificates.ok"
          onClick={() => void runCommand("compareCertificate", { dismiss: true })}
        >
          OK
        </button>
      }
    >
      <p>Certificate 1: {selection[0] ?? ""}</p>
      <p>Certificate 2: {selection[1] ?? ""}</p>
    </FrameDialog>
  );
}
