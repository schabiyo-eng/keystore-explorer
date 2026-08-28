import { getActive } from "../../shell/session";

export function hasActive(): boolean {
  return getActive() !== null;
}

/** Generate is available on any open PKCS#12 tab, including a new untitled store. */
export function canGenerate(): boolean {
  return hasActive();
}
