import { clearDraft } from "./draft";
import { forgetDhParametersPem } from "./dh";
import { fail } from "./outcome";

export async function cancelCommand(): Promise<void> {
  clearDraft();
  forgetDhParametersPem();
  fail("cancelled");
}
