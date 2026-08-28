import * as pkijs from "pkijs";
import { toArrayBuffer, toHex } from "../../kernel/bytes";
import { decodeCryptoBytes } from "./decode";
import type { CertSummary, FieldRow } from "./view";

function firstDer(bytes: Uint8Array): Uint8Array {
  return decodeCryptoBytes(bytes)[0] ?? bytes;
}

function rdn(name: pkijs.RelativeDistinguishedNames): string {
  return name.typesAndValues
    .map((tv) => {
      const value = tv.value as { getValue?: () => unknown; value?: unknown };
      const text =
        typeof value.getValue === "function" ? String(value.getValue() ?? "") : String(value.value ?? "");
      return `${tv.type}=${text}`;
    })
    .join(", ");
}

export function inspectCert(der: Uint8Array): CertSummary {
  const cert = pkijs.Certificate.fromBER(toArrayBuffer(der));
  const serialView = (
    cert.serialNumber as { valueBlock?: { valueHexView?: Uint8Array } }
  ).valueBlock?.valueHexView;
  const serial = serialView && serialView.byteLength > 0 ? toHex(new Uint8Array(serialView)) : "";
  return {
    subject: rdn(cert.subject),
    issuer: rdn(cert.issuer),
    serial: serial ? `0x${serial.toUpperCase()}` : "",
    validFrom: cert.notBefore.value.toUTCString(),
    validUntil: cert.notAfter.value.toUTCString(),
  };
}

export function inspectCsr(bytes: Uint8Array): FieldRow[] {
  try {
    const csr = pkijs.CertificationRequest.fromBER(toArrayBuffer(firstDer(bytes)));
    return [
      { label: "Format:", value: "PKCS #10" },
      { label: "Subject:", value: rdn(csr.subject) },
    ];
  } catch {
    return [{ label: "Format:", value: "PKCS #10" }];
  }
}

export function inspectCrl(bytes: Uint8Array): FieldRow[] {
  try {
    const crl = pkijs.CertificateRevocationList.fromBER(toArrayBuffer(firstDer(bytes)));
    return [
      { label: "Issuer:", value: rdn(crl.issuer) },
      { label: "This Update:", value: crl.thisUpdate.value.toUTCString() },
    ];
  } catch {
    return [{ label: "Type:", value: "X.509 CRL" }];
  }
}
