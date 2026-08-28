export { commands } from "./commands";
import {
  AboutDialog,
  CheckUpdateDialog,
  JarsDialog,
  SecurityProvidersDialog,
  SystemInformationDialog,
} from "./dialogs";
import {
  ABOUT_DIALOG,
  CHECK_UPDATE_DIALOG,
  JARS_DIALOG,
  SECURITY_PROVIDERS_DIALOG,
  SYSTEM_INFORMATION_DIALOG,
} from "./dialog-ids";

export const dialogs = {
  [ABOUT_DIALOG]: AboutDialog,
  [JARS_DIALOG]: JarsDialog,
  [SECURITY_PROVIDERS_DIALOG]: SecurityProvidersDialog,
  [SYSTEM_INFORMATION_DIALOG]: SystemInformationDialog,
  [CHECK_UPDATE_DIALOG]: CheckUpdateDialog,
};
