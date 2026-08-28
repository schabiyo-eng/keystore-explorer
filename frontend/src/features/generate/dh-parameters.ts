import { host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { dhParametersPem, forgetDhParametersPem, rememberDhParametersPem } from "./dh";
import { absorbParams, clearDraft, getDraft } from "./draft";
import { hasActive } from "./gate";
import { fail, succeed } from "./outcome";
import { flag } from "./params";

export async function generateDhParametersCommand(params?: CommandParams): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    clearDraft();
    forgetDhParametersPem();
    fail("cancelled");
    return;
  }
  if (flag(params, "dismiss")) {
    clearDraft();
    succeed();
    return;
  }

  absorbParams(params);
  const size = getDraft().size;
  if (size === undefined) {
    host.openDialog("dialog.generate-dh-parameters");
    return;
  }

  const pem = dhParametersPem(size);
  if (!pem) {
    fail("unsupportedType");
    return;
  }
  rememberDhParametersPem(pem);
  host.clearError();
  host.openDialog("dialog.view-dh-parameters");
}
