import { useRef, useState, type ChangeEvent, type RefObject } from "react";
import { KEYSTORE_TYPES } from "./menu-config";
import { currentIntent } from "./dialog-intent";
import { runCommand } from "./registry";
import { host } from "./session";
import type { CommandParams } from "./types";
import { useSession } from "./useSession";
import { FrameDialog } from "./FrameDialog";

function submitDialog(fields: CommandParams): void {
  const intent = currentIntent();
  if (!intent?.command) {
    host.closeDialog();
    return;
  }
  void runCommand(intent.command, { ...intent.params, ...fields });
}

function cancelDialog(): void {
  const intent = currentIntent();
  if (!intent?.command) {
    host.closeDialog();
    return;
  }
  void runCommand(intent.command, {
    ...intent.params,
    cancel: true,
    confirm: false,
    replaceExisting: false,
  });
}

function dismissDialog(): void {
  host.closeDialog();
}

function TypeRadios({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
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
            checked={value === type.value}
            onChange={() => onChange(type.value)}
          />
          {type.label}
        </label>
      ))}
    </fieldset>
  );
}

export function NewKeyStoreDialog({ open }: { open: boolean }) {
  const [type, setType] = useState("PKCS12");
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
            onClick={() => submitDialog({ type })}
          >
            OK
          </button>
          <button type="button" data-testid="dialog.new-keystore.cancel" onClick={cancelDialog}>
            Cancel
          </button>
        </>
      }
    >
      <TypeRadios value={type} onChange={setType} />
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
        <button type="button" data-testid="dialog.problem.ok" onClick={dismissDialog}>
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
        <button type="button" data-testid="dialog.error.ok" onClick={dismissDialog}>
          OK
        </button>
      }
    >
      <p>{errorId ?? "An error occurred."}</p>
    </FrameDialog>
  );
}

export function PasswordDialog({ open }: { open: boolean }) {
  const valueRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id="dialog.password"
      title="Password"
      open={open}
      actions={
        <>
          <button
            type="button"
            data-testid="dialog.password.ok"
            onClick={() => submitDialog({ password: valueRef.current?.value })}
          >
            OK
          </button>
          <button type="button" data-testid="dialog.password.cancel" onClick={cancelDialog}>
            Cancel
          </button>
        </>
      }
    >
      <label className="field">
        <span>Password</span>
        <input
          ref={valueRef}
          data-testid="dialog.password.value"
          type="password"
          autoComplete="off"
        />
      </label>
    </FrameDialog>
  );
}

export function NewPasswordDialog({ open }: { open: boolean }) {
  const valueRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id="dialog.new-password"
      title="New Password"
      open={open}
      actions={
        <>
          <button
            type="button"
            data-testid="dialog.new-password.ok"
            onClick={() => {
              const password = valueRef.current?.value;
              const confirm = confirmRef.current?.value;
              submitDialog({ password, newPassword: password, confirm });
            }}
          >
            OK
          </button>
          <button type="button" data-testid="dialog.new-password.cancel" onClick={cancelDialog}>
            Cancel
          </button>
        </>
      }
    >
      <label className="field">
        <span>Password</span>
        <input
          ref={valueRef}
          data-testid="dialog.new-password.value"
          type="password"
          autoComplete="off"
        />
      </label>
      <label className="field">
        <span>Confirm</span>
        <input
          ref={confirmRef}
          data-testid="dialog.new-password.confirm"
          type="password"
          autoComplete="off"
        />
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
          <button
            type="button"
            data-testid="dialog.confirm.ok"
            onClick={() => submitDialog({ confirm: true, replaceExisting: true })}
          >
            OK
          </button>
          <button type="button" data-testid="dialog.confirm.cancel" onClick={cancelDialog}>
            Cancel
          </button>
        </>
      }
    >
      <p>Continue?</p>
    </FrameDialog>
  );
}

function PathField({
  testId,
  inputRef,
  onFile,
}: {
  testId: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onFile?: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      <label className="field">
        <span>File name</span>
        <input ref={inputRef} data-testid={testId} />
      </label>
      {onFile ? (
        <label className="field">
          <span>Choose file</span>
          <input type="file" aria-label="Choose file" onChange={onFile} />
        </label>
      ) : null}
    </>
  );
}

export function FileOpenDialog({ open }: { open: boolean }) {
  const pathRef = useRef<HTMLInputElement>(null);

  async function onFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    host.vfsWrite(file.name, bytes);
    if (pathRef.current) {
      pathRef.current.value = file.name;
    }
  }

  return (
    <FrameDialog
      id="dialog.file-open"
      title="Open"
      open={open}
      actions={
        <>
          <button
            type="button"
            data-testid="dialog.file-open.ok"
            onClick={() => submitDialog({ path: pathRef.current?.value, fixture: pathRef.current?.value })}
          >
            Open
          </button>
          <button type="button" data-testid="dialog.file-open.cancel" onClick={cancelDialog}>
            Cancel
          </button>
        </>
      }
    >
      <p>Choose a PKCS#12 KeyStore.</p>
      <PathField testId="dialog.file-open.path" inputRef={pathRef} onFile={onFile} />
    </FrameDialog>
  );
}

export function FileSaveDialog({ open }: { open: boolean }) {
  const pathRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id="dialog.file-save"
      title="Save"
      open={open}
      actions={
        <>
          <button
            type="button"
            data-testid="dialog.file-save.ok"
            onClick={() => submitDialog({ path: pathRef.current?.value })}
          >
            Save
          </button>
          <button type="button" data-testid="dialog.file-save.cancel" onClick={cancelDialog}>
            Cancel
          </button>
        </>
      }
    >
      <PathField testId="dialog.file-save.path" inputRef={pathRef} />
    </FrameDialog>
  );
}
