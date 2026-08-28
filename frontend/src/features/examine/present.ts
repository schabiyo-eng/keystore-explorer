import * as pkijs from "pkijs";
import { toArrayBuffer, toHex } from "../../kernel/bytes";
import {
  certificateDers,
  detectExaminedType,
  friendlyType,
  jwtParts,
  reportDialogFor,
  type ExaminedType,
} from "./detect";
import { fail, setExaminedType, show } from "./outcome";
import { setExamineView, type CertSummary, type ExamineView } from "./view";

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

function inspectCert(der: Uint8Array): CertSummary {
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

function inspectCsr(bytes: Uint8Array): ExamineView["fields"] {
  try {
    const csr = pkijs.CertificationRequest.fromBER(toArrayBuffer(bytes));
    return [
      { label: "Format:", value: "PKCS #10" },
      { label: "Subject:", value: rdn(csr.subject) },
    ];
  } catch {
    return [{ label: "Format:", value: "PKCS #10" }];
  }
}

function inspectCrl(bytes: Uint8Array): ExamineView["fields"] {
  try {
    const crl = pkijs.CertificateRevocationList.fromBER(toArrayBuffer(bytes));
    return [
      { label: "Issuer:", value: rdn(crl.issuer) },
      { label: "This Update:", value: crl.thisUpdate.value.toUTCString() },
    ];
  } catch {
    return [{ label: "Type:", value: "X.509 CRL" }];
  }
}

export function presentUnknown(dialog: "dialog.error" | "dialog.detect-file-type"): void {
  setExaminedType("unknown");
  setExamineView({
    title: dialog === "dialog.detect-file-type" ? "Cryptographic File Type" : "Examine File",
    dialog,
    message:
      dialog === "dialog.detect-file-type"
        ? `File type: ${friendlyType("unknown")}`
        : "The file is not a recognised cryptographic type.",
  });
  fail("invalidFile", dialog);
}

export function presentDetect(type: ExaminedType): void {
  setExaminedType(type);
  setExamineView({
    title: "Cryptographic File Type",
    dialog: "dialog.detect-file-type",
    message: `File type: ${friendlyType(type)}`,
  });
  if (type === "unknown") {
    fail("invalidFile", "dialog.detect-file-type");
    return;
  }
  show("dialog.detect-file-type");
}

export function presentBytes(bytes: Uint8Array, unknownDialog: "dialog.error" | "dialog.detect-file-type"): void {
  const type = detectExaminedType(bytes);
  if (type === "unknown") {
    presentUnknown(unknownDialog);
    return;
  }

  const dialog = reportDialogFor(type);
  if (!dialog) {
    presentUnknown(unknownDialog);
    return;
  }

  setExaminedType(type);

  if (type === "certificate") {
    const ders = certificateDers(bytes);
    setExamineView({
      title: "Certificate Details",
      dialog,
      certs: ders.map(inspectCert),
    });
    show(dialog);
    return;
  }

  if (type === "jwt") {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    setExamineView({
      title: "JSON Web Token Details",
      dialog,
      jwt: jwtParts(text),
    });
    show(dialog);
    return;
  }

  if (type === "csr") {
    setExamineView({
      title: "Certification Request Details",
      dialog,
      fields: inspectCsr(bytes),
    });
    show(dialog);
    return;
  }

  if (type === "crl") {
    setExamineView({
      title: "CRL Details",
      dialog,
      fields: inspectCrl(bytes),
    });
    show(dialog);
    return;
  }

  setExamineView({
    title: type === "pkcs12" ? "PKCS #12 Information" : friendlyType(type),
    dialog,
    message: friendlyType(type),
  });
  show(dialog);
}

export function presentCertificates(certs: Uint8Array[], title = "Certificate Details"): void {
  const ders = certs.flatMap((item) => certificateDers(item));
  if (ders.length === 0) {
    presentUnknown("dialog.error");
    return;
  }
  setExaminedType("certificate");
  setExamineView({
    title,
    dialog: "dialog.view-certificate",
    certs: ders.map(inspectCert),
  });
  show("dialog.view-certificate");
}
