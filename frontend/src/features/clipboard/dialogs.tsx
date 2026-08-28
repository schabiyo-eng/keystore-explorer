import type { ComponentType } from "react";
import { FrameDialog } from "../../shell/FrameDialog";
import { runCommand } from "../../shell/registry";

/**
 * Replace-confirm chrome for paste. The File shell already hosts
 * `dialog.confirm`; this is the paste-specific OK/Cancel wiring for tests
 * and for modernize. Not registered under that id (delete-rename/session
 * also open the shell confirm).
 */
export function PasteReplaceDialog() {
  return (
    <FrameDialog
      id="dialog.confirm"
      title="Paste"
      open
      actions={
        <>
          <button
            type="button"
            data-testid="dialog.confirm.ok"
            aria-label="OK"
            onClick={() => void runCommand("paste", { replaceExisting: true })}
          >
            OK
          </button>
          <button
            type="button"
            data-testid="dialog.confirm.cancel"
            aria-label="Cancel"
            onClick={() => void runCommand("paste", { replaceExisting: false })}
          >
            Cancel
          </button>
        </>
      }
    >
      <p>An entry with this alias already exists. Replace it?</p>
    </FrameDialog>
  );
}

export const dialogs: Record<string, ComponentType> = {};
