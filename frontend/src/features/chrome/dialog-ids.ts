/** `data-testid`s from functional-tests/control-ids.md (chrome slice). */

export const ABOUT_DIALOG = "dialog.about";
export const JARS_DIALOG = "dialog.jars";
export const SECURITY_PROVIDERS_DIALOG = "dialog.security-providers";
export const SYSTEM_INFORMATION_DIALOG = "dialog.system-information";
export const CHECK_UPDATE_DIALOG = "dialog.check-update";
export const PROBLEM_DIALOG = "dialog.problem";

export const HELP_COMMANDS = [
  "about",
  "jars",
  "securityProviders",
  "systemInformation",
  "checkUpdate",
] as const;

export type HelpCommand = (typeof HELP_COMMANDS)[number];

export type ChromeCommand = HelpCommand | "cancel";
