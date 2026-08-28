import { setBuffer } from "./buffer";
import { succeed } from "./outcome";
import { snapshotSelection } from "./selection";

/** Snapshot selection into the internal copy buffer. Store bytes stay put. */
export function copy(): void {
  const entries = snapshotSelection();
  if (!entries) {
    return;
  }
  setBuffer(entries, "copy");
  succeed();
}

export const copyKeyPair = copy;
export const copyTrustedCertificate = copy;
