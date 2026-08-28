export { commands } from "./commands";
import {
  AboutDialog,
  CheckUpdateDialog,
  JarsDialog,
  SecurityProvidersDialog,
  SystemInformationDialog,
} from "./dialogs";

export const dialogs = {
  "dialog.about": AboutDialog,
  "dialog.jars": JarsDialog,
  "dialog.security-providers": SecurityProvidersDialog,
  "dialog.system-information": SystemInformationDialog,
  "dialog.check-update": CheckUpdateDialog,
};
