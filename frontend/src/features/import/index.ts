export { commands } from "./commands";
import { AliasDialog, ImportKeyPairDialog, ViewCertificateDialog } from "./dialogs";

export const dialogs = {
  "dialog.import-key-pair": ImportKeyPairDialog,
  "dialog.alias": AliasDialog,
  "dialog.view-certificate": ViewCertificateDialog,
};
