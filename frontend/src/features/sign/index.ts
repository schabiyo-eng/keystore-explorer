export { commands } from "./commands";
import {
  GenerateCsrDialog,
  SignCrlDialog,
  SignCsrDialog,
  SignFileDialog,
  SignJarDialog,
  SignJwtDialog,
  SignMidletDialog,
  ViewJwtDialog,
} from "./dialogs";
import {
  GENERATE_CSR_DIALOG,
  SIGN_CRL_DIALOG,
  SIGN_CSR_DIALOG,
  SIGN_FILE_DIALOG,
  SIGN_JAR_DIALOG,
  SIGN_JWT_DIALOG,
  SIGN_MIDLET_DIALOG,
  VIEW_JWT_DIALOG,
} from "./dialog-ids";

export const dialogs = {
  [GENERATE_CSR_DIALOG]: GenerateCsrDialog,
  [SIGN_CSR_DIALOG]: SignCsrDialog,
  [SIGN_FILE_DIALOG]: SignFileDialog,
  [SIGN_JAR_DIALOG]: SignJarDialog,
  [SIGN_JWT_DIALOG]: SignJwtDialog,
  [SIGN_CRL_DIALOG]: SignCrlDialog,
  [SIGN_MIDLET_DIALOG]: SignMidletDialog,
  [VIEW_JWT_DIALOG]: ViewJwtDialog,
};
