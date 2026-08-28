import { host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { ERROR_DIALOG, FILE_OPEN_DIALOG } from "./dialog-ids";
import { fail } from "./outcome";
import { cancelled } from "./params";
import { presentBytes } from "./present";
import { readNamedBytes } from "./source";

export async function examineFile(params?: CommandParams): Promise<void> {
  if (cancelled(params)) {
    fail("cancelled");
    return;
  }
  const bytes = readNamedBytes(params);
  if (!bytes) {
    host.openDialog(FILE_OPEN_DIALOG);
    return;
  }
  presentBytes(bytes, ERROR_DIALOG);
}
