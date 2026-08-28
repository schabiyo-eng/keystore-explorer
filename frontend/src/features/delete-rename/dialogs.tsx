import { useRef, type Ref } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import { useSession } from "../../shell/useSession";

function AliasField({
  inputRef,
  defaultValue,
}: {
  inputRef: Ref<HTMLInputElement>;
  defaultValue: string;
}) {
  return (
    <label className="field" htmlFor="dialog.alias.value">
      <span>Alias</span>
      <input
        id="dialog.alias.value"
        ref={inputRef}
        data-testid="dialog.alias.value"
        type="text"
        autoComplete="off"
        spellCheck={false}
        defaultValue={defaultValue}
        aria-required="true"
      />
    </label>
  );
}

/** Alias entry for rename. Shared `dialog.alias` ids from control-ids.md. */
export function RenameAliasDialog() {
  const aliasRef = useRef<HTMLInputElement>(null);
  const { selection } = useSession();
  const current = selection[0] ?? "";

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
            aria-label="OK"
            onClick={() => void runCommand("renameEntry", { newAlias: aliasRef.current?.value })}
          >
            OK
          </button>
          <button
            type="button"
            data-testid="dialog.alias.cancel"
            aria-label="Cancel"
            onClick={() => void runCommand("renameEntry", { cancel: true })}
          >
            Cancel
          </button>
        </>
      }
    >
      <AliasField inputRef={aliasRef} defaultValue={current} />
    </FrameDialog>
  );
}
