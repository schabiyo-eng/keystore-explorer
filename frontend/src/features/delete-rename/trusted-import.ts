import { importTrustedCertificate as kernelImport } from "../../kernel";
import { getActive, host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { applyMutation, clearAbortable } from "./abortable";
import { namedFixture } from "./fixtures";
import { fail } from "./outcome";
import { flag, str } from "./params";

/**
 * Kernel import used by this slice's YAML `when` steps. Menu stays disabled;
 * the import slice owns Tools → Import Trusted Certificate.
 */
function bytesParam(params?: CommandParams): Uint8Array | undefined {
  const raw = params?.bytes;
  if (raw instanceof Uint8Array) {
    return raw;
  }
  const fixture = str(params, "fixture") ?? str(params, "path");
  if (!fixture) {
    return undefined;
  }
  return namedFixture(fixture) ?? host.vfsRead(fixture);
}

export async function importTrustedCertificate(params?: CommandParams): Promise<void> {
  clearAbortable();
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel") === true) {
    fail("cancelled");
    return;
  }
  const alias = str(params, "alias");
  const bytes = bytesParam(params);
  if (!alias || !bytes) {
    fail("invalidFile");
    return;
  }
  const result = await kernelImport(active.store, { bytes, alias });
  if (!result.ok) {
    fail(result.errorId);
    return;
  }
  applyMutation(result);
}
