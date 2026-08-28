import * as pkijs from "pkijs";

let installed = false;

/**
 * ARCH.md: one PKCS#12 stack — pkijs over SubtleCrypto.
 * Vitest/Node injects @peculiar/webcrypto onto globalThis.crypto in setup-crypto.ts.
 * The browser uses native SubtleCrypto; do not import @peculiar/webcrypto here
 * (it touches node:buffer and crashes Vite client bundles).
 */
export function installWebCrypto(): void {
  if (installed) {
    return;
  }

  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.subtle) {
    throw new Error("WebCrypto SubtleCrypto is required");
  }

  const engine = new pkijs.CryptoEngine({
    name: "webcrypto",
    crypto: cryptoObj,
  });
  pkijs.setEngine("webcrypto", engine as unknown as pkijs.ICryptoEngine);
  installed = true;
}

export function getSubtle(): SubtleCrypto {
  installWebCrypto();
  return pkijs.getCrypto(true);
}
