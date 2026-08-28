import * as pkijs from "pkijs";
import { stringToArrayBuffer } from "pvutils";
import { installWebCrypto } from "./crypto";

export function passwordBuffer(password: string): ArrayBuffer {
  return stringToArrayBuffer(password);
}

export function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

export function toUint8(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer.slice(0));
}

export function copyBytes(bytes: Uint8Array): Uint8Array {
  return new Uint8Array(bytes);
}

export function randomBytes(length: number): Uint8Array {
  installWebCrypto();
  const view = new Uint8Array(length);
  pkijs.getRandomValues(view);
  return view;
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function asList<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}
