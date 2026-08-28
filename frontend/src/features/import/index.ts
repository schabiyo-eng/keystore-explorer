export { commands } from "./commands";
import { CertificatePreviewDialog, ImportAliasDialog, ImportKeyPairDialog } from "./dialogs";

export const dialogs = {
  "dialog.import-key-pair": ImportKeyPairDialog,
  "dialog.alias": ImportAliasDialog,
  "dialog.view-certificate": CertificatePreviewDialog,
};
