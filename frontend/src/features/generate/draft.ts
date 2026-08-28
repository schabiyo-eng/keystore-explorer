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
