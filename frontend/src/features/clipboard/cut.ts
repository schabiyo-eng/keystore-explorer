import type { CommandParams } from "../../shell/types";
import { deleteEntry } from "../delete-rename/delete";
import { setBuffer } from "./buffer";
import { fail } from "./outcome";
import { flag } from "./params";
import { snapshotSelection } from "./selection";

/**
 * Stage selection as a cut, then delete via the delete-rename command
 * so history/unlocked/selection stay in one place.
 */
export async function cut(params?: CommandParams): Promise<void> {
  if (flag(params, "cancel") === true) {
    fail("cancelled");
    return;
  }
  const entries = snapshotSelection();
  if (!entries) {
    return;
  }
  setBuffer(entries, "cut");
  await deleteEntry({ confirm: true });
}

export const cutKeyPair = cut;
export const cutTrustedCertificate = cut;
