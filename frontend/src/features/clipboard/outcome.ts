import { host } from "../../shell/session";
import type { SessionErrorId } from "../../shell/types";

/** `bufferEmpty` is a clipboard oracle; session typing only lists kernel ids. */
export type ClipboardErrorId = SessionErrorId | "bufferEmpty";

export function fail(errorId: ClipboardErrorId, dialog?: string): void {
  host.setError(errorId as SessionErrorId);
  if (dialog) {
    host.openDialog(dialog);
  } else {
    host.closeDialog();
  }
}

export function succeed(): void {
  host.clearError();
  host.closeDialog();
}
