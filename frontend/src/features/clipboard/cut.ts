import { getActive, getSelection } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { deleteEntry } from "../delete-rename/delete";
import { setBuffer, snapshotEntries } from "./buffer";
import { fail } from "./outcome";
import { flag } from "./params";

/**
 * Stage selection as a cut, then delete via the delete-rename command
 * so history/unlocked/selection stay in one place.
 */
export async function cut(params?: CommandParams): Promise<void> {
  if (flag(params, "cancel") === true) {
    fail("cancelled");
    return;
  }
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
  setBuffer(entries, "cut");
  await deleteEntry({ confirm: true });
}

export const cutKeyPair = cut;
export const cutTrustedCertificate = cut;
