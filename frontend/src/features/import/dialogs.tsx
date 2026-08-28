import { useRef, type Ref } from "react";
import { currentIntent } from "../../shell/dialog-intent";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import { useSession } from "../../shell/useSession";
import { getPendingAliasCommand } from "./pending";

function DialogField({
  testId,
  id,
  label,
  inputRef,
  required,
}: {
  testId?: string;
  id: string;
  label: string;
  inputRef: Ref<HTMLInputElement>;
  required?: boolean;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        ref={inputRef}
        data-testid={testId}
        type="text"
        autoComplete="off"
        spellCheck={false}
        aria-required={required ? "true" : undefined}
      />
    </label>
  );
}

function DialogButtons({
  okTestId,
  cancelTestId,
  onOk,
  onCancel,
}: {
  okTestId: string;
  cancelTestId?: string;
  onOk: () => void;
  onCancel?: () => void;
}) {
  return (
    <>
      <button type="button" data-testid={okTestId} aria-label="OK" onClick={onOk}>
        OK
      </button>
      {cancelTestId && onCancel ? (
        <button type="button" data-testid={cancelTestId} aria-label="Cancel" onClick={onCancel}>
          Cancel
        </button>
      ) : null}
    </>
  );
}

function FormatRadio({
  value,
  label,
  defaultChecked,
  disabled,
}: {
  value: string;
  label: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  return (
    <label>
      <input
        type="radio"
        name="import-key-format"
        value={value}
        defaultChecked={defaultChecked}
        disabled={disabled}
        aria-label={label}
      />
      {label}
    </label>
  );
}

export function ImportKeyPairDialog() {
  const pathRef = useRef<HTMLInputElement>(null);
  const aliasRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id="dialog.import-key-pair"
      title="Import Key Pair"
      open
      actions={
        <DialogButtons
          okTestId="dialog.import-key-pair.ok"
          cancelTestId="dialog.import-key-pair.cancel"
          onOk={() =>
            void runCommand("importKeyPair", {
              path: pathRef.current?.value,
              alias: aliasRef.current?.value,
            })
          }
          onCancel={() => void runCommand("importKeyPair", { cancel: true })}
        />
      }
    >
      <fieldset className="type-radios">
        <legend>Private Key Format</legend>
        <FormatRadio value="pkcs8" label="PKCS#8" defaultChecked />
        <FormatRadio value="pkcs12" label="PKCS#12" disabled />
        <FormatRadio value="openssl" label="OpenSSL" disabled />
      </fieldset>
      <DialogField id="dialog.import-key-pair.path" label="Key File" inputRef={pathRef} required />
      <DialogField id="dialog.import-key-pair.alias" label="Alias" inputRef={aliasRef} required />
    </FrameDialog>
  );
}

const ALIAS_TITLES: Record<string, string> = {
  generateKeyPair: "New Key Pair Entry Alias",
  generateSecretKey: "New Secret Key Entry Alias",
  storePassphrase: "New Passphrase Entry Alias",
  renameEntry: "New Entry Alias",
};

export function ImportAliasDialog() {
  const aliasRef = useRef<HTMLInputElement>(null);
  const intentCommand = currentIntent()?.command;
  const command = intentCommand && intentCommand !== "cancel" ? intentCommand : getPendingAliasCommand();
  const aliasField = command === "renameEntry" ? "newAlias" : "alias";
  return (
    <FrameDialog
      id="dialog.alias"
      title={ALIAS_TITLES[command] ?? "New Entry Alias"}
      open
      actions={
        <DialogButtons
          okTestId="dialog.alias.ok"
          cancelTestId="dialog.alias.cancel"
          onOk={() => void runCommand(command, { [aliasField]: aliasRef.current?.value })}
          onCancel={() => void runCommand(command, { cancel: true })}
        />
      }
    >
      <DialogField
        id="dialog.alias.value"
        testId="dialog.alias.value"
        label="Alias"
        inputRef={aliasRef}
        required
      />
    </FrameDialog>
  );
}

export function CertificatePreviewDialog() {
  const { selection, errorId } = useSession();
  return (
    <FrameDialog
      id="dialog.view-certificate"
      title="Certificate Details"
      open
      actions={
        <DialogButtons
          okTestId="dialog.view-certificate.ok"
          onOk={() => void runCommand("cancel")}
        />
      }
    >
      <p>Entry: {selection[0] ?? ""}</p>
      <p>{errorId ? `Problem: ${errorId}` : "X.509 certificate"}</p>
    </FrameDialog>
  );
}
