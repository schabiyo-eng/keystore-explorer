export { commands } from "./commands";
import {
  ChangePasswordDialog,
  CompareCertificatesDialog,
  FindDialog,
  PropertiesDialog,
} from "./dialogs";

export const dialogs = {
  "dialog.find": FindDialog,
  "dialog.change-password": ChangePasswordDialog,
  "dialog.properties": PropertiesDialog,
  "dialog.compare-certificates": CompareCertificatesDialog,
};
