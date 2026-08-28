import { useRef } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import { useSession } from "../../shell/useSession";

export function ImportKeyPairDialog() {
  const pathRef = useRef<HTMLInputElement>(null);
  const aliasRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id="dialog.import-key-pair"
      title="Import Key Pair"
      open
      actions={
        <>
          <button
            type="button"
            data-testid="dialog.import-key-pair.ok"
            onClick={() =>
              void runCommand("importKeyPair", {
                path: pathRef.current?.value,
                alias: aliasRef.current?.value,
              })
            }
          >
            OK
          </button>
          <button
            type="button"
            data-testid="dialog.import-key-pair.cancel"
            onClick={() => void runCommand("importKeyPair", { cancel: true })}
          >
            Cancel
          </button>
        </>
      }
    >
      <fieldset className="type-radios">
        <legend>Private Key Format</legend>
        <label>
          <input type="radio" name="import-key-format" defaultChecked />
          PKCS#8
        </label>
        <label>
          <input type="radio" name="import-key-format" disabled />
          PKCS#12
        </label>
        <label>
          <input type="radio" name="import-key-format" disabled />
          OpenSSL
        </label>
      </fieldset>
      <label className="field">
        <span>Private Key File</span>
        <input ref={pathRef} type="text" />
      </label>
      <label className="field">
        <span>Certificate / alias</span>
        <input ref={aliasRef} type="text" />
      </label>
    </FrameDialog>
  );
}

export function AliasDialog() {
  const aliasRef = useRef<HTMLInputElement>(null);
  return (
    <FrameDialog
      id="dialog.alias"
      title="New Entry Alias"
      open
      actions={
        <>
          <button
            type="button"
            data-testid="dialog.alias.ok"
            onClick={() =>
              void runCommand("importTrustedCertificate", { alias: aliasRef.current?.value })
            }
          >
            OK
          </button>
          <button
            type="button"
            data-testid="dialog.alias.cancel"
            onClick={() => void runCommand("cancel")}
          >
            Cancel
          </button>
        </>
      }
    >
      <label className="field" htmlFor="dialog.alias.value">
        <span>Alias</span>
        <input
          id="dialog.alias.value"
          ref={aliasRef}
          data-testid="dialog.alias.value"
          type="text"
          autoComplete="off"
        />
      </label>
    </FrameDialog>
  );
}

export function ViewCertificateDialog() {
  const { selection, errorId } = useSession();
  return (
    <FrameDialog
      id="dialog.view-certificate"
      title="Certificate Details"
      open
      actions={
        <button
          type="button"
          data-testid="dialog.view-certificate.ok"
          onClick={() => void runCommand("cancel")}
        >
          OK
        </button>
      }
    >
      <p>Entry: {selection[0] ?? ""}</p>
      <p>{errorId ? `Problem: ${errorId}` : "X.509 certificate"}</p>
    </FrameDialog>
  );
}
