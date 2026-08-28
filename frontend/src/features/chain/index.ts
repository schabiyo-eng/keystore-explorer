import type { ComponentType } from "react";

export { commands } from "./commands";

/** Chain reuses shell file-open / confirm and details inspect — do not clobber those ids. */
export const dialogs: Record<string, ComponentType> = {};
