import type { CommandParams } from "../../shell/types";
import { CHECK_UPDATE_DIALOG, PROBLEM_DIALOG } from "./dialog-ids";
import { fail, show, succeed } from "./outcome";
import { flag } from "./params";
import { fetchLatest, setUpdateResult, updateResultMessage } from "./update";

/** Uses the injected version fixture in tests; never hits a live update server from YAML. */
export async function checkUpdateCommand(params?: CommandParams): Promise<void> {
  if (flag(params, "dismiss")) {
    succeed();
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  try {
    const latest = await fetchLatest();
    setUpdateResult(updateResultMessage(latest));
    show(CHECK_UPDATE_DIALOG);
  } catch {
    fail("networkError", PROBLEM_DIALOG);
  }
}
