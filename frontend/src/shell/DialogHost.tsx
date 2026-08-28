import { createElement } from "react";
import { getDialog, runCommand } from "./registry";
import { KEYSTORE_TYPES } from "./menu-config";
import { useSession } from "./useSession";

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

function NewKeyStoreDialog({ open }: { open: boolean }) {
  return (
    <div data-testid="dialog.new-keystore" hidden={!open} className="dialog" role="dialog">
      <h2>New KeyStore</h2>
      <TypeRadios />
      <div className="dialog-actions">
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
      </div>
    </div>
  );
}

function ProblemDialog({ open }: { open: boolean }) {
  const { errorId } = useSession();
  return (
    <div data-testid="dialog.problem" hidden={!open} className="dialog" role="dialog">
      <h2>Problem</h2>
      <p>{errorId ?? "An error occurred."}</p>
      <button type="button" data-testid="dialog.problem.ok">
        OK
      </button>
    </div>
  );
}

function ErrorDialog({ open }: { open: boolean }) {
  const { errorId } = useSession();
  return (
    <div data-testid="dialog.error" hidden={!open} className="dialog" role="dialog">
      <h2>Error</h2>
      <p>{errorId ?? "An error occurred."}</p>
      <button type="button" data-testid="dialog.error.ok">
        OK
      </button>
    </div>
  );
}

function PasswordDialog({ open }: { open: boolean }) {
  return (
    <div data-testid="dialog.password" hidden={!open} className="dialog" role="dialog">
      <h2>Password</h2>
      <input data-testid="dialog.password.value" type="password" />
      <div className="dialog-actions">
        <button type="button" data-testid="dialog.password.ok">
          OK
        </button>
        <button type="button" data-testid="dialog.password.cancel">
          Cancel
        </button>
      </div>
    </div>
  );
}

function NewPasswordDialog({ open }: { open: boolean }) {
  return (
    <div data-testid="dialog.new-password" hidden={!open} className="dialog" role="dialog">
      <h2>New Password</h2>
      <input data-testid="dialog.new-password.value" type="password" />
      <input data-testid="dialog.new-password.confirm" type="password" />
      <div className="dialog-actions">
        <button type="button" data-testid="dialog.new-password.ok">
          OK
        </button>
        <button type="button" data-testid="dialog.new-password.cancel">
          Cancel
        </button>
      </div>
    </div>
  );
}

function ConfirmDialog({ open }: { open: boolean }) {
  return (
    <div data-testid="dialog.confirm" hidden={!open} className="dialog" role="dialog">
      <h2>Confirm</h2>
      <div className="dialog-actions">
        <button type="button" data-testid="dialog.confirm.ok">
          OK
        </button>
        <button type="button" data-testid="dialog.confirm.cancel">
          Cancel
        </button>
      </div>
    </div>
  );
}

function FileOpenDialog({ open }: { open: boolean }) {
  return (
    <div data-testid="dialog.file-open" hidden={!open} className="dialog" role="dialog">
      <h2>Open</h2>
      <div className="dialog-actions">
        <button type="button" data-testid="dialog.file-open.ok">
          Open
        </button>
        <button type="button" data-testid="dialog.file-open.cancel">
          Cancel
        </button>
      </div>
    </div>
  );
}

function FileSaveDialog({ open }: { open: boolean }) {
  return (
    <div data-testid="dialog.file-save" hidden={!open} className="dialog" role="dialog">
      <h2>Save</h2>
      <input data-testid="dialog.file-save.path" />
      <div className="dialog-actions">
        <button type="button" data-testid="dialog.file-save.ok">
          Save
        </button>
        <button type="button" data-testid="dialog.file-save.cancel">
          Cancel
        </button>
      </div>
    </div>
  );
}

const BUILTIN = {
  "dialog.new-keystore": NewKeyStoreDialog,
  "dialog.problem": ProblemDialog,
  "dialog.error": ErrorDialog,
  "dialog.password": PasswordDialog,
  "dialog.new-password": NewPasswordDialog,
  "dialog.confirm": ConfirmDialog,
  "dialog.file-open": FileOpenDialog,
  "dialog.file-save": FileSaveDialog,
};

export function DialogHost() {
  const state = useSession();
  const Registered = state.dialog ? getDialog(state.dialog) : undefined;

  return (
    <div data-testid="app.dialog-host" className="dialog-host">
      {state.dialog && Registered
        ? createElement("div", { className: "modal-overlay" }, createElement(Registered))
        : null}
      {Object.entries(BUILTIN).map(([id, Dialog]) => {
        const open = state.dialog === id && !Registered;
        return (
          <div key={id} className={open ? "modal-overlay" : "dialog-slot"}>
            {createElement(Dialog, { open })}
          </div>
        );
      })}
    </div>
  );
}
