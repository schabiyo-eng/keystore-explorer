import { flag, str } from "../file/params";
import { findAlias, host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { hasActive } from "./active";
import { fail, succeed } from "./outcome";

export async function findCommand(params?: CommandParams): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  const query = str(params, "query");
  if (!query) {
    host.openDialog("dialog.find");
    return;
  }
  const alias = findAlias(query);
  if (!alias) {
    fail("notFound");
    return;
  }
  host.setSelection([alias]);
  succeed();
}
