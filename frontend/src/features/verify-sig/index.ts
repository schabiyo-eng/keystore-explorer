export { commands } from "./commands";
import {
  VerifyCertificateDialog,
  ViewSignatureDialog,
  ViewSignedJarDialog,
} from "./dialogs";
import {
  VERIFY_CERTIFICATE_DIALOG,
  VIEW_SIGNATURE_DIALOG,
  VIEW_SIGNED_JAR_DIALOG,
} from "./dialog-ids";

export const dialogs = {
  [VERIFY_CERTIFICATE_DIALOG]: VerifyCertificateDialog,
  [VIEW_SIGNED_JAR_DIALOG]: ViewSignedJarDialog,
  [VIEW_SIGNATURE_DIALOG]: ViewSignatureDialog,
};
