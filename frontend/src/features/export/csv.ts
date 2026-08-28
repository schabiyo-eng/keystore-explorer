import { getActive, host, isLocked } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { encodeCsv } from "./encode";
import { CSV_DIALOG } from "./ids";
import { fail } from "./outcome";
import { cancelled, str } from "./params";
import { writeExportedFile } from "./write";

export async function exportCsv(params?: CommandParams): Promise<void> {
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  if (cancelled(params)) {
    fail("cancelled");
    return;
  }
  const path = str(params, "path");
  if (!path) {
    host.openDialog(CSV_DIALOG);
    return;
  }
  writeExportedFile(path, encodeCsv(active.store.entries, isLocked));
}
