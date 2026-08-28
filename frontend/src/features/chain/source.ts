import { host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { str } from "./params";

/** Bytes from the session VFS. YAML seeds `cert-pem` and export writes `chain/ca.cer`. */
export function readChainBytes(params: CommandParams | undefined): Uint8Array | undefined {
  const ref = str(params, "fixture") ?? str(params, "path");
  if (!ref) {
    return undefined;
  }
  const bytes = host.vfsRead(ref);
  return bytes ? new Uint8Array(bytes) : undefined;
}
