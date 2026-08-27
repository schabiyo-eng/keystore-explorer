import { Crypto } from "@peculiar/webcrypto";
import * as pkijs from "pkijs";

let installed = false;

/**
 * ARCH.md: one PKCS#12 stack — pkijs + @peculiar/webcrypto in Node/Vitest.
 * Key generation still goes through SubtleCrypto on this engine.
 */
export function installWebCrypto(): void {
  if (installed) {
    return;
  }

  const peculiar = new Crypto();

  if (typeof process !== "undefined" && process.versions?.node) {
    Object.defineProperty(globalThis, "crypto", {
      value: peculiar,
      configurable: true,
    });
  }

  const engine = new pkijs.CryptoEngine({
    name: "webcrypto",
    crypto: peculiar,
  });
  // DOM SubtleCrypto and @peculiar/webcrypto disagree on Ed25519/X25519 overloads.
  pkijs.setEngine("webcrypto", engine as unknown as pkijs.ICryptoEngine);
  installed = true;
}

export function getSubtle(): SubtleCrypto {
  installWebCrypto();
  return pkijs.getCrypto(true);
}
