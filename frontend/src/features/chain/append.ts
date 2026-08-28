import { getActive, host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { cancelCommand } from "./cancel";
import { commitStore } from "./commit";
import { appendCertificate, isSelfSignedCert } from "./kernel";
import { fail } from "./outcome";
import { flag } from "./params";
import { selectedKeyPair } from "./selection";
import { readChainBytes } from "./source";
import { unlockSelected } from "./unlock";

export async function appendToCertificateChain(params?: CommandParams): Promise<void> {
  if (flag(params, "cancel") === true) {
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
  const last = selected.entry.certificates[selected.entry.certificates.length - 1];
  if (!last || (await isSelfSignedCert(last))) {
    fail("selfSigned");
    return;
  }
  const bytes = readChainBytes(params);
  if (!bytes) {
    host.openDialog("dialog.file-open");
    return;
  }
  const current = getActive();
  if (!current) {
    fail("storeNotWritable");
    return;
  }
  const result = await appendCertificate(current.store, selected.alias, bytes);
  if (!result.ok) {
    fail(result.errorId);
    return;
  }
  commitStore(result.store);
}
