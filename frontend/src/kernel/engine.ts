import { Crypto } from "@peculiar/webcrypto";
import * as pkijs from "pkijs";

let installed = false;
let peculiar: Crypto | undefined;

/**
 * ARCH.md: pkijs + @peculiar/webcrypto in Node/Vitest.
 * Key generation still goes through SubtleCrypto on this engine.
 */
export function ensureCryptoEngine(): void {
  if (installed) {
    return;
  }

  peculiar = new Crypto();

  if (typeof process !== "undefined" && process.versions?.node) {
    Object.defineProperty(globalThis, "crypto", {
      value: peculiar,
      configurable: true,
    });
  }

  pkijs.setEngine(
    "peculiar",
    new pkijs.CryptoEngine({
      name: "peculiar",
      crypto: peculiar,
      subtle: peculiar.subtle,
    }),
  );
  installed = true;
}

export function getSubtle(): SubtleCrypto {
  ensureCryptoEngine();
  return pkijs.getCrypto(true);
}
