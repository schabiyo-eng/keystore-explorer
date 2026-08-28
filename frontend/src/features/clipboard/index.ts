import type { ComponentType } from "react";

export { commands } from "./commands";

/** Paste replace uses the File-shell `dialog.confirm`; do not clobber it. */
export const dialogs: Record<string, ComponentType> = {};
