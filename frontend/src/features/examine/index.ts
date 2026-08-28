export { commands } from "./commands";
import {
  DetectFileTypeDialog,
  ExamineSslDialog,
  Pkcs12InfoDialog,
  ViewCertificateDialog,
  ViewCrlDialog,
  ViewCsrDialog,
  ViewJwtDialog,
} from "./dialogs";

export const dialogs = {
  "dialog.view-certificate": ViewCertificateDialog,
  "dialog.view-csr": ViewCsrDialog,
  "dialog.view-crl": ViewCrlDialog,
  "dialog.view-jwt": ViewJwtDialog,
  "dialog.pkcs12-info": Pkcs12InfoDialog,
  "dialog.examine-ssl": ExamineSslDialog,
  "dialog.detect-file-type": DetectFileTypeDialog,
};
