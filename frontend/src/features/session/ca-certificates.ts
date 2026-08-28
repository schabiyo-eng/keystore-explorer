import { load, newKeyStore as kernelNew, save as kernelSave } from "../../kernel";
import type { KeyStore } from "../../kernel";
import { flag, resolvePassword } from "../file/params";
import { fileBasename } from "../../shell/paths";
import { host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { hasActive } from "./active";
import { fail, succeed } from "./outcome";

export const CA_CERTS_PATH = "ca-certificates.p12";

function passwordOf(params?: CommandParams): string | undefined {
  return resolvePassword(params?.password);
}

function openCaTab(password: string, store: KeyStore, bytes: Uint8Array): void {
  const name = fileBasename(CA_CERTS_PATH);
  host.addTab({
    id: name,
    name,
    path: CA_CERTS_PATH,
    password,
    store,
    bytes,
  });
  host.recordWrites([{ path: CA_CERTS_PATH, bytes, password }]);
}

async function loadExistingCa(
  bytes: Uint8Array,
  password: string,
): Promise<KeyStore | null> {
  const loaded = await load(bytes, password);
  if (!loaded.ok) {
    fail(loaded.errorId, loaded.errorId === "wrongPassword" ? "dialog.problem" : "dialog.error");
    return null;
  }
  return loaded.store;
}

export async function openCaCertificates(params?: CommandParams): Promise<void> {
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  const password = passwordOf(params);
  if (password === undefined) {
    host.openDialog("dialog.password");
    return;
  }
  const existing = host.vfsRead(CA_CERTS_PATH);
  if (existing) {
    const store = await loadExistingCa(existing, password);
    if (!store) {
      return;
    }
    openCaTab(password, store, existing);
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
  openCaTab(password, saved.store, saved.bytes);
  succeed();
}

export async function authorityCertificates(params?: CommandParams): Promise<void> {
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  const password = passwordOf(params);
  if (password === undefined) {
    host.openDialog("dialog.password");
    return;
  }
  const bytes = host.vfsRead(CA_CERTS_PATH);
  if (!bytes) {
    fail("notFound");
    return;
  }
  const store = await loadExistingCa(bytes, password);
  if (!store) {
    return;
  }
  succeed();
}

export async function authorityCertificatesVerify(): Promise<void> {
  if (!hasActive()) {
    fail("notFound");
    return;
  }
  succeed();
}

export const caCertificateCommands = {
  openCaCertificates: { canExecute: () => true, run: openCaCertificates },
  authorityCertificates: { canExecute: () => true, run: authorityCertificates },
  authorityCertificatesVerify: {
    canExecute: hasActive,
    run: authorityCertificatesVerify,
  },
} as const;
