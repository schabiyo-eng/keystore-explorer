import type { CommandSpec } from "../../shell/types";
import { cancelCommand } from "./abortable";
import { deleteEntry } from "./delete";
import { renameEntry } from "./rename";
import { hasSelection, hasSingleSelection, selectEntries } from "./selection";
import { importTrustedCertificate } from "./trusted-import";

export const commands: Record<string, CommandSpec> = {
  deleteEntry: { canExecute: hasSelection, run: deleteEntry },
  renameEntry: { canExecute: hasSingleSelection, run: renameEntry },
  cancel: { run: cancelCommand },
  selectEntries: { run: selectEntries },
  importTrustedCertificate: { canExecute: () => false, run: importTrustedCertificate },
};
