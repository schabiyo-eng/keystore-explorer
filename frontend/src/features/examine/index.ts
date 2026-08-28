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
import {
  DETECT_FILE_TYPE_DIALOG,
  EXAMINE_SSL_DIALOG,
  PKCS12_INFO_DIALOG,
  VIEW_CERTIFICATE_DIALOG,
  VIEW_CRL_DIALOG,
  VIEW_CSR_DIALOG,
  VIEW_JWT_DIALOG,
} from "./dialog-ids";

export const dialogs = {
  [VIEW_CERTIFICATE_DIALOG]: ViewCertificateDialog,
  [VIEW_CSR_DIALOG]: ViewCsrDialog,
  [VIEW_CRL_DIALOG]: ViewCrlDialog,
  [VIEW_JWT_DIALOG]: ViewJwtDialog,
  [PKCS12_INFO_DIALOG]: Pkcs12InfoDialog,
  [EXAMINE_SSL_DIALOG]: ExamineSslDialog,
  [DETECT_FILE_TYPE_DIALOG]: DetectFileTypeDialog,
};
