import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { randomBytes, toArrayBuffer, toUint8 } from "../../kernel/bytes";
import { getSubtle, installWebCrypto } from "../../kernel/crypto";
import { fail, ok } from "../../kernel/result";
import { appendEntry, hasAlias } from "../../kernel/store";
import type { KernelEntry, KernelResult, KeyStore } from "../../kernel";

const CN_OID = "2.5.4.3";
const RSA_PARAMS: RsaHashedKeyGenParams = {
  name: "RSASSA-PKCS1-v1_5",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
};
const PEM_PRIVATE_KEY = /-----BEGIN ([A-Z0-9 ]+PRIVATE KEY)-----([\s\S]*?)-----END \1-----/;

function derFromPemOrRaw(bytes: Uint8Array): Uint8Array | undefined {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const match = PEM_PRIVATE_KEY.exec(text);
  if (match?.[2]) {
    try {
      const binary = atob(match[2].replace(/\s+/g, ""));
      const der = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        der[i] = binary.charCodeAt(i);
      }
      return der;
    } catch {
      return undefined;
    }
  }
  return bytes.byteLength > 0 ? new Uint8Array(bytes) : undefined;
}

function commonName(alias: string): pkijs.AttributeTypeAndValue {
  return new pkijs.AttributeTypeAndValue({
    type: CN_OID,
    value: new asn1js.Utf8String({ value: alias }),
  });
}

function serialNumber(): asn1js.Integer {
  const serial = randomBytes(8);
  serial[0] &= 0x7f;
  if (serial[0] === 0) {
    serial[0] = 1;
  }
  return new asn1js.Integer({ valueHex: toArrayBuffer(serial) });
}

async function publicFromPrivate(privateKey: CryptoKey): Promise<CryptoKey> {
  const jwk = await getSubtle().exportKey("jwk", privateKey);
  const publicJwk: JsonWebKey = {
    kty: jwk.kty,
    n: jwk.n,
    e: jwk.e,
    alg: jwk.alg,
    ext: true,
    key_ops: ["verify"],
  };
  return getSubtle().importKey("jwk", publicJwk, RSA_PARAMS, true, ["verify"]);
}

/**
 * PKCS#8 (PEM or DER) → KEY_PAIR. Self-signed cert via the kernel Web Crypto stack
 * so save/reopen matches generateKeyPair bags. Not a second PKCS#12 library.
 */
async function wrapPkcs8(alias: string, pkcs8: Uint8Array): Promise<KernelEntry> {
  installWebCrypto();
  const subtle = getSubtle();
  const privateKey = await subtle.importKey("pkcs8", toArrayBuffer(pkcs8), RSA_PARAMS, true, [
    "sign",
  ]);
  const publicKey = await publicFromPrivate(privateKey);

  const cert = new pkijs.Certificate();
  cert.version = 2;
  cert.serialNumber = serialNumber();
  cert.issuer.typesAndValues.push(commonName(alias));
  cert.subject.typesAndValues.push(commonName(alias));
  const now = new Date();
  cert.notBefore.value = now;
  cert.notAfter.value = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  await cert.subjectPublicKeyInfo.importKey(publicKey);
  await cert.sign(privateKey, "SHA-256");

  return {
    alias,
    entryType: "KEY_PAIR",
    pkcs8: new Uint8Array(pkcs8),
    certificates: [toUint8(cert.toSchema().toBER(false))],
    localKeyId: randomBytes(20),
  };
}

/** Kernel-shaped command used by YAML `importKeyPair`. */
export async function importKeyPairIntoStore(
  store: KeyStore,
  params: { bytes: Uint8Array; alias: string },
): Promise<KernelResult> {
  if (hasAlias(store, params.alias)) {
    return fail("duplicateAlias", store);
  }
  const pkcs8 = derFromPemOrRaw(params.bytes);
  if (!pkcs8) {
    return fail("invalidFile", store);
  }
  try {
    const entry = await wrapPkcs8(params.alias, pkcs8);
    return ok(appendEntry(store, entry));
  } catch {
    return fail("invalidFile", store);
  }
}
