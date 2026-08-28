import { useRef, useState } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import { lastDhParametersPem } from "./dh";
import { getDraft, pendingAliasCommand } from "./draft";
import { DialogField, DialogSelect, OkCancelButtons, RadioOption } from "./fields";

const KEY_PAIR_TYPES = [
  { id: "rsa", value: "RSA", label: "RSA", disabled: false },
  { id: "dsa", value: "DSA", label: "DSA", disabled: true },
  { id: "ec", value: "EC", label: "EC", disabled: true },
] as const;

const KEY_SIZES = ["2048", "3072", "4096"] as const;

export function GenerateKeyPairDialog() {
  const [algorithm, setAlgorithm] = useState("RSA");
  const [sizeChoice, setSizeChoice] = useState("2048");
  const [manualSize, setManualSize] = useState("2048");

  return (
    <FrameDialog
      id="dialog.generate-key-pair"
      title="Generate Key Pair"
      open
      actions={
        <OkCancelButtons
          dialogId="dialog.generate-key-pair"
          command="generateKeyPair"
          onOk={() => {
            const keySize =
              sizeChoice === "manual" ? Number(manualSize || "2048") : Number(sizeChoice);
            void runCommand("generateKeyPair", { algorithm, keySize });
          }}
        />
      }
    >
      <fieldset className="type-radios">
        <legend>Key Pair Type</legend>
        {KEY_PAIR_TYPES.map((option) => (
          <RadioOption
            key={option.id}
            name="generate-key-type"
            testId={`dialog.generate-key-pair.type.${option.id}`}
            value={option.value}
            label={option.label}
            checked={algorithm === option.value}
            disabled={option.disabled}
            onChange={setAlgorithm}
          />
        ))}
      </fieldset>
      <fieldset className="type-radios">
        <legend>Key Size</legend>
        {KEY_SIZES.map((size) => (
          <RadioOption
            key={size}
            name="generate-key-size"
            testId={`dialog.generate-key-pair.size.${size}`}
            value={size}
            label={size}
            checked={sizeChoice === size}
            onChange={setSizeChoice}
          />
        ))}
        <RadioOption
          name="generate-key-size"
          testId="dialog.generate-key-pair.size.manual"
          value="manual"
          label="Manual"
          checked={sizeChoice === "manual"}
          onChange={setSizeChoice}
        />
        <label className="field" htmlFor="generate-key-pair-manual-size">
          <span>Manual size</span>
          <input
            id="generate-key-pair-manual-size"
            type="number"
            min={512}
            step={64}
            value={manualSize}
            onChange={(event) => setManualSize(event.target.value)}
            aria-label="Manual key size"
          />
        </label>
      </fieldset>
    </FrameDialog>
  );
}

export function GenerateKeyPairCertDialog() {
  return (
    <FrameDialog
      id="dialog.generate-key-pair-cert"
      title="Generate Key Pair Certificate"
      open
      actions={
        <OkCancelButtons
          dialogId="dialog.generate-key-pair-cert"
          command="generateKeyPair"
          onOk={() => void runCommand("generateKeyPair", { fromCert: true })}
        />
      }
    >
      <p>Create a self-signed certificate for the new key pair.</p>
    </FrameDialog>
  );
}

export function GeneratingKeyPairDialog() {
  return (
    <FrameDialog id="dialog.generating-key-pair" title="Generating Key Pair" open>
      <p role="status">Generating key pair…</p>
    </FrameDialog>
  );
}

const ALIAS_TITLES = {
  generateKeyPair: "New Key Pair Entry Alias",
  generateSecretKey: "New Secret Key Entry Alias",
  storePassphrase: "New Passphrase Entry Alias",
} as const;

/** Alias entry for generate. `generateKeyPair.alias` is this same input (control-ids.md). */
export function GenerateAliasDialog() {
  const aliasRef = useRef<HTMLInputElement>(null);
  const draft = getDraft();
  const command = pendingAliasCommand();
  const isKeyPair = command === "generateKeyPair";
  const inputId = isKeyPair ? "generateKeyPair.alias" : "dialog.alias.value";

  return (
    <FrameDialog
      id="dialog.alias"
      title={ALIAS_TITLES[command]}
      open
      actions={
        <OkCancelButtons
          dialogId="dialog.alias"
          command={command}
          onOk={() => void runCommand(command, { alias: aliasRef.current?.value })}
        />
      }
    >
      <label className="field" htmlFor={inputId}>
        <span>Enter Alias:</span>
        <input
          id={inputId}
          ref={aliasRef}
          data-testid="dialog.alias.value"
          type="text"
          autoComplete="off"
          spellCheck={false}
          defaultValue={draft.alias}
          aria-required="true"
          aria-label="Alias"
        />
      </label>
    </FrameDialog>
  );
}

