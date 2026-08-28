import type { KernelResult } from "../../kernel";
import { apply, pushHistory, undo } from "../../shell/session";
import { fail } from "./outcome";

type KernelOk = Extract<KernelResult, { ok: true }>;

/** True after a mutating abortable command so YAML `cancel: {}` can roll it back. */
let abortableMutation = false;

export function clearAbortable(): void {
  abortableMutation = false;
}

export function applyMutation(result: KernelOk): void {
  pushHistory();
  apply(result);
  abortableMutation = true;
}

/** Schema driver primitive: dismiss the open dialog, or undo the last abortable mutate. */
export function cancelCommand(): void {
  if (abortableMutation) {
    undo();
    clearAbortable();
  }
  fail("cancelled");
}
