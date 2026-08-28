import { getState } from "../../shell/session";
import { certificatesOf } from "./crypto";

export function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((byte, index) => byte === right[index]);
}

export function trustCerts(): Uint8Array[] {
  const certs: Uint8Array[] = [];
  for (const tab of getState().tabs) {
    for (const entry of tab.store.entries) {
      certs.push(...certificatesOf(entry));
    }
  }
  return certs;
}

export function isTrusted(signerCerts: Uint8Array[]): boolean {
  const trusted = trustCerts();
  return signerCerts.some((signer) => trusted.some((cert) => sameBytes(signer, cert)));
}
