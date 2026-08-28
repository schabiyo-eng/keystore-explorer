import {
  TEST_PASSWORD,
  load,
  newKeyStore as kernelNew,
  save as kernelSave,
} from "../../kernel";
import { getActive, host } from "../../shell/session";
import type { CommandParams, LastWrite, TabState } from "../../shell/types";
import type { ErrorId } from "../../kernel";

function str(params: CommandParams | undefined, key: string): string | undefined {
  const value = params?.[key];
  return typeof value === "string" ? value : undefined;
}

function flag(params: CommandParams | undefined, key: string): boolean | undefined {
  const value = params?.[key];
  return typeof value === "boolean" ? value : undefined;
}

export function resolvePassword(raw: unknown): string | undefined {
  if (raw === "TEST_PASSWORD") {
    return TEST_PASSWORD;
  }
  if (typeof raw === "string") {
    return raw;
  }
  return undefined;
}

function passwordOf(params?: CommandParams): string | undefined {
  return resolvePassword(params?.password);
}

function pathHasMissingDir(path: string): boolean {
  return path.includes("/") || path.includes("\\");
}

function basename(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

function untitledName(id: string): string {
  if (id.startsWith("untitled-")) {
    return `Untitled-${id.slice("untitled-".length)}`;
  }
  return id;
}

function nextUntitledId(): string {
  const used = new Set(host.getState().tabs.map((tab) => tab.id));
  let n = 1;
  while (used.has(`untitled-${n}`)) {
    n += 1;
  }
  return `untitled-${n}`;
}

function fail(errorId: ErrorId, dialog?: string): void {
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

async function persistTab(tab: TabState, path: string, password: string): Promise<LastWrite | null> {
  if (pathHasMissingDir(path)) {
    fail("notFound", "dialog.error");
    return null;
  }
  const saved = await kernelSave(tab.store, password);
  if (!saved.ok) {
    fail(saved.errorId, "dialog.error");
    return null;
  }
  host.vfsWrite(path, saved.bytes);
  host.updateTab(tab.id, {
    path,
    password,
    store: saved.store,
    bytes: saved.bytes,
    name: basename(path),
  });
  return { path, bytes: saved.bytes, password };
}

async function newKeyStore(params?: CommandParams): Promise<void> {
  if (flag(params, "cancel")) {
    host.openDialog("dialog.new-keystore");
    fail("cancelled");
    return;
  }
  const type = str(params, "type");
  if (!type) {
    host.openDialog("dialog.new-keystore");
    return;
  }
  if (type !== "PKCS12") {
    host.openDialog("dialog.new-keystore");
    host.setError("unsupportedType");
    return;
  }
  const result = await kernelNew({ type: "PKCS12" });
  if (!result.ok) {
    host.openDialog("dialog.new-keystore");
    host.setError(result.errorId);
    return;
  }
  const id = nextUntitledId();
  host.addTab({
    id,
    name: untitledName(id),
    store: result.store,
  });
  succeed();
}

async function openKeyStore(params?: CommandParams): Promise<void> {
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  const path = str(params, "path") ?? str(params, "fixture");
  if (!path) {
    host.openDialog("dialog.file-open");
    return;
  }
  const password = passwordOf(params);
  if (password === undefined) {
    host.openDialog("dialog.password");
    return;
  }
  const bytes = host.vfsRead(path);
  if (!bytes) {
    fail("notFound", "dialog.error");
    return;
  }
  const result = await load(bytes, password);
  if (!result.ok) {
    fail(result.errorId, result.errorId === "wrongPassword" ? "dialog.problem" : "dialog.error");
    return;
  }
  host.addTab({
    id: basename(path),
    name: basename(path),
    path,
    password,
    store: result.store,
    bytes,
  });
  host.recordWrites([{ path, bytes, password }]);
  succeed();
}

async function saveKeyStoreAs(params?: CommandParams): Promise<void> {
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  const path = str(params, "path");
  if (!path) {
    host.openDialog("dialog.file-save");
    return;
  }
  const password = passwordOf(params) ?? active.password;
  if (!password) {
    host.openDialog("dialog.new-password");
    return;
  }
  const write = await persistTab(active, path, password);
  if (write) {
    host.recordWrites([write]);
    succeed();
  }
}

async function saveKeyStore(params?: CommandParams): Promise<void> {
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  if (!active.path) {
    await saveKeyStoreAs(params);
    return;
  }
  const password = passwordOf(params) ?? active.password;
  if (!password) {
    host.openDialog("dialog.new-password");
    return;
  }
  const write = await persistTab(active, active.path, password);
  if (write) {
    host.recordWrites([write]);
    succeed();
  }
}

async function saveAllKeyStores(params?: CommandParams): Promise<void> {
  const tabs = host.getState().tabs;
  if (tabs.length === 0) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  const writes: LastWrite[] = [];
  for (const tab of [...tabs]) {
    const path = tab.path ?? str(params, "path");
    const password = passwordOf(params) ?? tab.password;
    if (!path || !password) {
      host.openDialog(path ? "dialog.new-password" : "dialog.file-save");
      return;
    }
    const current = host.getState().tabs.find((item) => item.id === tab.id) ?? tab;
    const write = await persistTab(current, path, password);
    if (!write) {
      return;
    }
    writes.push(write);
  }
  host.recordWrites(writes);
  succeed();
}

async function closeKeyStore(params?: CommandParams): Promise<void> {
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  if (active.store.dirty && flag(params, "saveDirty") === true) {
    const path = active.path ?? str(params, "path");
    const password = passwordOf(params) ?? active.password;
    if (!path || !password) {
      host.openDialog(path ? "dialog.new-password" : "dialog.file-save");
      return;
    }
    const write = await persistTab(active, path, password);
    if (!write) {
      return;
    }
    host.recordWrites([write]);
  }
  host.removeTab(active.id);
  succeed();
}

async function closeAllKeyStores(params?: CommandParams): Promise<void> {
  const tabs = host.getState().tabs;
  if (tabs.length === 0) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  const writes: LastWrite[] = [];
  for (const tab of [...tabs]) {
    const current = host.getState().tabs.find((item) => item.id === tab.id);
    if (!current) {
      continue;
    }
    if (current.store.dirty && flag(params, "saveDirty") === true) {
      const path = current.path ?? str(params, "path");
      const password = passwordOf(params) ?? current.password;
      if (!path || !password) {
        host.openDialog(path ? "dialog.new-password" : "dialog.file-save");
        return;
      }
      const write = await persistTab(current, path, password);
      if (!write) {
        return;
      }
      writes.push(write);
    }
    host.removeTab(tab.id);
  }
  if (writes.length > 0) {
    host.recordWrites(writes);
  }
  succeed();
}

async function closeOtherKeyStores(params?: CommandParams): Promise<void> {
  const active = getActive();
  const tabs = host.getState().tabs;
  if (!active || tabs.length === 0) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  const writes: LastWrite[] = [];
  const others = tabs.filter((tab) => tab.id !== active.id);
  for (const tab of others) {
    const current = host.getState().tabs.find((item) => item.id === tab.id);
    if (!current) {
      continue;
    }
    if (current.store.dirty && flag(params, "saveDirty") === true) {
      const path = current.path ?? str(params, "path");
      const password = passwordOf(params) ?? current.password;
      if (!path || !password) {
        host.openDialog(path ? "dialog.new-password" : "dialog.file-save");
        return;
      }
      const write = await persistTab(current, path, password);
      if (!write) {
        return;
      }
      writes.push(write);
    }
    host.removeTab(tab.id);
  }
  if (writes.length > 0) {
    host.recordWrites(writes);
  }
  succeed();
}

async function reloadKeyStore(params?: CommandParams): Promise<void> {
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  if (flag(params, "discardDirty") === false) {
    fail("cancelled");
    return;
  }
  if (!active.path) {
    fail("notFound", "dialog.error");
    return;
  }
  const bytes = host.vfsRead(active.path);
  if (!bytes) {
    fail("notFound", "dialog.error");
    return;
  }
  const password = passwordOf(params) ?? active.password;
  if (!password) {
    host.openDialog("dialog.password");
    return;
  }
  const result = await load(bytes, password);
  if (!result.ok) {
    fail(result.errorId, "dialog.error");
    return;
  }
  host.updateTab(active.id, { store: result.store, bytes, password });
  host.recordWrites([{ path: active.path, bytes, password }]);
  succeed();
}

async function exitApp(params?: CommandParams): Promise<void> {
  if (flag(params, "cancel")) {
    fail("cancelled");
    host.setExited(false);
    return;
  }
  if (host.getState().tabs.length > 0) {
    await closeAllKeyStores(params);
    if (host.getState().errorId) {
      host.setExited(false);
      return;
    }
  }
  host.setExited(true);
}

const hasActive = () => getActive() !== null;
const hasTabs = () => host.getState().tabs.length > 0;

export const commands = {
  newKeyStore: { canExecute: () => true, run: newKeyStore },
  openKeyStore: { canExecute: () => true, run: openKeyStore },
  saveKeyStore: { canExecute: hasActive, run: saveKeyStore },
  saveKeyStoreAs: { canExecute: hasActive, run: saveKeyStoreAs },
  saveAllKeyStores: { canExecute: hasTabs, run: saveAllKeyStores },
  closeKeyStore: { canExecute: hasActive, run: closeKeyStore },
  closeAllKeyStores: { canExecute: hasTabs, run: closeAllKeyStores },
  closeOtherKeyStores: { canExecute: hasActive, run: closeOtherKeyStores },
  reloadKeyStore: { canExecute: hasActive, run: reloadKeyStore },
  exitApp: { canExecute: () => true, run: exitApp },
};
