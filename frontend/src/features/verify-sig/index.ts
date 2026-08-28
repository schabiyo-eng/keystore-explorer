export { commands } from "./commands";
import { VerifyCertificateDialog, ViewSignatureDialog, ViewSignedJarDialog } from "./dialogs";

export const dialogs = {
  "dialog.verify-certificate": VerifyCertificateDialog,
  "dialog.view-signed-jar": ViewSignedJarDialog,
  "dialog.view-signature": ViewSignatureDialog,
};
