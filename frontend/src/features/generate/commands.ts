import {
  generateKeyPair as kernelGenerateKeyPair,
  putSecretKey,
} from "../../kernel";
import { getActive, host, pushHistory, session } from "../../shell/session";
import type { CommandParams, CommandSpec } from "../../shell/types";
import { clearDraft, getDraft, patchDraft } from "./draft";
import { dhParametersPem } from "./dh";
import { fail, succeed } from "./outcome";
import { flag, num, resolvePassword, str } from "./params";
import { generateAesKey } from "./secret";

let lastDhPem = "";

export function lastDhParametersPem(): string {
  return lastDhPem;
}

function hasActive(): boolean {
  return getActive() !== null;
}

/**
 * Enable generate once a tab is a real file or already has entries.
 * File YAML `file-new-pkcs12` still asserts Tools → Generate Key Pair stays
 * disabled on a brand-new untitled empty store (the host snapshot before
 * this slice). That scenario is: no path, no entries, dirty.
 */
function canGenerate(): boolean {
  const active = getActive();
  if (!active) {
    return false;
  }
  if (!active.path && active.store.entries.length === 0 && active.store.dirty) {
    return false;
  }
  return true;
}

function mergeString(key: "algorithm" | "alias" | "passphrase", params?: CommandParams): void {
  const value = str(params, key);
  if (value !== undefined) {
    patchDraft({ [key]: value });
  }
}

function mergeNumber(key: "keySize" | "size", params?: CommandParams): void {
  const value = num(params, key);
  if (value !== undefined) {
    patchDraft({ [key]: value });
  }
}

async function commitKernel(
  run: () => Promise<Awaited<ReturnType<typeof putSecretKey>>>,
): Promise<void> {
  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }
  const result = await run();
  if (!result.ok) {
    clearDraft();
    fail(result.errorId);
    return;
  }
  pushHistory();
  session.apply(result);
  clearDraft();
}

export async function generateKeyPairCommand(params?: CommandParams): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    clearDraft();
    fail("cancelled");
    return;
  }

  mergeString("algorithm", params);
  mergeNumber("keySize", params);
  mergeString("alias", params);
  const draft = getDraft();

  if (draft.algorithm && draft.keySize !== undefined && draft.alias) {
    const active = getActive();
    if (!active) {
      fail("storeNotWritable");
      return;
    }
    await commitKernel(() =>
      kernelGenerateKeyPair(active.store, {
        algorithm: draft.algorithm ?? "RSA",
        keySize: draft.keySize,
        alias: draft.alias ?? "",
      }),
    );
    return;
  }

  if (!draft.algorithm || draft.keySize === undefined) {
    host.openDialog("dialog.generate-key-pair");
    return;
  }

  if (flag(params, "fromCert") || draft.stage === "cert") {
    patchDraft({ stage: "alias" });
    host.openDialog("dialog.alias");
    return;
  }

  patchDraft({ stage: "cert" });
  host.openDialog("dialog.generate-key-pair-cert");
}

export async function generateSecretKeyCommand(params?: CommandParams): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    clearDraft();
    fail("cancelled");
    return;
  }

  mergeString("algorithm", params);
  mergeNumber("keySize", params);
  mergeString("alias", params);
  const draft = getDraft();

  if (draft.algorithm && draft.keySize !== undefined && draft.alias) {
    if (draft.algorithm !== "AES") {
      fail("unsupportedType");
      return;
    }
    const secret = await generateAesKey(draft.keySize);
    if (!secret) {
      fail("unsupportedType");
      return;
    }
    const active = getActive();
    if (!active) {
      fail("storeNotWritable");
      return;
    }
    await commitKernel(() => putSecretKey(active.store, { alias: draft.alias ?? "", secret }));
    return;
  }

  if (!draft.algorithm || draft.keySize === undefined) {
    host.openDialog("dialog.generate-secret-key");
    return;
  }

  host.openDialog("dialog.alias");
}

export async function storePassphraseCommand(params?: CommandParams): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    clearDraft();
    fail("cancelled");
    return;
  }

  const passphrase = resolvePassword(params?.passphrase) ?? str(params, "passphrase");
  if (passphrase !== undefined) {
    patchDraft({ passphrase });
  }
  mergeString("alias", params);
  const draft = getDraft();

  if (draft.passphrase && draft.alias) {
    const active = getActive();
    if (!active) {
      fail("storeNotWritable");
      return;
    }
    const secret = new TextEncoder().encode(draft.passphrase);
    await commitKernel(() => putSecretKey(active.store, { alias: draft.alias ?? "", secret }));
    return;
  }

  host.openDialog("dialog.store-passphrase");
}

export async function generateDhParametersCommand(params?: CommandParams): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  if (flag(params, "cancel")) {
    clearDraft();
    lastDhPem = "";
    fail("cancelled");
    return;
  }
  if (flag(params, "dismiss")) {
    clearDraft();
    succeed();
    return;
  }

  mergeNumber("size", params);
  const size = getDraft().size;
  if (size === undefined) {
    host.openDialog("dialog.generate-dh-parameters");
    return;
  }

  const pem = dhParametersPem(size);
  if (!pem) {
    fail("unsupportedType");
    return;
  }
  lastDhPem = pem;
  host.clearError();
  host.openDialog("dialog.view-dh-parameters");
}

export async function cancelCommand(): Promise<void> {
  clearDraft();
  lastDhPem = "";
  fail("cancelled");
}

export const commands: Record<string, CommandSpec> = {
  generateKeyPair: { canExecute: canGenerate, run: generateKeyPairCommand },
  generateSecretKey: { canExecute: canGenerate, run: generateSecretKeyCommand },
  generateDhParameters: { canExecute: canGenerate, run: generateDhParametersCommand },
  storePassphrase: { canExecute: canGenerate, run: storePassphraseCommand },
  cancel: { run: cancelCommand },
};
