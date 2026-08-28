import { useRef, type Ref } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import { lastDhParametersPem } from "./commands";
import { getDraft } from "./draft";

function Field({
  testId,
  label,
  type = "text",
  inputRef,
  defaultValue,
}: {
  testId: string;
  label: string;
  type?: "text" | "password" | "number";
  inputRef?: Ref<HTMLInputElement>;
  defaultValue?: string;
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
        defaultValue={defaultValue}
      />
    </label>
  );
}

function selectedRadio(name: string): string | undefined {
  const node = document.querySelector(`input[name="${name}"]:checked`);
  return node instanceof HTMLInputElement ? node.value : undefined;
}

export function GenerateKeyPairDialog() {
  const manualRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id="dialog.generate-key-pair"
      title="Generate Key Pair"
      open
      actions={
        <>
          <button
            type="button"
            data-testid="dialog.generate-key-pair.ok"
            onClick={() => {
              const sizeChoice = selectedRadio("generate-key-size");
              const keySize =
                sizeChoice === "manual"
                  ? Number(manualRef.current?.value ?? "2048")
                  : Number(sizeChoice ?? "2048");
              void runCommand("generateKeyPair", {
                algorithm: selectedRadio("generate-key-type") ?? "RSA",
                keySize,
              });
            }}
          >
            OK
          </button>
          <button
            type="button"
            data-testid="dialog.generate-key-pair.cancel"
            onClick={() => void runCommand("generateKeyPair", { cancel: true })}
          >
            Cancel
          </button>
        </>
      }
    >
      <fieldset className="type-radios">
        <legend>Key Pair Type</legend>
        <label>
          <input
            type="radio"
            name="generate-key-type"
            data-testid="dialog.generate-key-pair.type.rsa"
            value="RSA"
            defaultChecked
          />
          RSA
        </label>
        <label>
          <input
            type="radio"
            name="generate-key-type"
            data-testid="dialog.generate-key-pair.type.dsa"
            value="DSA"
            disabled
          />
          DSA
        </label>
        <label>
          <input
            type="radio"
            name="generate-key-type"
            data-testid="dialog.generate-key-pair.type.ec"
            value="EC"
            disabled
          />
          EC
        </label>
      </fieldset>
      <fieldset className="type-radios">
        <legend>Key Size</legend>
        <label>
          <input
            type="radio"
            name="generate-key-size"
            data-testid="dialog.generate-key-pair.size.2048"
            value="2048"
            defaultChecked
          />
          2048
        </label>
        <label>
          <input
            type="radio"
            name="generate-key-size"
            data-testid="dialog.generate-key-pair.size.3072"
            value="3072"
          />
          3072
        </label>
        <label>
          <input
            type="radio"
            name="generate-key-size"
            data-testid="dialog.generate-key-pair.size.4096"
            value="4096"
          />
          4096
        </label>
        <label>
          <input
            type="radio"
            name="generate-key-size"
            data-testid="dialog.generate-key-pair.size.manual"
            value="manual"
          />
          Manual
        </label>
        <input ref={manualRef} type="number" min={512} step={64} defaultValue={2048} />
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
        <>
          <button
            type="button"
            data-testid="dialog.generate-key-pair-cert.ok"
            onClick={() => void runCommand("generateKeyPair", { fromCert: true })}
          >
            OK
          </button>
          <button
            type="button"
            data-testid="dialog.generate-key-pair-cert.cancel"
            onClick={() => void runCommand("generateKeyPair", { cancel: true })}
          >
            Cancel
          </button>
        </>
      }
    >
      <p>Create a self-signed certificate for the new key pair.</p>
    </FrameDialog>
  );
}

export function GeneratingKeyPairDialog() {
  return (
    <FrameDialog id="dialog.generating-key-pair" title="Generating Key Pair" open>
      <p>Generating key pair…</p>
    </FrameDialog>
  );
}

