import type { CommandParams } from "../../shell/types";
import { num, str } from "./params";

/** Wizard fields collected across generate dialogs. YAML supplies them in one `when`. */
export interface GenerateDraft {
  algorithm?: string;
  keySize?: number;
  alias?: string;
  passphrase?: string;
  size?: number;
  stage?: "cert" | "alias";
}

let draft: GenerateDraft = {};

export function getDraft(): GenerateDraft {
  return draft;
}

export function patchDraft(patch: GenerateDraft): GenerateDraft {
  draft = { ...draft, ...patch };
  return draft;
}

export function clearDraft(): void {
  draft = {};
}

/** Fold YAML/UI params into the in-progress generate wizard. */
export function absorbParams(params?: CommandParams): GenerateDraft {
  const patch: GenerateDraft = {};
  const algorithm = str(params, "algorithm");
  if (algorithm !== undefined) {
    patch.algorithm = algorithm;
  }
  const alias = str(params, "alias");
  if (alias !== undefined) {
    patch.alias = alias;
  }
  const keySize = num(params, "keySize");
  if (keySize !== undefined) {
    patch.keySize = keySize;
  }
  const size = num(params, "size");
  if (size !== undefined) {
    patch.size = size;
  }
  return Object.keys(patch).length > 0 ? patchDraft(patch) : draft;
}

/** Which generate command owns the shared alias dialog. */
export function pendingAliasCommand(): "storePassphrase" | "generateSecretKey" | "generateKeyPair" {
  if (draft.passphrase) {
    return "storePassphrase";
  }
  if (draft.algorithm === "AES") {
    return "generateSecretKey";
  }
  return "generateKeyPair";
}
