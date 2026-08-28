import { load, newKeyStore as kernelNew, save as kernelSave } from "../../kernel";
import { cloneStore } from "../../kernel/store";
import { flag, resolvePassword, str } from "../file/params";
import { fileBasename } from "../../shell/paths";
import {
  findAlias,
  getActive,
  historyCanRedo,
  historyCanUndo,
  host,
  pushHistory,
  redo as redoHistory,
  undo as undoHistory,
  unlockAlias,
} from "../../shell/session";
import type { CommandParams, CommandSpec, SessionErrorId } from "../../shell/types";

export const CA_CERTS_PATH = "ca-certificates.p12";

function fail(errorId: SessionErrorId, dialog?: string): void {
  host.setError(errorId);
  if (dialog) {
    host.openDialog(dialog);
  } else {
    host.closeDialog();
  }
}

function succeed(): void {
  host.clearError();
  host.closeDialog();
}

function hasActive(): boolean {
  return getActive() !== null;
}

function selectedAlias(): string | undefined {
  return host.getState().selection[0];
}

function selectedEntryType(): string | undefined {
  const active = getActive();
  const alias = selectedAlias();
  if (!active || !alias) {
    return undefined;
  }
  return active.store.entries.find((entry) => entry.alias === alias)?.entryType;
}

function passwordParam(params: CommandParams | undefined, key: string): string | undefined {
  return resolvePassword(params?.[key]);
}

async function undoCommand(): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  undoHistory();
  succeed();
}

async function redoCommand(): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  redoHistory();
  succeed();
}

async function findCommand(params?: CommandParams): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  const query = str(params, "query");
  if (!query) {
    host.openDialog("dialog.find");
    return;
  }
  const alias = findAlias(query);
  if (!alias) {
    fail("notFound");
    return;
  }
  host.setSelection([alias]);
  succeed();
}

async function setPassword(params?: CommandParams): Promise<void> {
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
  pushHistory();
  const store = cloneStore(active.store);
  store.dirty = true;
  host.updateTab(active.id, { password: next, store });
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
  pushHistory();
  const store = cloneStore(active.store);
  store.dirty = true;
  host.updateTab(active.id, { password: newPassword, store });
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

async function changeType(params?: CommandParams): Promise<void> {
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

async function properties(params?: CommandParams): Promise<void> {
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

async function convertToJavaP12(params?: CommandParams): Promise<void> {
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

async function openCaCertificates(params?: CommandParams): Promise<void> {
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  const password = passwordParam(params, "password");
  if (password === undefined) {
    host.openDialog("dialog.password");
    return;
  }
  const existing = host.vfsRead(CA_CERTS_PATH);
  if (existing) {
    const loaded = await load(existing, password);
    if (!loaded.ok) {
      fail(loaded.errorId, loaded.errorId === "wrongPassword" ? "dialog.problem" : "dialog.error");
      return;
    }
    host.addTab({
      id: fileBasename(CA_CERTS_PATH),
      name: fileBasename(CA_CERTS_PATH),
      path: CA_CERTS_PATH,
      password,
      store: loaded.store,
      bytes: existing,
    });
    host.recordWrites([{ path: CA_CERTS_PATH, bytes: existing, password }]);
    succeed();
    return;
  }
  const created = await kernelNew({ type: "PKCS12" });
  if (!created.ok) {
    fail(created.errorId, "dialog.error");
    return;
  }
  const saved = await kernelSave(created.store, password);
  if (!saved.ok) {
    fail(saved.errorId, "dialog.error");
    return;
  }
  host.vfsWrite(CA_CERTS_PATH, saved.bytes);
  host.addTab({
    id: fileBasename(CA_CERTS_PATH),
    name: fileBasename(CA_CERTS_PATH),
    path: CA_CERTS_PATH,
    password,
    store: saved.store,
    bytes: saved.bytes,
  });
  host.recordWrites([{ path: CA_CERTS_PATH, bytes: saved.bytes, password }]);
  succeed();
}

async function authorityCertificates(params?: CommandParams): Promise<void> {
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  const password = passwordParam(params, "password");
  if (password === undefined) {
    host.openDialog("dialog.password");
    return;
  }
  const bytes = host.vfsRead(CA_CERTS_PATH);
  if (!bytes) {
    fail("notFound");
    return;
  }
  const loaded = await load(bytes, password);
  if (!loaded.ok) {
    fail(loaded.errorId, loaded.errorId === "wrongPassword" ? "dialog.problem" : "dialog.error");
    return;
  }
  succeed();
}

async function authorityCertificatesVerify(): Promise<void> {
  if (!hasActive()) {
    fail("notFound");
    return;
  }
  succeed();
}

async function compareCertificate(): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  const selection = host.getState().selection;
  if (selection.length < 2) {
    fail("emptySelection");
    return;
  }
  host.clearError();
  host.openDialog("dialog.compare-certificates");
}

export const commands: Record<string, CommandSpec> = {
  undo: { canExecute: historyCanUndo, run: undoCommand },
  redo: { canExecute: historyCanRedo, run: redoCommand },
  find: { canExecute: hasActive, run: findCommand },
  setPassword: { canExecute: hasActive, run: setPassword },
  setKeyPassword: {
    canExecute: () => hasActive() && selectedEntryType() === "KEY",
    run: (params) => changeEntryPassword(params, "KEY"),
  },
  setKeyPairPassword: {
    canExecute: () => hasActive() && selectedEntryType() === "KEY_PAIR",
    run: (params) => changeEntryPassword(params, "KEY_PAIR"),
  },
  unlockKey: {
    canExecute: () => hasActive() && selectedEntryType() === "KEY",
    run: (params) => unlockEntry(params, "KEY"),
  },
  unlockKeyPair: {
    canExecute: () => hasActive() && selectedEntryType() === "KEY_PAIR",
    run: (params) => unlockEntry(params, "KEY_PAIR"),
  },
  changeType: { canExecute: hasActive, run: changeType },
  properties: { canExecute: hasActive, run: properties },
  convertToJavaP12: { canExecute: hasActive, run: convertToJavaP12 },
  openCaCertificates: { canExecute: () => true, run: openCaCertificates },
  authorityCertificates: { canExecute: () => true, run: authorityCertificates },
  authorityCertificatesVerify: {
    canExecute: hasActive,
    run: authorityCertificatesVerify,
  },
  compareCertificate: {
    canExecute: () => hasActive() && host.getState().selection.length >= 2,
    run: compareCertificate,
  },
};
