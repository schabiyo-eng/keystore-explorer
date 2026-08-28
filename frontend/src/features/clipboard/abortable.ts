import type { KernelResult } from "../../kernel";
import { apply, pushHistory, undo } from "../../shell/session";
import { fail } from "./outcome";

type KernelOk = Extract<KernelResult, { ok: true }>;

let abortableMutation = false;

export function clearAbortable(): void {
  abortableMutation = false;
}

export function applyMutation(result: KernelOk): void {
  pushHistory();
  apply(result);
  abortableMutation = true;
}

export function cancelCommand(): void {
  if (abortableMutation) {
    undo();
    clearAbortable();
  }
  fail("cancelled");
}
