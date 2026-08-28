import { host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { str } from "./params";

export function readNamedBytes(params?: CommandParams): Uint8Array | undefined {
  const ref = str(params, "fixture") ?? str(params, "path");
  if (!ref) {
    return undefined;
  }
  const stored = host.vfsRead(ref);
  return stored ? new Uint8Array(stored) : undefined;
}
