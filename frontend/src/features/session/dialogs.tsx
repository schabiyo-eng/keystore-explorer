import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import { useSession } from "../../shell/useSession";

export function FindDialog() {
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
            onClick={() => void runCommand("find")}
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
      <label className="field">
        <span>Entry name</span>
        <input data-testid="dialog.find.query" autoComplete="off" />
      </label>
    </FrameDialog>
  );
}

export function ChangePasswordDialog() {
  return (
    <FrameDialog
      id="dialog.change-password"
      title="Change Password"
      open
      actions={
        <>
          <button type="button" data-testid="dialog.change-password.ok">
            OK
          </button>
          <button
            type="button"
            data-testid="dialog.change-password.cancel"
            onClick={() => void runCommand("setKeyPassword", { cancel: true })}
          >
            Cancel
          </button>
        </>
      }
    >
      <label className="field">
        <span>Current password</span>
        <input data-testid="dialog.change-password.old" type="password" autoComplete="off" />
      </label>
      <label className="field">
        <span>New password</span>
        <input data-testid="dialog.change-password.value" type="password" autoComplete="off" />
      </label>
      <label className="field">
        <span>Confirm</span>
        <input data-testid="dialog.change-password.confirm" type="password" autoComplete="off" />
      </label>
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
        <button type="button" data-testid="dialog.compare-certificates.ok">
          OK
        </button>
      }
    >
      <p>Certificate 1: {selection[0] ?? ""}</p>
      <p>Certificate 2: {selection[1] ?? ""}</p>
    </FrameDialog>
  );
}

export const dialogs = {
  "dialog.find": FindDialog,
  "dialog.change-password": ChangePasswordDialog,
  "dialog.properties": PropertiesDialog,
  "dialog.compare-certificates": CompareCertificatesDialog,
};
