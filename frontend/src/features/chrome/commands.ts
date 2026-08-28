import { flag } from "../file/params";
import type { CommandParams, CommandSpec } from "../../shell/types";
import { fail, show, succeed } from "./outcome";
import { fetchLatest, setUpdateResult, updateResultMessage } from "./update";

const always = () => true;

function closeOrShow(dialog: string, params?: CommandParams): void {
  if (flag(params, "dismiss")) {
    succeed();
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  show(dialog);
}

export function aboutCommand(params?: CommandParams): void {
  closeOrShow("dialog.about", params);
}

export function jarsCommand(params?: CommandParams): void {
  closeOrShow("dialog.jars", params);
}

export function securityProvidersCommand(params?: CommandParams): void {
  closeOrShow("dialog.security-providers", params);
}

export function systemInformationCommand(params?: CommandParams): void {
  closeOrShow("dialog.system-information", params);
}

export async function checkUpdateCommand(params?: CommandParams): Promise<void> {
  if (flag(params, "dismiss")) {
    succeed();
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  try {
    const latest = await fetchLatest();
    setUpdateResult(updateResultMessage(latest));
    show("dialog.check-update");
  } catch {
    fail("networkError", "dialog.problem");
  }
}

export function cancelCommand(): void {
  fail("cancelled");
}

export const commands: Record<string, CommandSpec> = {
  about: { canExecute: always, run: aboutCommand },
  jars: { canExecute: always, run: jarsCommand },
  securityProviders: { canExecute: always, run: securityProvidersCommand },
  systemInformation: { canExecute: always, run: systemInformationCommand },
  checkUpdate: { canExecute: always, run: checkUpdateCommand },
  cancel: { run: cancelCommand },
};
