import { getActive } from "../../shell/session";
import type { CommandSpec } from "../../shell/types";
import { hasSelection } from "../delete-rename/selection";
import { cancelCommand } from "./abortable";
import { hasBuffer } from "./buffer";
import { copy, copyKeyPair, copyTrustedCertificate } from "./copy";
import { cut, cutKeyPair, cutTrustedCertificate } from "./cut";
import { paste } from "./paste";
import { selectTab } from "./tab";

function canPaste(): boolean {
  return getActive() !== null && hasBuffer();
}

export const commands: Record<string, CommandSpec> = {
  copy: { canExecute: hasSelection, run: copy },
  copyKeyPair: { canExecute: hasSelection, run: copyKeyPair },
  copyTrustedCertificate: { canExecute: hasSelection, run: copyTrustedCertificate },
  cut: { canExecute: hasSelection, run: cut },
  cutKeyPair: { canExecute: hasSelection, run: cutKeyPair },
  cutTrustedCertificate: { canExecute: hasSelection, run: cutTrustedCertificate },
  paste: { canExecute: canPaste, run: paste },
  selectTab: { run: selectTab },
  cancel: { run: cancelCommand },
};
