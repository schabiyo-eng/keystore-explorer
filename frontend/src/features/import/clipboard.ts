import * as pkijs from "pkijs";
import { toArrayBuffer } from "../../kernel/bytes";
import { parseCertificates } from "../../kernel/keys";
import { host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { succeed } from "./outcome";
import { str } from "./params";

let osClipboard: Uint8Array | undefined;

export function resetClipboard(): void {
  osClipboard = undefined;
}

export function setOsClipboard(bytes: Uint8Array | undefined): void {
  osClipboard = bytes ? new Uint8Array(bytes) : undefined;
}

export function getOsClipboard(): Uint8Array | undefined {
  return osClipboard ? new Uint8Array(osClipboard) : undefined;
}

/** Oracle `clipboardContains.kind` for YAML then. */
export function clipboardKind(): "certificate" | "empty" {
  if (!osClipboard || osClipboard.byteLength === 0) {
    return "empty";
  }
  try {
    const certs = parseCertificates(osClipboard);
    for (const der of certs) {
      pkijs.Certificate.fromBER(toArrayBuffer(der));
    }
    return certs.length > 0 ? "certificate" : "empty";
  } catch {
    return "empty";
  }
}

export function setClipboardCommand(params?: CommandParams): void {
  const text = str(params, "text");
  if (text !== undefined) {
    setOsClipboard(new TextEncoder().encode(text));
    succeed();
    return;
  }
  const ref = str(params, "fixture") ?? str(params, "path");
  const stored = ref ? host.vfsRead(ref) : undefined;
  setOsClipboard(stored ? new Uint8Array(stored) : undefined);
  succeed();
}
