import { runCommand } from "../../shell/registry";
import { CONFIRM_DIALOG } from "./dialog-ids";

/** Paste replace is Yes/No on an overlapping alias, not a generic cancel. */
export function PasteConfirmButtons() {
  return (
    <>
      <button
        type="button"
        data-testid={`${CONFIRM_DIALOG}.ok`}
        aria-label="OK"
        onClick={() => void runCommand("paste", { replaceExisting: true })}
      >
        OK
      </button>
      <button
        type="button"
        data-testid={`${CONFIRM_DIALOG}.cancel`}
        aria-label="Cancel"
        onClick={() => void runCommand("paste", { replaceExisting: false })}
      >
        Cancel
      </button>
    </>
  );
}

/** Read-only alias of the entry that would be replaced. Not a new control-id. */
export function OverlapAliasField({ aliases }: { aliases: readonly string[] }) {
  const value = aliases.join(", ");
  const id = "paste-replace-alias";
  return (
    <label className="field" htmlFor={id}>
      <span>Alias</span>
      <input
        id={id}
        readOnly
        value={value}
        autoComplete="off"
        spellCheck={false}
        aria-label="Alias"
      />
    </label>
  );
}
