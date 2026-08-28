import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { toArrayBuffer, toHex } from "../../kernel/bytes";
import { DN_OIDS } from "./oids";

interface Asn1ValueBlock {
  valueHexView?: Uint8Array;
  value?: unknown[];
}

interface Asn1Object {
  valueBlock?: Asn1ValueBlock;
  getValue?: () => unknown;
  value?: unknown;
}

function asAsn1(value: unknown): Asn1Object | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  return value as Asn1Object;
}

export function hexView(value: unknown): Uint8Array | undefined {
  const view = asAsn1(value)?.valueBlock?.valueHexView;
  if (!view || view.byteLength === 0) {
    return undefined;
  }
  return new Uint8Array(view);
}

export function textValue(value: unknown): string {
  const obj = asAsn1(value);
  if (!obj) {
    return "";
  }
  if (typeof obj.getValue === "function") {
    const text = obj.getValue();
    if (typeof text === "string") {
      return text;
    }
  }
  return typeof obj.value === "string" ? obj.value : "";
}

export function formatHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ");
}

export function formatColonHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0").toUpperCase()).join(":");
}

export function integerDec(bytes: Uint8Array): string {
  const hex = toHex(bytes);
  if (!hex) {
    return "0";
  }
  return BigInt(`0x${hex}`).toString(10);
}

export function rdnToString(name: pkijs.RelativeDistinguishedNames): string {
  return name.typesAndValues
    .map((tv) => {
      const label = DN_OIDS[tv.type] ?? tv.type;
      return `${label}=${textValue(tv.value)}`;
    })
    .join(", ");
}

function modulusBitsFromInteger(bytes: Uint8Array | undefined): number | undefined {
  if (!bytes || bytes.byteLength === 0) {
    return undefined;
  }
  let length = bytes.byteLength;
  if (bytes[0] === 0) {
    length -= 1;
  }
  return length * 8;
}

export function rsaBitsFromSpki(spki: pkijs.PublicKeyInfo): number | undefined {
  try {
    const bits = hexView(spki.subjectPublicKey);
    if (!bits) {
      return undefined;
    }
    const asn1 = asn1js.fromBER(toArrayBuffer(bits));
    const seq = asAsn1(asn1.result);
    return modulusBitsFromInteger(hexView(seq?.valueBlock?.value?.[0]));
  } catch {
    return undefined;
  }
}

export function rsaBitsFromPkcs8(pkcs8: Uint8Array): number | undefined {
  try {
    const pki = pkijs.PrivateKeyInfo.fromBER(toArrayBuffer(pkcs8));
    const inner = hexView(pki.privateKey);
    if (!inner) {
      return undefined;
    }
    const asn1 = asn1js.fromBER(toArrayBuffer(inner));
    const seq = asAsn1(asn1.result);
    // RSAPrivateKey: version, modulus, publicExponent, ...
    return modulusBitsFromInteger(hexView(seq?.valueBlock?.value?.[1]));
  } catch {
    return undefined;
  }
}
