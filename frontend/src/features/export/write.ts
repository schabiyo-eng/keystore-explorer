import { pathHasMissingDir } from "../../shell/paths";
import { getActive, host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { fail, succeed } from "./outcome";
import { passwordOf } from "./params";

/**
 * Write exported bytes to the VFS only. Never call apply() — the open store
 * must stay clean after CSV / cert / key export.
 */
export function writeExportedFile(path: string, bytes: Uint8Array, password?: string): void {
  if (pathHasMissingDir(path)) {
    fail("notFound");
    return;
  }
  host.vfsWrite(path, bytes);
  if (password !== undefined) {
    host.recordWrites([{ path, bytes, password }]);
  }
  succeed();
}

export function requireExportPassword(
  params: CommandParams | undefined,
  dialog: string,
): string | undefined {
  const active = getActive();
  const password = passwordOf(params);
  if (password === undefined) {
    host.openDialog(dialog);
    return undefined;
  }
  if (active?.password !== undefined && password !== active.password) {
    fail("wrongPassword");
    return undefined;
  }
  return password;
}
