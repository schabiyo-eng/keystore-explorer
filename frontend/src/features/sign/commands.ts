import { generateKeyPair, isKeyPairEntry } from "../../kernel";
import { ok } from "../../kernel/result";
import { cloneStore } from "../../kernel/store";
import { apply, getActive, host, pushHistory } from "../../shell/session";
import type { CommandParams, CommandSpec } from "../../shell/types";
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
import {
  GENERATE_CSR_DIALOG,
  SIGN_CRL_DIALOG,
  SIGN_CSR_DIALOG,
  SIGN_FILE_DIALOG,
  SIGN_JAR_DIALOG,
  SIGN_JWT_DIALOG,
  SIGN_MIDLET_DIALOG,
  VIEW_JWT_DIALOG,
} from "./dialog-ids";
import { readNamedBytes } from "./fixtures";
import { fail, succeed } from "./outcome";
import { fileBasename, flag, num, obj, passwordOf, str } from "./params";
import { textBytes } from "./pem";
import { canSign, selectedKeyPair } from "./selection";
import { withSigner } from "./signer";

async function generateCsr(params?: CommandParams): Promise<void> {
  await withSigner(
    params,
    GENERATE_CSR_DIALOG,
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
    SIGN_CSR_DIALOG,
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
    SIGN_FILE_DIALOG,
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
    SIGN_JAR_DIALOG,
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
    SIGN_JWT_DIALOG,
    (bag) => Boolean(obj(bag, "claims")),
    async (entry, bag) => {
      const jwt = await signJwt(obj(bag, "claims")!, entry);
      setLastJwt(jwt);
      setOsClipboard(jwt);
      host.clearError();
      host.openDialog(VIEW_JWT_DIALOG);
    },
  );
}

async function signCrl(params?: CommandParams): Promise<void> {
  await withSigner(
    params,
    SIGN_CRL_DIALOG,
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
    SIGN_MIDLET_DIALOG,
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
    host.openDialog(SIGN_CSR_DIALOG);
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
