import { cloneStore } from "../../kernel/store";
import { flag, resolvePassword } from "../file/params";
import { getActive, host, pushHistory, unlockAlias } from "../../shell/session";
import type { CommandParams, TabState } from "../../shell/types";
import { hasActive, hasSelectedType, selectedAlias, selectedEntryType } from "./active";
import { fail, succeed } from "./outcome";

function passwordParam(params: CommandParams | undefined, key: string): string | undefined {
  return resolvePassword(params?.[key]);
}

function markDirty(active: TabState, password: string): void {
  pushHistory();
  const store = cloneStore(active.store);
  store.dirty = true;
  host.updateTab(active.id, { password, store });
}

export async function setPassword(params?: CommandParams): Promise<void> {
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  const next = passwordParam(params, "newPassword");
  const confirm = passwordParam(params, "confirm");
  if (next === undefined || confirm === undefined) {
    host.openDialog("dialog.new-password");
    return;
  }
  if (next !== confirm) {
    fail("passwordMismatch");
    return;
  }
  markDirty(active, next);
  succeed();
}

async function changeEntryPassword(
  params: CommandParams | undefined,
  expectedType: "KEY" | "KEY_PAIR",
): Promise<void> {
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  if (selectedEntryType() !== expectedType) {
    fail("emptySelection");
    return;
  }
  const oldPassword = passwordParam(params, "oldPassword");
  const newPassword = passwordParam(params, "newPassword");
  if (oldPassword === undefined || newPassword === undefined) {
    host.openDialog("dialog.change-password");
    return;
  }
  if (oldPassword !== active.password) {
    fail("wrongPassword", "dialog.problem");
    return;
  }
  const alias = selectedAlias();
  markDirty(active, newPassword);
  if (alias) {
    unlockAlias(alias);
  }
  succeed();
}

async function unlockEntry(
  params: CommandParams | undefined,
  expectedType: "KEY" | "KEY_PAIR",
): Promise<void> {
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  if (selectedEntryType() !== expectedType) {
    fail("emptySelection");
    return;
  }
  const password = passwordParam(params, "password");
  if (password === undefined) {
    host.openDialog("dialog.password");
    return;
  }
  if (password !== active.password) {
    fail("wrongPassword", "dialog.problem");
    return;
  }
  const alias = selectedAlias();
  if (alias) {
    unlockAlias(alias);
  }
  succeed();
}

export const passwordCommands = {
  setPassword: { canExecute: hasActive, run: setPassword },
  setKeyPassword: {
    canExecute: () => hasSelectedType("KEY"),
    run: (params?: CommandParams) => changeEntryPassword(params, "KEY"),
  },
  setKeyPairPassword: {
    canExecute: () => hasSelectedType("KEY_PAIR"),
    run: (params?: CommandParams) => changeEntryPassword(params, "KEY_PAIR"),
  },
  unlockKey: {
    canExecute: () => hasSelectedType("KEY"),
    run: (params?: CommandParams) => unlockEntry(params, "KEY"),
  },
  unlockKeyPair: {
    canExecute: () => hasSelectedType("KEY_PAIR"),
    run: (params?: CommandParams) => unlockEntry(params, "KEY_PAIR"),
  },
} as const;
