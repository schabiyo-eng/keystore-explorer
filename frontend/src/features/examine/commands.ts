import type { CommandSpec } from "../../shell/types";
import { examineClipboard, resetClipboard, setClipboardCommand } from "./clipboard";
import { detectFileType } from "./detect-file-type";
import type { ExamineCommand } from "./dialog-ids";
import { cancelCommand } from "./dismiss";
import { examineFile } from "./file";
import { resetExamineOutcome } from "./outcome";
import { examineSsl, resetSslStub } from "./ssl";
import { resetExamineView } from "./view";

function alwaysEnabled(): boolean {
  return true;
}

export function resetExamineState(): void {
  resetClipboard();
  resetExamineOutcome();
  resetExamineView();
  resetSslStub();
}

export const commands: Record<ExamineCommand, CommandSpec> = {
  examineFile: { canExecute: alwaysEnabled, run: examineFile },
  examineClipboard: { canExecute: alwaysEnabled, run: examineClipboard },
  examineSsl: { canExecute: alwaysEnabled, run: examineSsl },
  detectFileType: { canExecute: alwaysEnabled, run: detectFileType },
  setClipboard: { run: setClipboardCommand },
  cancel: { run: cancelCommand },
};
