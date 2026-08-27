import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { ensureCryptoEngine, getSubtle } from "./engine";
import { randomBytes, toArrayBuffer, toUint8 } from "./pkcs12";

export interface GeneratedKeyPair {
  pkcs8: Uint8Array;
  certificate: Uint8Array;
}

/**
 * RSA key pair via Web Crypto SubtleCrypto, wrapped as a self-signed X.509 cert.
 */
export async function generateRsaKeyPair(
  alias: string,
  modulusLength = 2048,
): Promise<GeneratedKeyPair> {
  ensureCryptoEngine();
  const subtle = getSubtle();
  const keys = await subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );

  const cert = new pkijs.Certificate();
  cert.version = 2;
  const serial = randomBytes(8);
  serial[0] &= 0x7f;
  if (serial[0] === 0) {
    serial[0] = 1;
  }
  cert.serialNumber = new asn1js.Integer({ valueHex: toArrayBuffer(serial) });
  cert.issuer.typesAndValues.push(
    new pkijs.AttributeTypeAndValue({
      type: "2.5.4.3",
      value: new asn1js.Utf8String({ value: alias }),
    }),
  );
  cert.subject.typesAndValues.push(
    new pkijs.AttributeTypeAndValue({
      type: "2.5.4.3",
      value: new asn1js.Utf8String({ value: alias }),
    }),
  );
  const now = new Date();
  cert.notBefore.value = now;
  cert.notAfter.value = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  await cert.subjectPublicKeyInfo.importKey(keys.publicKey);
  await cert.sign(keys.privateKey, "SHA-256");

  const pkcs8 = await subtle.exportKey("pkcs8", keys.privateKey);
  return {
    pkcs8: toUint8(pkcs8),
    certificate: toUint8(cert.toSchema().toBER(false)),
  };
}

export function parseCertificates(bytes: Uint8Array): Uint8Array[] {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const pems: Uint8Array[] = [];
  const pemRe = /-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/g;
  let match = pemRe.exec(text);
  while (match) {
    const b64 = match[1].replace(/\s+/g, "");
    const binary = atob(b64);
    const der = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      der[i] = binary.charCodeAt(i);
    }
    pems.push(der);
    match = pemRe.exec(text);
  }
  if (pems.length > 0) {
    return pems;
  }
  return [new Uint8Array(bytes)];
}
