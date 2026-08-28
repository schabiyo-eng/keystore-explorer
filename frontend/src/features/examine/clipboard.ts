import type { CommandParams } from "../../shell/types";
import { host } from "../../shell/session";
import { detectExaminedType } from "./detect";
import { ERROR_DIALOG } from "./dialog-ids";
import { fail } from "./outcome";
import { cancelled, str } from "./params";
import { presentBytes } from "./present";

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

/** Oracle `clipboardContains.kind` (OS clipboard, not the cut/copy buffer). */
export function clipboardKind(): "certificate" | "jwt" | "csr" | "publicKey" | "empty" {
  if (!osClipboard || osClipboard.byteLength === 0) {
    return "empty";
  }
  const type = detectExaminedType(osClipboard);
  if (type === "certificate" || type === "jwt" || type === "csr" || type === "publicKey") {
    return type;
  }
  return "empty";
}

export function setClipboardCommand(params?: CommandParams): void {
  const text = str(params, "text");
  if (text !== undefined) {
    setOsClipboard(new TextEncoder().encode(text));
    return;
  }
  const ref = str(params, "fixture") ?? str(params, "path");
  const stored = ref ? host.vfsRead(ref) : undefined;
  setOsClipboard(stored ? new Uint8Array(stored) : undefined);
}

export async function examineClipboard(params?: CommandParams): Promise<void> {
  if (cancelled(params)) {
    fail("cancelled");
    return;
  }
  const bytes = getOsClipboard();
  if (!bytes || bytes.byteLength === 0) {
    presentBytes(new Uint8Array(), ERROR_DIALOG);
    return;
  }
  presentBytes(bytes, ERROR_DIALOG);
}
