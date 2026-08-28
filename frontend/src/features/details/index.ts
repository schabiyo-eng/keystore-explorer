export { commands } from "./commands";
import {
  ViewCertificateDialog,
  ViewPrivateKeyDialog,
  ViewPublicKeyDialog,
  ViewSecretKeyDialog,
} from "./dialogs";
import {
  CERTIFICATE_DIALOG,
  PRIVATE_KEY_DIALOG,
  PUBLIC_KEY_DIALOG,
  SECRET_KEY_DIALOG,
} from "./view";

export const dialogs = {
  [CERTIFICATE_DIALOG]: ViewCertificateDialog,
  [PRIVATE_KEY_DIALOG]: ViewPrivateKeyDialog,
  [PUBLIC_KEY_DIALOG]: ViewPublicKeyDialog,
  [SECRET_KEY_DIALOG]: ViewSecretKeyDialog,
};
