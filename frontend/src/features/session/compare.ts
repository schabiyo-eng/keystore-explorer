import { flag } from "../file/params";
import { host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { hasActive, selectedAliases } from "./active";
import { fail, succeed } from "./outcome";

export async function compareCertificate(params?: CommandParams): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "dismiss")) {
    succeed();
    return;
  }
  if (selectedAliases().length < 2) {
    fail("emptySelection");
    return;
  }
  host.clearError();
  host.openDialog("dialog.compare-certificates");
}

export const compareCommands = {
  compareCertificate: {
    canExecute: () => hasActive() && selectedAliases().length >= 2,
    run: compareCertificate,
  },
} as const;
