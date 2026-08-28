import type { ComponentType } from "react";
import type { ErrorId, KernelResult, KeyStore } from "../kernel";

/** YAML `when` parameter bag. Drivers pass maps; UI clicks omit keys. */
export type CommandParams = Record<string, unknown>;

/** Kernel errors plus session-only oracles such as password confirm mismatch. */
export type SessionErrorId = ErrorId | "passwordMismatch";

export interface CommandSpec {
  canExecute?: () => boolean;
  run: (params?: CommandParams) => Promise<void> | void;
}

export interface FeatureModule {
  commands?: Record<string, CommandSpec>;
  dialogs?: Record<string, ComponentType>;
}

/** One open keystore tab. Features read this via `getActive()`. */
export interface TabState {
  id: string;
  name: string;
  path?: string;
  password?: string;
  store: KeyStore;
  bytes?: Uint8Array;
  /** Aliases unlocked for this tab. KEY / KEY_PAIR start locked. */
  unlocked?: string[];
}

export interface LastWrite {
  path: string;
  bytes: Uint8Array;
  password: string;
}

export interface SessionState {
  tabs: TabState[];
  activeId: string | null;
  selection: string[];
  dialog: string | null;
  errorId?: SessionErrorId;
  exited: boolean;
  vfs: Map<string, Uint8Array>;
  lastWrites: LastWrite[];
}

/** Frozen session API for feature slices. Session ticket fills undo/history. */
export interface SessionApi {
  getActive: () => TabState | null;
  getSelection: () => string[];
  apply: (result: KernelResult) => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

export interface MenuItemDef {
  id: string;
  label: string;
  command?: string;
  stub?: boolean;
  submenu?: MenuItemDef[];
  separatorBefore?: boolean;
}

export interface MenuDef {
  id: string;
  label: string;
  items: MenuItemDef[];
}
