import { host } from "../../shell/session";
import type { SessionErrorId } from "../../shell/types";
import type { ExaminedType } from "./detect";

/** Kernel session errors plus examine SSL `networkError`. */
export type ExamineErrorId = SessionErrorId | "networkError";

let lastType: ExaminedType | undefined;

export function examinedType(): ExaminedType | undefined {
  return lastType;
}

export function setExaminedType(type: ExaminedType | undefined): void {
  lastType = type;
}

export function fail(errorId: ExamineErrorId, dialog?: string): void {
  host.setError(errorId as SessionErrorId);
  if (dialog) {
    host.openDialog(dialog);
  } else {
    host.closeDialog();
  }
}

/** Keep a report dialog open; do not `apply()` or close the host. */
export function show(dialog: string): void {
  host.clearError();
  host.openDialog(dialog);
}

export function resetExamineOutcome(): void {
  lastType = undefined;
}
