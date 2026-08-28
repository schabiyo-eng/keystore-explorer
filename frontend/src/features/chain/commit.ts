import { ok } from "../../kernel/result";
import type { KeyStore } from "../../kernel/types";
import { apply, pushHistory } from "../../shell/session";
import { succeed } from "./outcome";

/** History snapshot, then `apply(result)` for a successful chain mutation. */
export function commitStore(store: KeyStore): void {
  pushHistory();
  apply(ok(store));
  succeed();
}
