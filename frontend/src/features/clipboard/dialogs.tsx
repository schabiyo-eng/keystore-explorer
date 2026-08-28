import { FrameDialog } from "../../shell/FrameDialog";
import { getActive } from "../../shell/session";
import { overlappingAliases } from "./buffer";
import { CONFIRM_DIALOG } from "./dialog-ids";
import { OverlapAliasField, PasteConfirmButtons } from "./fields";

/**
 * Replace-confirm chrome for paste. The File shell already hosts
 * `dialog.confirm`; this is the paste-specific OK/Cancel wiring and labeled
 * alias field. Not registered under that id (delete-rename/session also open
 * the shell confirm).
 */
export function PasteReplaceDialog() {
  const active = getActive();
  const aliases = active ? overlappingAliases(active.store) : [];
  const named = aliases[0];
  const message = named
    ? `The KeyStore already contains an entry called '${named}'. Would you like to replace the existing entry?`
    : "An entry with this alias already exists. Replace it?";

  return (
    <FrameDialog id={CONFIRM_DIALOG} title="Paste" open actions={<PasteConfirmButtons />}>
      {aliases.length > 0 ? <OverlapAliasField aliases={aliases} /> : null}
      <p>{message}</p>
    </FrameDialog>
  );
}
