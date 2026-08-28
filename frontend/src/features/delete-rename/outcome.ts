import { host } from "../../shell/session";
import type { SessionErrorId } from "../../shell/types";

export function fail(errorId: SessionErrorId, dialog?: string): void {
  host.setError(errorId);
  if (dialog) {
    host.openDialog(dialog);
  } else {
    host.closeDialog();
  }
}
