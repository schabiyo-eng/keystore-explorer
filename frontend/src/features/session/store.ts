import { flag, str } from "../file/params";
import { host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { hasActive } from "./active";
import { fail, succeed } from "./outcome";

export async function changeType(params?: CommandParams): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  const type = str(params, "type") ?? "PKCS12";
  if (type !== "PKCS12") {
    fail("unsupportedType");
    return;
  }
  succeed();
}

export async function properties(params?: CommandParams): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "dismiss")) {
    succeed();
    return;
  }
  host.clearError();
  host.openDialog("dialog.properties");
}

export async function convertToJavaP12(params?: CommandParams): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "confirm") === false) {
    fail("cancelled");
    return;
  }
  if (flag(params, "confirm") !== true) {
    host.openDialog("dialog.confirm");
    return;
  }
  succeed();
}

export const storeCommands = {
  changeType: { canExecute: hasActive, run: changeType },
  properties: { canExecute: hasActive, run: properties },
  convertToJavaP12: { canExecute: hasActive, run: convertToJavaP12 },
} as const;
