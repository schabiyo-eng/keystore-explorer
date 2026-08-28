export {
  session,
  getActive,
  getSelection,
  apply,
  pushHistory,
  undo,
  redo,
  host,
  historyCanUndo,
  historyCanRedo,
  isLocked,
  findAlias,
} from "./session";
export { registerCommand, registerDialog, registerFeature, runCommand, hasCommand } from "./registry";
export { loadFeatures } from "./loadFeatures";
export type { SessionApi, SessionErrorId, CommandSpec, FeatureModule, TabState } from "./types";
