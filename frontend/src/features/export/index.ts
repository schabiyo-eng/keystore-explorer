export { commands } from "./commands";
import {
  ExportCertificatesDialog,
  ExportCsvDialog,
  ExportKeyPairDialog,
  ExportPrivateKeyDialog,
  ExportPublicKeyDialog,
} from "./dialogs";

export const dialogs = {
  "dialog.export-csv": ExportCsvDialog,
  "dialog.export-key-pair": ExportKeyPairDialog,
  "dialog.export-certificates": ExportCertificatesDialog,
  "dialog.export-private-key-type": ExportPrivateKeyDialog,
  "dialog.export-public-key": ExportPublicKeyDialog,
};
