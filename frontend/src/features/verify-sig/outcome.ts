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

export function succeed(): void {
  host.clearError();
  host.closeDialog();
}

export function showDialog(id: string): void {
  host.clearError();
  host.openDialog(id);
}
