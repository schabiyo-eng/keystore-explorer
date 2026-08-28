import { host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { str } from "./params";

/** Schema driver primitive: switch the active keystore tab. */
export function selectTab(params?: CommandParams): void {
  const id = str(params, "id");
  if (!id) {
    return;
  }
  host.setActive(id);
}
