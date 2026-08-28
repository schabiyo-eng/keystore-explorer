import { host } from "../../shell/session";
import type { SessionErrorId } from "../../shell/types";

/** YAML oracles plus chain-only `selfSigned` / `chainTooShort` from ORACLES.md. */
export type ChainErrorId = SessionErrorId | "selfSigned" | "chainTooShort";

export function fail(errorId: ChainErrorId, dialog?: string): void {
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
