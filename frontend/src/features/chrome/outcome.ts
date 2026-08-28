import { host } from "../../shell/session";
import type { SessionErrorId } from "../../shell/types";

/** Chrome may surface `networkError`; the shell union has not been extended yet. */
export type ChromeErrorId = SessionErrorId | "networkError";

export function fail(errorId: ChromeErrorId, dialog?: string): void {
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

export function show(dialog: string): void {
  host.clearError();
  host.openDialog(dialog);
}
