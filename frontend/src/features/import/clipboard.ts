import { parseCertificates } from "../../kernel/keys";
import { toArrayBuffer } from "../../kernel/bytes";
import * as pkijs from "pkijs";

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
