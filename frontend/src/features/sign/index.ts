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

export const dialogs = {
  "dialog.generate-csr": GenerateCsrDialog,
  "dialog.sign-csr": SignCsrDialog,
  "dialog.sign-file": SignFileDialog,
  "dialog.sign-jar": SignJarDialog,
  "dialog.sign-jwt": SignJwtDialog,
  "dialog.sign-crl": SignCrlDialog,
  "dialog.sign-midlet": SignMidletDialog,
  "dialog.view-jwt": ViewJwtDialog,
};
