import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { copyBytes, randomBytes, toArrayBuffer, toUint8 } from "./bytes";
import { installWebCrypto, getSubtle } from "./crypto";

export interface GeneratedKeyPair {
  pkcs8: Uint8Array;
  certificate: Uint8Array;
}

const CN_OID = "2.5.4.3";
const PEM_CERT = /-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/g;
const RSA_PARAMS: RsaHashedKeyGenParams = {
  name: "RSASSA-PKCS1-v1_5",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
};

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

function derFromPemBlock(b64: string): Uint8Array {
  const binary = atob(b64.replace(/\s+/g, ""));
  const der = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    der[i] = binary.charCodeAt(i);
  }
  return der;
}

/**
 * RSA key pair via Web Crypto SubtleCrypto, wrapped as a self-signed X.509 cert.
 */
export async function generateRsaKeyPair(
  alias: string,
  modulusLength = 2048,
): Promise<GeneratedKeyPair> {
  installWebCrypto();
  const subtle = getSubtle();
  const keys = await subtle.generateKey(
    { ...RSA_PARAMS, modulusLength },
    true,
    ["sign", "verify"],
  );

  const cert = new pkijs.Certificate();
  cert.version = 2;
  cert.serialNumber = serialNumber();
  cert.issuer.typesAndValues.push(commonName(alias));
  cert.subject.typesAndValues.push(commonName(alias));
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
  const certs = [...text.matchAll(PEM_CERT)].map((match) => derFromPemBlock(match[1] ?? ""));
  return certs.length > 0 ? certs : [copyBytes(bytes)];
}
