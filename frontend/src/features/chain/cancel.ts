import { setDetailsView } from "../details/view";
import { fail } from "./outcome";

/** YAML `cancel: {}` / dialog Cancel. Store bytes are unchanged (not dirty). */
export function cancelCommand(): void {
  setDetailsView(null);
  fail("cancelled");
}
