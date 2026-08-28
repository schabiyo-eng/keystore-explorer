import { getActive, getSelection } from "../../shell/session";
import { snapshotEntries, setBuffer } from "./buffer";
import { fail, succeed } from "./outcome";

/** Snapshot selection into the internal copy buffer. Store bytes stay put. */
export function copy(): void {
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  const aliases = getSelection();
  if (aliases.length === 0) {
    fail("emptySelection");
    return;
  }
  const entries = snapshotEntries(active.store, aliases);
  if (entries.length === 0) {
    fail("emptySelection");
    return;
  }
  setBuffer(entries, "copy");
  succeed();
}

export const copyKeyPair = copy;
export const copyTrustedCertificate = copy;