export function GenerateSecretKeyDialog() {
  const algRef = useRef<HTMLSelectElement>(null);
  const sizeRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id="dialog.generate-secret-key"
      title="Generate Secret Key"
      open
      actions={
        <OkCancelButtons
          dialogId="dialog.generate-secret-key"
          command="generateSecretKey"
          onOk={() =>
            void runCommand("generateSecretKey", {
              algorithm: algRef.current?.value ?? "AES",
              keySize: Number(sizeRef.current?.value ?? "256"),
            })
          }
        />
      }
    >
      <DialogSelect id="dialog.generate-secret-key.algorithm" label="Algorithm" selectRef={algRef} defaultValue="AES">
        <option value="AES">AES</option>
      </DialogSelect>
      <DialogField
        testId="dialog.generate-secret-key.size"
        label="Key Size"
        type="number"
        inputRef={sizeRef}
        defaultValue="256"
        required
      />
    </FrameDialog>
  );
}

export function GenerateDhParametersDialog() {
  const sizeRef = useRef<HTMLSelectElement>(null);
  return (
    <FrameDialog
      id="dialog.generate-dh-parameters"
      title="Generate DH Parameters"
      open
      actions={
        <OkCancelButtons
          dialogId="dialog.generate-dh-parameters"
          command="generateDhParameters"
          onOk={() =>
            void runCommand("generateDhParameters", {
              size: Number(sizeRef.current?.value ?? "2048"),
            })
          }
        />
      }
    >
      <DialogSelect id="dialog.generate-dh-parameters.size" label="Key Size" selectRef={sizeRef} defaultValue="2048">
        <option value="1024">1024</option>
        <option value="2048">2048</option>
      </DialogSelect>
      <p>Parameter generation uses the well-known MODP groups (RFC 3526 / RFC 2409).</p>
    </FrameDialog>
  );
}

export function GeneratingDhParametersDialog() {
  return (
    <FrameDialog id="dialog.generating-dh-parameters" title="Generating DH Parameters" open>
      <p role="status">Generating DH parameters…</p>
    </FrameDialog>
  );
}

export function ViewDhParametersDialog() {
  return (
    <FrameDialog
      id="dialog.view-dh-parameters"
      title="DH Parameters"
      open
      actions={
        <button
          type="button"
          data-testid="dialog.view-dh-parameters.ok"
          aria-label="OK"
          onClick={() => void runCommand("generateDhParameters", { dismiss: true })}
        >
          OK
        </button>
      }
    >
      <label className="field" htmlFor="dialog.view-dh-parameters.value">
        <span>Parameters</span>
        <textarea
          id="dialog.view-dh-parameters.value"
          readOnly
          rows={12}
          cols={48}
          spellCheck={false}
          aria-label="Parameters"
          value={lastDhParametersPem()}
        />
      </label>
    </FrameDialog>
  );
}

export function StorePassphraseDialog() {
  const valueRef = useRef<HTMLInputElement>(null);
  const aliasRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id="dialog.store-passphrase"
      title="Store Passphrase"
      open
      actions={
        <OkCancelButtons
          dialogId="dialog.store-passphrase"
          command="storePassphrase"
          onOk={() =>
            void runCommand("storePassphrase", {
              passphrase: valueRef.current?.value,
              alias: aliasRef.current?.value,
            })
          }
        />
      }
    >
      <DialogField
        testId="dialog.store-passphrase.value"
        label="Passphrase"
        type="password"
        inputRef={valueRef}
        required
      />
      <label className="field" htmlFor="store-passphrase-alias">
        <span>Alias</span>
        <input
          id="store-passphrase-alias"
          ref={aliasRef}
          type="text"
          autoComplete="off"
          spellCheck={false}
          aria-required="true"
          aria-label="Alias"
        />
      </label>
    </FrameDialog>
  );
}
