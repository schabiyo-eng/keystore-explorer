import { generateKeyPair, isKeyPairEntry } from "../../kernel";
import { ok } from "../../kernel/result";
import { cloneStore } from "../../kernel/store";
import type { KeyPairEntry } from "../../kernel/types";
import { getActive, getSelection, host, pushHistory, apply } from "../../shell/session";
import type { CommandParams, CommandSpec } from "../../shell/types";
import { flag, passwordOf, str } from "../file/params";
import { fail, succeed } from "../session/outcome";
import { clearOsClipboard, setLastJwt, setOsClipboard } from "./clipboard";
import {
  generateCsrPem,
  issueKeyPairCertificate,
  signCms,
  signCrlDer,
  signCsrToCertPem,
  signJarBytes,
  signJwt,
  signMidletJad,
} from "./crypto";
import { readNamedBytes } from "./fixtures";
import { textBytes } from "./pem";

function canSign(): boolean {
  const active = getActive();
  const alias = getSelection()[0];
  if (!active || !alias) {
    return false;
  }
  const entry = active.store.entries.find((item) => item.alias === alias);
  return Boolean(entry && isKeyPairEntry(entry));
}

function selectedKeyPair(): { alias: string; entry: KeyPairEntry } | undefined {
  const active = getActive();
  const alias = getSelection()[0];
  if (!active || !alias) {
    return undefined;
  }
  const entry = active.store.entries.find((item) => item.alias === alias);
  if (!entry || !isKeyPairEntry(entry)) {
    return undefined;
  }
  return { alias, entry };
}

function obj(params: CommandParams | undefined, key: string): Record<string, unknown> | undefined {
  const value = params?.[key];
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function num(params: CommandParams | undefined, key: string): number | undefined {
  const value = params?.[key];
  return typeof value === "number" ? value : undefined;
}

function fileBasename(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] || filePath;
}

async function withSigner(
  params: CommandParams | undefined,
  dialogId: string,
  ready: (params: CommandParams) => boolean,
  run: (entry: KeyPairEntry, params: CommandParams) => Promise<void>,
): Promise<void> {
  if (flag(params, "cancel")) {
    clearOsClipboard();
    fail("cancelled");
    return;
  }
  if (flag(params, "dismiss")) {
    succeed();
    return;
  }
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  const selected = selectedKeyPair();
  if (!selected) {
    fail("emptySelection");
    return;
  }
  const password = passwordOf(params);
  if (password === undefined) {
    host.openDialog("dialog.password");
    return;
  }
  if (password !== active.password) {
    clearOsClipboard();
    fail("wrongPassword");
    return;
  }
  if (!ready(params ?? {})) {
    host.openDialog(dialogId);
    return;
  }
  try {
    await run(selected.entry, params ?? {});
  } catch {
    fail("invalidFile");
  }
}

async function generateCsr(params?: CommandParams): Promise<void> {
  await withSigner(
    params,
    "dialog.generate-csr",
    (bag) => Boolean(str(bag, "path")),
    async (entry, bag) => {
      const pem = await generateCsrPem(entry);
      host.vfsWrite(str(bag, "path")!, textBytes(pem));
      setOsClipboard(pem);
      succeed();
    },
  );
}

async function signCsr(params?: CommandParams): Promise<void> {
  await withSigner(
    params,
    "dialog.sign-csr",
    (bag) => Boolean(str(bag, "fixture") && str(bag, "path")),
    async (entry, bag) => {
      const source = str(bag, "fixture") ?? str(bag, "path")!;
      const csr = readNamedBytes(source);
      if (!csr) {
        fail("notFound");
        return;
      }
      const pem = await signCsrToCertPem(csr, entry);
      host.vfsWrite(str(bag, "path")!, textBytes(pem));
      succeed();
    },
  );
}

async function signFile(params?: CommandParams): Promise<void> {
  await withSigner(
    params,
    "dialog.sign-file",
    (bag) => Boolean((str(bag, "fixture") ?? str(bag, "input")) && str(bag, "path")),
    async (entry, bag) => {
      const source = str(bag, "fixture") ?? str(bag, "input")!;
      const content = readNamedBytes(source);
      if (!content) {
        fail("notFound");
        return;
      }
      const cms = await signCms(content, entry);
      host.vfsWrite(str(bag, "path")!, cms);
      succeed();
    },
  );
}

