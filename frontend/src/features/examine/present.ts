import { decodeText } from "./decode";
import {
  DETECT_FILE_TYPE_DIALOG,
  ERROR_DIALOG,
  PKCS12_INFO_DIALOG,
  VIEW_CERTIFICATE_DIALOG,
  VIEW_CRL_DIALOG,
  VIEW_CSR_DIALOG,
  VIEW_JWT_DIALOG,
  VIEW_PRIVATE_KEY_DIALOG,
  VIEW_PUBLIC_KEY_DIALOG,
} from "./dialog-ids";
import {
  certificateDers,
  detectExaminedType,
  friendlyType,
  reportDialogFor,
  type ExaminedType,
} from "./detect";
import { inspectCert, inspectCrl, inspectCsr } from "./inspect";
import { jwtParts } from "./jwt";
import { fail, setExaminedType, show } from "./outcome";
import { setExamineView } from "./view";

export function presentUnknown(dialog: typeof ERROR_DIALOG | typeof DETECT_FILE_TYPE_DIALOG): void {
  setExaminedType("unknown");
  setExamineView({
    title: dialog === DETECT_FILE_TYPE_DIALOG ? "Cryptographic File Type" : "Examine File",
    dialog,
    message:
      dialog === DETECT_FILE_TYPE_DIALOG
        ? `File type: ${friendlyType("unknown")}`
        : "The file is not a recognised cryptographic type.",
  });
  fail("invalidFile", dialog);
}

export function presentDetect(type: ExaminedType): void {
  setExaminedType(type);
  setExamineView({
    title: "Cryptographic File Type",
    dialog: DETECT_FILE_TYPE_DIALOG,
    message: `File type: ${friendlyType(type)}`,
  });
  if (type === "unknown") {
    fail("invalidFile", DETECT_FILE_TYPE_DIALOG);
    return;
  }
  show(DETECT_FILE_TYPE_DIALOG);
}

export function presentBytes(
  bytes: Uint8Array,
  unknownDialog: typeof ERROR_DIALOG | typeof DETECT_FILE_TYPE_DIALOG,
): void {
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
      dialog: VIEW_CERTIFICATE_DIALOG,
      certs: ders.map(inspectCert),
    });
    show(VIEW_CERTIFICATE_DIALOG);
    return;
  }

  if (type === "jwt") {
    const text = decodeText(bytes);
    setExamineView({
      title: "JSON Web Token Details",
      dialog: VIEW_JWT_DIALOG,
      jwt: jwtParts(text) ?? { header: "", payload: "", signature: "" },
    });
    show(VIEW_JWT_DIALOG);
    return;
  }

  if (type === "csr") {
    setExamineView({
      title: "Certification Request Details",
      dialog: VIEW_CSR_DIALOG,
      fields: inspectCsr(bytes),
    });
    show(VIEW_CSR_DIALOG);
    return;
  }

  if (type === "crl") {
    setExamineView({
      title: "CRL Details",
      dialog: VIEW_CRL_DIALOG,
      fields: inspectCrl(bytes),
    });
    show(VIEW_CRL_DIALOG);
    return;
  }

  if (type === "pkcs12") {
    setExamineView({
      title: "PKCS #12 Information",
      dialog: PKCS12_INFO_DIALOG,
      message: friendlyType(type),
    });
    show(PKCS12_INFO_DIALOG);
    return;
  }

  if (type === "privateKey") {
    setExamineView({
      title: friendlyType(type),
      dialog: VIEW_PRIVATE_KEY_DIALOG,
      message: friendlyType(type),
    });
    show(VIEW_PRIVATE_KEY_DIALOG);
    return;
  }

  setExamineView({
    title: friendlyType(type),
    dialog: VIEW_PUBLIC_KEY_DIALOG,
    message: friendlyType(type),
  });
  show(VIEW_PUBLIC_KEY_DIALOG);
}

export function presentCertificates(certs: Uint8Array[], title = "Certificate Details"): void {
  const ders = certs.flatMap((item) => certificateDers(item));
  if (ders.length === 0) {
    presentUnknown(ERROR_DIALOG);
    return;
  }
  setExaminedType("certificate");
  setExamineView({
    title,
    dialog: VIEW_CERTIFICATE_DIALOG,
    certs: ders.map(inspectCert),
  });
  show(VIEW_CERTIFICATE_DIALOG);
}
