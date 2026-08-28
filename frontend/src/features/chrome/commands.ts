import type { CommandSpec } from "../../shell/types";
import { checkUpdateCommand } from "./check-update";
import type { ChromeCommand } from "./dialog-ids";
import { cancelCommand } from "./dismiss";
import {
  aboutCommand,
  jarsCommand,
  securityProvidersCommand,
  systemInformationCommand,
} from "./help";

const alwaysEnabled = () => true;

export const commands: Record<ChromeCommand, CommandSpec> = {
  about: { canExecute: alwaysEnabled, run: aboutCommand },
  jars: { canExecute: alwaysEnabled, run: jarsCommand },
  securityProviders: { canExecute: alwaysEnabled, run: securityProvidersCommand },
  systemInformation: { canExecute: alwaysEnabled, run: systemInformationCommand },
  checkUpdate: { canExecute: alwaysEnabled, run: checkUpdateCommand },
  cancel: { run: cancelCommand },
};
