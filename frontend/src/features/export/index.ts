export { commands } from "./commands";
import {
  ExportCertificatesDialog,
  ExportCsvDialog,
  ExportKeyPairDialog,
  ExportPrivateKeyDialog,
  ExportPublicKeyDialog,
} from "./dialogs";
import {
  CERTIFICATES_DIALOG,
  CSV_DIALOG,
  KEY_PAIR_DIALOG,
  PRIVATE_KEY_DIALOG,
  PUBLIC_KEY_DIALOG,
} from "./ids";

export const dialogs = {
  [CSV_DIALOG]: ExportCsvDialog,
  [KEY_PAIR_DIALOG]: ExportKeyPairDialog,
  [CERTIFICATES_DIALOG]: ExportCertificatesDialog,
  [PRIVATE_KEY_DIALOG]: ExportPrivateKeyDialog,
  [PUBLIC_KEY_DIALOG]: ExportPublicKeyDialog,
};
