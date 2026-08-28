import { historyCanRedo, historyCanUndo } from "../../shell/session";
import type { CommandSpec } from "../../shell/types";
import { hasActive } from "./active";
import { caCertificateCommands } from "./ca-certificates";
import { compareCommands } from "./compare";
import { findCommand } from "./find";
import { redoCommand, undoCommand } from "./history";
import { passwordCommands } from "./password";
import { storeCommands } from "./store";

export const commands: Record<string, CommandSpec> = {
  undo: { canExecute: historyCanUndo, run: undoCommand },
  redo: { canExecute: historyCanRedo, run: redoCommand },
  find: { canExecute: hasActive, run: findCommand },
  ...passwordCommands,
  ...storeCommands,
  ...caCertificateCommands,
  ...compareCommands,
};
