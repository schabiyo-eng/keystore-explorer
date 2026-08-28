import type { KernelResult } from "../../kernel";
import { apply, host, pushHistory, undo } from "../../shell/session";
import { fail, markPendingUndo, takePendingUndo } from "./outcome";

/** Apply a kernel import result, then `apply(result)`. Cancel undoes a successful mutate. */
export function applyKernelResult(result: KernelResult): void {
  if (result.ok) {
    pushHistory();
    markPendingUndo(true);
  } else {
    markPendingUndo(false);
  }
  apply(result);
  if (!result.ok) {
    host.closeDialog();
  }
}

/** Schema driver primitive: dismiss the open dialog, or undo the last abortable mutate. */
export function cancelCommand(): void {
  if (takePendingUndo()) {
    undo();
  }
  fail("cancelled");
}
