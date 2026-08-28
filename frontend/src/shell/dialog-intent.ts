import type { CommandParams } from "./types";

interface DialogIntent {
  command: string;
  params: CommandParams;
}

let intent: DialogIntent | null = null;

/** Snapshot the command that opened a dialog so OK/Cancel can resume it. */
export function beginCommand(name: string, params?: CommandParams): void {
  intent = { command: name, params: { ...(params ?? {}) } };
}

export function currentIntent(): DialogIntent | null {
  return intent;
}

export function clearIntent(): void {
  intent = null;
}
