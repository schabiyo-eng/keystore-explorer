import type { CommandParams } from "../../shell/types";
import {
  ABOUT_DIALOG,
  JARS_DIALOG,
  SECURITY_PROVIDERS_DIALOG,
  SYSTEM_INFORMATION_DIALOG,
} from "./dialog-ids";
import { runHelpDialog } from "./dismiss";

export function aboutCommand(params?: CommandParams): void {
  runHelpDialog(ABOUT_DIALOG, params);
}

export function jarsCommand(params?: CommandParams): void {
  runHelpDialog(JARS_DIALOG, params);
}

export function securityProvidersCommand(params?: CommandParams): void {
  runHelpDialog(SECURITY_PROVIDERS_DIALOG, params);
}

export function systemInformationCommand(params?: CommandParams): void {
  runHelpDialog(SYSTEM_INFORMATION_DIALOG, params);
}
