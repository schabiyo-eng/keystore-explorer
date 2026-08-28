import type { CommandSpec } from "../../shell/types";
import { cancelCommand } from "./abortable";
import { resetClipboard, setClipboardCommand } from "./clipboard";
import { importKeyPair } from "./import-key-pair";
import { resetImportOutcome } from "./outcome";
import { resetPendingAliasCommand } from "./pending";
import { importCaReplyFromClipboard, importCaReplyFromFile } from "./reply";
import { hasActive, hasKeyPairSelection } from "./selection";
import { importTrustedCertificate } from "./trusted";

export function resetImportState(): void {
  resetImportOutcome();
  resetPendingAliasCommand();
  resetClipboard();
}

export const commands: Record<string, CommandSpec> = {
  // file-new-pkcs12 freezes this control disabled; YAML still calls run().
  importTrustedCertificate: { canExecute: () => false, run: importTrustedCertificate },
  importKeyPair: { canExecute: hasActive, run: importKeyPair },
  importCaReplyFromFile: {
    canExecute: hasKeyPairSelection,
    run: importCaReplyFromFile,
  },
  importCaReplyFromClipboard: {
    canExecute: hasKeyPairSelection,
    run: importCaReplyFromClipboard,
  },
  cancel: { run: cancelCommand },
  setClipboard: { run: setClipboardCommand },
};
