import {
  ABOUT_DIALOG,
  CHECK_UPDATE_DIALOG,
  JARS_DIALOG,
  SECURITY_PROVIDERS_DIALOG,
  SYSTEM_INFORMATION_DIALOG,
} from "./dialog-ids";
import {
  AboutPanel,
  HelpDialog,
  JarInformationTable,
  SecurityProviderTree,
  SystemInformationFields,
} from "./fields";
import { APP_NAME } from "./info";
import { systemFields } from "./system";
import { useUpdateResult } from "./useUpdateResult";
import "./chrome.css";

export function AboutDialog() {
  return (
    <HelpDialog
      id={ABOUT_DIALOG}
      title={`About ${APP_NAME}`}
      command="about"
      extraActions={
        <button type="button" aria-label="Credits">
          Credits
        </button>
      }
    >
      <AboutPanel />
    </HelpDialog>
  );
}

export function JarsDialog() {
  return (
    <HelpDialog id={JARS_DIALOG} title="JAR Information" command="jars">
      <JarInformationTable />
    </HelpDialog>
  );
}

export function SecurityProvidersDialog() {
  return (
    <HelpDialog
      id={SECURITY_PROVIDERS_DIALOG}
      title="Security Provider Information"
      command="securityProviders"
    >
      <SecurityProviderTree />
    </HelpDialog>
  );
}

export function SystemInformationDialog() {
  return (
    <HelpDialog
      id={SYSTEM_INFORMATION_DIALOG}
      title="System Information"
      command="systemInformation"
    >
      <SystemInformationFields fields={systemFields()} />
    </HelpDialog>
  );
}

export function CheckUpdateDialog() {
  const message = useUpdateResult();
  return (
    <HelpDialog id={CHECK_UPDATE_DIALOG} title="Check for Update" command="checkUpdate">
      <p role="status">{message || "Checking for updates…"}</p>
    </HelpDialog>
  );
}
