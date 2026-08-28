export { commands } from "./commands";
import {
  ViewCertificateDialog,
  ViewPrivateKeyDialog,
  ViewPublicKeyDialog,
  ViewSecretKeyDialog,
} from "./dialogs";

export const dialogs = {
  "dialog.view-certificate": ViewCertificateDialog,
  "dialog.view-private-key": ViewPrivateKeyDialog,
  "dialog.view-public-key": ViewPublicKeyDialog,
  "dialog.view-secret-key": ViewSecretKeyDialog,
};
