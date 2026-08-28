import { save as kernelSave } from "../../kernel";
import { cloneEntry } from "../../kernel/store";
import type { KernelEntry } from "../../kernel";
import { pathHasMissingDir } from "../../shell/paths";
import { getActive, getSelection, host } from "../../shell/session";
import type { CommandParams, CommandSpec } from "../../shell/types";
import {
  certificatesOf,
  encodeCertificatesPem,
  encodeCsv,
  encodePkcs8Pem,
  encodePublicKeyPem,
} from "./encode";
import { fail, succeed } from "./outcome";
import { flag, passwordOf, str } from "./params";

function hasActive(): boolean {
  return getActive() !== null;
}

function cancelled(params?: CommandParams): boolean {
  return flag(params, "cancel") === true || flag(params, "confirm") === false;
}

function selectedEntries(): KernelEntry[] {
  const active = getActive();
  if (!active) {
    return [];
  }
  const selected = new Set(getSelection());
  return active.store.entries.filter((entry) => selected.has(entry.alias));
}

function selectedOfType(entryType: KernelEntry["entryType"]): KernelEntry | undefined {
  const matches = selectedEntries().filter((entry) => entry.entryType === entryType);
  return matches.length === 1 ? matches[0] : undefined;
}

function certEntries(source: string | undefined): KernelEntry[] {
  const selected = selectedEntries();
  if (source === "chain") {
    return selected.filter((entry) => entry.entryType === "KEY_PAIR");
  }
  if (source === "trusted") {
    return selected.filter((entry) => entry.entryType === "TRUSTED_CERT");
  }
  if (source === "selected") {
    return selected.filter((entry) => certificatesOf(entry).length > 0);
  }
  if (selected.length === 1 && selected[0]?.entryType === "KEY_PAIR") {
    return selected;
  }
  if (selected.length === 1 && selected[0]?.entryType === "TRUSTED_CERT") {
    return selected;
  }
  return selected.filter((entry) => certificatesOf(entry).length > 0);
}

function publicKeyEntry(source: string | undefined): KernelEntry | undefined {
  if (source === "keyPair") {
    return selectedOfType("KEY_PAIR");
  }
  if (source === "trusted") {
    return selectedOfType("TRUSTED_CERT");
  }
  return selectedOfType("KEY_PAIR") ?? selectedOfType("TRUSTED_CERT");
}

function writeFile(path: string, bytes: Uint8Array, password?: string): void {
  if (pathHasMissingDir(path)) {
    fail("notFound");
    return;
  }
  host.vfsWrite(path, bytes);
  if (password !== undefined) {
    host.recordWrites([{ path, bytes, password }]);
  }
  succeed();
}

function requirePassword(params: CommandParams | undefined, dialog: string): string | undefined {
  const active = getActive();
  const password = passwordOf(params);
  if (password === undefined) {
    host.openDialog(dialog);
    return undefined;
  }
  if (active?.password !== undefined && password !== active.password) {
    fail("wrongPassword");
    return undefined;
  }
  return password;
}

async function exportCsv(params?: CommandParams): Promise<void> {
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  if (cancelled(params)) {
    fail("cancelled");
    return;
  }
  const path = str(params, "path");
  if (!path) {
    host.openDialog("dialog.export-csv");
    return;
  }
  writeFile(path, encodeCsv(active.store.entries));
}

async function exportKeyPair(params?: CommandParams): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  if (cancelled(params)) {
    fail("cancelled");
    return;
  }
  const entry = selectedOfType("KEY_PAIR");
  if (!entry || entry.entryType !== "KEY_PAIR") {
    fail("emptySelection");
    return;
  }
  const format = str(params, "format") ?? "PKCS12";
  if (format !== "PKCS12") {
    fail("unsupportedType");
    return;
  }
  const path = str(params, "path");
  const password = requirePassword(params, "dialog.export-key-pair");
  if (!path) {
    host.openDialog("dialog.export-key-pair");
    return;
  }
  if (password === undefined) {
    return;
  }
  const saved = await kernelSave(
    {
      type: "PKCS12",
      dirty: false,
      entries: [cloneEntry(entry)],
    },
    password,
  );
  if (!saved.ok) {
    fail(saved.errorId);
    return;
  }
  writeFile(path, saved.bytes, password);
}

async function exportCertificate(params?: CommandParams): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  if (cancelled(params)) {
    fail("cancelled");
    return;
  }
  const source = str(params, "source");
  const entries = certEntries(source);
  if (entries.length === 0) {
    fail("emptySelection");
    return;
  }
  const path = str(params, "path");
  if (!path) {
    host.openDialog("dialog.export-certificates");
    return;
  }
  const certs = entries.flatMap(certificatesOf);
  if (certs.length === 0) {
    fail("emptySelection");
    return;
  }
  writeFile(path, encodeCertificatesPem(certs));
}

async function exportPrivateKey(params?: CommandParams): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  if (cancelled(params)) {
    fail("cancelled");
    return;
  }
  const entry = selectedOfType("KEY_PAIR");
  if (!entry || entry.entryType !== "KEY_PAIR") {
    fail("emptySelection");
    return;
  }
  const format = str(params, "format") ?? "PKCS8";
  if (format !== "PKCS8") {
    fail("unsupportedType");
    return;
  }
  const path = str(params, "path");
  const password = requirePassword(params, "dialog.export-private-key-type");
  if (!path) {
    host.openDialog("dialog.export-private-key-type");
    return;
  }
  if (password === undefined) {
    return;
  }
  writeFile(path, encodePkcs8Pem(entry.pkcs8));
}

async function exportPublicKey(params?: CommandParams): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  if (cancelled(params)) {
    fail("cancelled");
    return;
  }
  const entry = publicKeyEntry(str(params, "source"));
  if (!entry) {
    fail("emptySelection");
    return;
  }
  const certs = certificatesOf(entry);
  const cert = certs[0];
  if (!cert) {
    fail("emptySelection");
    return;
  }
  const path = str(params, "path");
  if (!path) {
    host.openDialog("dialog.export-public-key");
    return;
  }
  try {
    writeFile(path, encodePublicKeyPem(cert));
  } catch {
    fail("invalidFile");
  }
}

function cancelCommand(): void {
  fail("cancelled");
}

function hasKeyPairSelection(): boolean {
  return selectedOfType("KEY_PAIR") !== undefined;
}

function hasCertSelection(): boolean {
  return certEntries(undefined).length > 0;
}

function hasPublicKeySelection(): boolean {
  return publicKeyEntry(undefined) !== undefined;
}

export const commands: Record<string, CommandSpec> = {
  exportCsv: { canExecute: hasActive, run: exportCsv },
  exportKeyPair: { canExecute: hasKeyPairSelection, run: exportKeyPair },
  exportCertificate: { canExecute: hasCertSelection, run: exportCertificate },
  exportPrivateKey: { canExecute: hasKeyPairSelection, run: exportPrivateKey },
  exportPublicKey: { canExecute: hasPublicKeySelection, run: exportPublicKey },
  cancel: { run: cancelCommand },
};
