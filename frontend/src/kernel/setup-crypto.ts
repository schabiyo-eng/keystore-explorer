import { Crypto } from "@peculiar/webcrypto";
import * as pkijs from "pkijs";
import { installWebCrypto } from "./crypto";

const peculiar = new Crypto();
Object.defineProperty(globalThis, "crypto", {
  value: peculiar,
  configurable: true,
});
const engine = new pkijs.CryptoEngine({
  name: "webcrypto",
  crypto: peculiar,
});
pkijs.setEngine("webcrypto", engine as unknown as pkijs.ICryptoEngine);

installWebCrypto();
