import { fail } from "./outcome";

export function cancelCommand(): void {
  fail("cancelled");
}
