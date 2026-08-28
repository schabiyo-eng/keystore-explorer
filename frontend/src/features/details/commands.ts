import { flag, passwordOf, str } from "../file/params";
import { getActive, getSelection, host, unlockAlias } from "../../shell/session";
import type { CommandParams, CommandSpec } from "../../shell/types";
import { inferKind, isDetailsKind, needsPassword, selectionMatches } from "./kinds";
import { fail, succeed } from "./outcome";
import { viewForKind } from "./present";
import { setDetailsView, type DetailsView } from "./view";

function show(view: DetailsView): void {
  setDetailsView(view);
  host.clearError();
  host.openDialog(view.dialog);
}

export async function openDetails(params?: CommandParams): Promise<void> {
  if (flag(params, "dismiss")) {
    setDetailsView(null);
    succeed();
    return;
  }
  if (flag(params, "cancel")) {
    setDetailsView(null);
    fail("cancelled");
    return;
  }

  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }

  const requested = str(params, "kind");
  const kind = isDetailsKind(requested) ? requested : inferKind();
  if (!kind || !selectionMatches(kind)) {
    fail("emptySelection");
    return;
  }

  if (needsPassword(kind)) {
    const password = passwordOf(params);
    if (password === undefined) {
      host.openDialog("dialog.password");
      return;
    }
    if (password !== active.password) {
      fail("wrongPassword");
      return;
    }
    const alias = getSelection()[0];
    if (alias) {
      unlockAlias(alias);
    }
  }

  const view = await viewForKind(kind);
  if (!view) {
    fail("emptySelection");
    return;
  }
  show(view);
}

export function cancelDetails(): void {
  setDetailsView(null);
  fail("cancelled");
}

export function canOpenDetails(): boolean {
  return getActive() !== null && getSelection().length > 0;
}

export const commands: Record<string, CommandSpec> = {
  openDetails: { canExecute: canOpenDetails, run: openDetails },
  cancel: { run: cancelDetails },
};