export function AliasDialog() {
  const aliasRef = useRef<HTMLInputElement>(null);
  const draft = getDraft();
  const command = draft.passphrase
    ? "storePassphrase"
    : draft.algorithm === "AES"
      ? "generateSecretKey"
      : "generateKeyPair";
  return (
    <FrameDialog
      id="dialog.alias"
      title="Alias"
      open
      actions={
        <>
          <button
            type="button"
            data-testid="dialog.alias.ok"
            onClick={() => void runCommand(command, { alias: aliasRef.current?.value })}
          >
            OK
          </button>
          <button
            type="button"
            data-testid="dialog.alias.cancel"
            onClick={() => void runCommand(command, { cancel: true })}
          >
            Cancel
          </button>
        </>
      }
    >
      <span data-testid={command === "generateKeyPair" ? "generateKeyPair.alias" : undefined}>
        <label className="field" htmlFor="generateKeyPair.alias">
          <span>Alias</span>
          <input
            id="generateKeyPair.alias"
            ref={aliasRef}
            data-testid="dialog.alias.value"
            autoComplete="off"
            defaultValue={draft.alias}
          />
        </label>
      </span>
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
        <>
          <button
            type="button"
            data-testid="dialog.generate-secret-key.ok"
            onClick={() =>
              void runCommand("generateSecretKey", {
                algorithm: algRef.current?.value ?? "AES",
                keySize: Number(sizeRef.current?.value ?? "256"),
              })
            }
          >
            OK
          </button>
          <button
            type="button"
            data-testid="dialog.generate-secret-key.cancel"
            onClick={() => void runCommand("generateSecretKey", { cancel: true })}
          >
            Cancel
          </button>
        </>
      }
    >
      <label className="field" htmlFor="dialog.generate-secret-key.algorithm">
        <span>Algorithm</span>
        <select id="dialog.generate-secret-key.algorithm" ref={algRef} defaultValue="AES">
          <option value="AES">AES</option>
        </select>
      </label>
      <Field
        testId="dialog.generate-secret-key.size"
        label="Key Size"
        type="number"
        inputRef={sizeRef}
        defaultValue="256"
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
        <>
          <button
            type="button"
            data-testid="dialog.generate-dh-parameters.ok"
            onClick={() =>
              void runCommand("generateDhParameters", {
                size: Number(sizeRef.current?.value ?? "2048"),
              })
            }
          >
            OK
          </button>
          <button
            type="button"
            data-testid="dialog.generate-dh-parameters.cancel"
            onClick={() => void runCommand("generateDhParameters", { cancel: true })}
          >
            Cancel
          </button>
        </>
      }
    >
      <label className="field" htmlFor="dialog.generate-dh-parameters.size">
        <span>Key Size</span>
        <select id="dialog.generate-dh-parameters.size" ref={sizeRef} defaultValue="2048">
          <option value="1024">1024</option>
          <option value="2048">2048</option>
        </select>
      </label>
      <p>Parameter generation uses the well-known MODP groups (RFC 3526 / RFC 2409).</p>
    </FrameDialog>
  );
}

export function GeneratingDhParametersDialog() {
  return (
    <FrameDialog id="dialog.generating-dh-parameters" title="Generating DH Parameters" open>
      <p>Generating DH parameters…</p>
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
        <>
          <button
            type="button"
            data-testid="dialog.store-passphrase.ok"
            onClick={() =>
              void runCommand("storePassphrase", {
                passphrase: valueRef.current?.value,
                alias: aliasRef.current?.value,
              })
            }
          >
            OK
          </button>
          <button
            type="button"
            data-testid="dialog.store-passphrase.cancel"
            onClick={() => void runCommand("storePassphrase", { cancel: true })}
          >
            Cancel
          </button>
        </>
      }
    >
      <Field
        testId="dialog.store-passphrase.value"
        label="Passphrase"
        type="password"
        inputRef={valueRef}
      />
      <Field testId="dialog.store-passphrase.alias" label="Alias" inputRef={aliasRef} />
    </FrameDialog>
  );
}