async function signJar(params?: CommandParams): Promise<void> {
  await withSigner(
    params,
    "dialog.sign-jar",
    (bag) => Boolean(str(bag, "path")),
    async (entry, bag) => {
      const signed = await signJarBytes(entry);
      host.vfsWrite(str(bag, "path")!, signed);
      succeed();
    },
  );
}

async function signJwtCommand(params?: CommandParams): Promise<void> {
  await withSigner(
    params,
    "dialog.sign-jwt",
    (bag) => Boolean(obj(bag, "claims")),
    async (entry, bag) => {
      const jwt = await signJwt(obj(bag, "claims")!, entry);
      setLastJwt(jwt);
      setOsClipboard(jwt);
      host.clearError();
      host.openDialog("dialog.view-jwt");
    },
  );
}

async function signCrl(params?: CommandParams): Promise<void> {
  await withSigner(
    params,
    "dialog.sign-crl",
    (bag) => Boolean(str(bag, "path")),
    async (entry, bag) => {
      const der = await signCrlDer(entry);
      host.vfsWrite(str(bag, "path")!, der);
      succeed();
    },
  );
}

async function signMidlet(params?: CommandParams): Promise<void> {
  await withSigner(
    params,
    "dialog.sign-midlet",
    (bag) => Boolean(str(bag, "jad")),
    async (entry, bag) => {
      const jadPath = str(bag, "jad")!;
      const jarPath = str(bag, "jar") ?? jadPath.replace(/\.jad$/i, ".jar");
      const existingJar = host.vfsRead(jarPath) ?? readNamedBytes(jarPath);
      const jarBytes = existingJar ?? (await signJarBytes(entry));
      if (!existingJar) {
        host.vfsWrite(jarPath, jarBytes);
      }
      const jad = await signMidletJad(jarBytes, fileBasename(jarPath), entry);
      host.vfsWrite(jadPath, textBytes(jad));
      succeed();
    },
  );
}

async function signNewKeyPair(params?: CommandParams): Promise<void> {
  if (flag(params, "cancel")) {
    fail("cancelled");
    return;
  }
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  const selected = selectedKeyPair();
  if (!selected) {
    fail("emptySelection");
    return;
  }
  const password = passwordOf(params);
  if (password === undefined) {
    host.openDialog("dialog.password");
    return;
  }
  if (password !== active.password) {
    fail("wrongPassword");
    return;
  }
  const alias = str(params, "alias");
  const algorithm = str(params, "algorithm") ?? "RSA";
  if (!alias) {
    host.openDialog("dialog.sign-csr");
    return;
  }
  const generated = await generateKeyPair(active.store, {
    algorithm,
    keySize: num(params, "keySize"),
    alias,
  });
  if (!generated.ok) {
    apply(generated);
    host.closeDialog();
    return;
  }
  const created = generated.store.entries.find((entry) => entry.alias === alias);
  if (!created || !isKeyPairEntry(created)) {
    fail("invalidFile");
    return;
  }
  const leaf = await issueKeyPairCertificate(created.certificates[0]!, selected.entry);
  const next = cloneStore(generated.store);
  const index = next.entries.findIndex((entry) => entry.alias === alias);
  const current = next.entries[index];
  if (!current || !isKeyPairEntry(current)) {
    fail("invalidFile");
    return;
  }
  current.certificates = [leaf, ...selected.entry.certificates];
  pushHistory();
  apply(ok(next));
  succeed();
}

async function cancelCommand(): Promise<void> {
  clearOsClipboard();
  fail("cancelled");
}

const spec = (run: (params?: CommandParams) => Promise<void>): CommandSpec => ({
  canExecute: canSign,
  run,
});

export const commands: Record<string, CommandSpec> = {
  generateCsr: spec(generateCsr),
  signCsr: spec(signCsr),
  signFile: spec(signFile),
  signJar: spec(signJar),
  signJwt: spec(signJwtCommand),
  signCrl: spec(signCrl),
  signMidlet: spec(signMidlet),
  signNewKeyPair: spec(signNewKeyPair),
  cancel: { canExecute: () => true, run: cancelCommand },
};
