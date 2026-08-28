import { KEYSTORE_TYPES } from "./menu-config";
import { runCommand } from "./registry";
import { useSession } from "./useSession";
import { FrameDialog } from "./FrameDialog";

function TypeRadios() {
  return (
    <fieldset className="type-radios">
      <legend>KeyStore Type</legend>
      {KEYSTORE_TYPES.map((type) => (
        <label key={type.id}>
          <input
            type="radio"
            name="keystore-type"
            data-testid={type.id}
            value={type.value}
            disabled={type.stub}
            defaultChecked={type.value === "PKCS12"}
          />
          {type.label}
        </label>
      ))}
    </fieldset>
  );
}

export function NewKeyStoreDialog({ open }: { open: boolean }) {
  return (
    <FrameDialog
      id="dialog.new-keystore"
      title="New KeyStore"
      open={open}
      actions={
        <>
          <button
            type="button"
            data-testid="dialog.new-keystore.ok"
            onClick={() => void runCommand("newKeyStore", { type: "PKCS12" })}
          >
            OK
          </button>
          <button
            type="button"
            data-testid="dialog.new-keystore.cancel"
            onClick={() => void runCommand("newKeyStore", { cancel: true })}
          >
            Cancel
          </button>
        </>
      }
    >
      <TypeRadios />
    </FrameDialog>
  );
}

export function ProblemDialog({ open }: { open: boolean }) {
  const { errorId } = useSession();
  return (
    <FrameDialog
      id="dialog.problem"
      title="Problem"
      open={open}
      actions={
        <button type="button" data-testid="dialog.problem.ok">
          OK
        </button>
      }
    >
      <p>{errorId ?? "An error occurred."}</p>
    </FrameDialog>
  );
}

export function ErrorDialog({ open }: { open: boolean }) {
  const { errorId } = useSession();
  return (
    <FrameDialog
      id="dialog.error"
      title="Error"
      open={open}
      actions={
        <button type="button" data-testid="dialog.error.ok">
          OK
        </button>
      }
    >
      <p>{errorId ?? "An error occurred."}</p>
    </FrameDialog>
  );
}

export function PasswordDialog({ open }: { open: boolean }) {
  return (
    <FrameDialog
      id="dialog.password"
      title="Password"
      open={open}
      actions={
        <>
          <button type="button" data-testid="dialog.password.ok">
            OK
          </button>
          <button type="button" data-testid="dialog.password.cancel">
            Cancel
          </button>
        </>
      }
    >
      <label className="field">
        <span>Password</span>
        <input data-testid="dialog.password.value" type="password" autoComplete="off" />
      </label>
    </FrameDialog>
  );
}

export function NewPasswordDialog({ open }: { open: boolean }) {
  return (
    <FrameDialog
      id="dialog.new-password"
      title="New Password"
      open={open}
      actions={
        <>
          <button type="button" data-testid="dialog.new-password.ok">
            OK
          </button>
          <button type="button" data-testid="dialog.new-password.cancel">
            Cancel
          </button>
        </>
      }
    >
      <label className="field">
        <span>Password</span>
        <input data-testid="dialog.new-password.value" type="password" autoComplete="off" />
      </label>
      <label className="field">
        <span>Confirm</span>
        <input data-testid="dialog.new-password.confirm" type="password" autoComplete="off" />
      </label>
    </FrameDialog>
  );
}

export function ConfirmDialog({ open }: { open: boolean }) {
  return (
    <FrameDialog
      id="dialog.confirm"
      title="Confirm"
      open={open}
      actions={
        <>
          <button type="button" data-testid="dialog.confirm.ok">
            OK
          </button>
          <button type="button" data-testid="dialog.confirm.cancel">
            Cancel
          </button>
        </>
      }
    >
      <p>Continue?</p>
    </FrameDialog>
  );
}

export function FileOpenDialog({ open }: { open: boolean }) {
  return (
    <FrameDialog
      id="dialog.file-open"
      title="Open"
      open={open}
      actions={
        <>
          <button type="button" data-testid="dialog.file-open.ok">
            Open
          </button>
          <button type="button" data-testid="dialog.file-open.cancel">
            Cancel
          </button>
        </>
      }
    >
      <p>Choose a PKCS#12 KeyStore.</p>
    </FrameDialog>
  );
}

export function FileSaveDialog({ open }: { open: boolean }) {
  return (
    <FrameDialog
      id="dialog.file-save"
      title="Save"
      open={open}
      actions={
        <>
          <button type="button" data-testid="dialog.file-save.ok">
            Save
          </button>
          <button type="button" data-testid="dialog.file-save.cancel">
            Cancel
          </button>
        </>
      }
    >
      <label className="field">
        <span>File name</span>
        <input data-testid="dialog.file-save.path" />
      </label>
    </FrameDialog>
  );
}

export const BUILTIN_DIALOGS = {
  "dialog.new-keystore": NewKeyStoreDialog,
  "dialog.problem": ProblemDialog,
  "dialog.error": ErrorDialog,
  "dialog.password": PasswordDialog,
  "dialog.new-password": NewPasswordDialog,
  "dialog.confirm": ConfirmDialog,
  "dialog.file-open": FileOpenDialog,
  "dialog.file-save": FileSaveDialog,
} as const;
