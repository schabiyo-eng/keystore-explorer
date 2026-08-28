import { getActive, host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { cancelCommand } from "./cancel";
import { commitStore } from "./commit";
import { removeCertificate } from "./kernel";
import { fail } from "./outcome";
import { flag } from "./params";
import { selectedKeyPair } from "./selection";
import { unlockSelected } from "./unlock";

export async function removeFromCertificateChain(params?: CommandParams): Promise<void> {
  if (flag(params, "cancel") === true || flag(params, "confirm") === false) {
    cancelCommand();
    return;
  }
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  const selected = selectedKeyPair();
  if (!selected) {
    fail("emptySelection");
    return;
  }
  if (!unlockSelected(params, selected.alias)) {
    return;
  }
  if (selected.entry.certificates.length < 2) {
    fail("chainTooShort");
    return;
  }
  if (flag(params, "confirm") !== true) {
    host.openDialog("dialog.confirm");
    return;
  }
  const current = getActive();
  if (!current) {
    fail("storeNotWritable");
    return;
  }
  const result = removeCertificate(current.store, selected.alias);
  if (!result.ok) {
    fail(result.errorId);
    return;
  }
  commitStore(result.store);
}
