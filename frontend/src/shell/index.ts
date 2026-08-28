export { session, getActive, getSelection, apply, pushHistory, undo, redo, host } from "./session";
export { registerCommand, registerDialog, registerFeature, runCommand, hasCommand } from "./registry";
export { loadFeatures } from "./loadFeatures";
export type { SessionApi, CommandSpec, FeatureModule, TabState } from "./types";
