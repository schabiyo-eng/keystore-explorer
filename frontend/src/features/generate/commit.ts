import type { KernelResult, KeyStore } from "../../kernel";
import { apply, getActive, pushHistory } from "../../shell/session";
import { clearDraft } from "./draft";
import { fail } from "./outcome";

export async function commitGeneratedEntry(
  run: (store: KeyStore) => Promise<KernelResult>,
): Promise<void> {
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  const result = await run(active.store);
  if (!result.ok) {
    clearDraft();
    fail(result.errorId);
    return;
  }
  pushHistory();
  apply(result);
  clearDraft();
}
