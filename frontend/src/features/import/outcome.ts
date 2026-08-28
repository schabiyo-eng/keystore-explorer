import { host } from "../../shell/session";
import type { SessionErrorId } from "../../shell/types";

/** True when the last import mutated the store and cancel should undo. */
let pendingUndo = false;

export function markPendingUndo(value: boolean): void {
  pendingUndo = value;
}

export function takePendingUndo(): boolean {
  const value = pendingUndo;
  pendingUndo = false;
  return value;
}

export function resetImportOutcome(): void {
  pendingUndo = false;
}

export function fail(errorId: SessionErrorId, dialog?: string): void {
  markPendingUndo(false);
  host.setError(errorId);
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
