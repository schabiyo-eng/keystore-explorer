import { host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { str } from "../file/params";
import { getOsClipboard } from "./clipboard";

export function paramRef(params: CommandParams | undefined): string | undefined {
  return str(params, "path") ?? str(params, "fixture");
}

/** Bytes from the session VFS (YAML fixtures are seeded as named paths). */
export function readStoreBytes(ref: string | undefined): Uint8Array | undefined {
  if (!ref) {
    return undefined;
  }
  const bytes = host.vfsRead(ref);
  return bytes ? new Uint8Array(bytes) : undefined;
}

export function readImportBytes(
  params: CommandParams | undefined,
  fromClipboard: boolean,
): Uint8Array | undefined {
  if (fromClipboard) {
    return getOsClipboard();
  }
  return readStoreBytes(paramRef(params));
}
