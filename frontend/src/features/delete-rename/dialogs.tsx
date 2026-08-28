import { useRef } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";
import { useSession } from "../../shell/useSession";

/** Swing `DGetAlias` for rename. Same `dialog.alias` ids as generate/import. */
export function AliasDialog() {
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
            onClick={() =>
              void runCommand("renameEntry", { newAlias: aliasRef.current?.value })
            }
          >
            OK
          </button>
          <button
            type="button"
            data-testid="dialog.alias.cancel"
            onClick={() => void runCommand("renameEntry", { cancel: true })}
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
          defaultValue={current}
          autoComplete="off"
        />
      </label>
    </FrameDialog>
  );
}

export const dialogs = {
  "dialog.alias": AliasDialog,
};
