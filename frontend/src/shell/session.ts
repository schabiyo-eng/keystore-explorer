import { cloneStore } from "../kernel/store";
import type { ErrorId, KernelResult } from "../kernel";
import type { LastWrite, SessionApi, SessionState, TabState } from "./types";

const listeners = new Set<() => void>();

function emptyState(): SessionState {
  return {
    tabs: [],
    activeId: null,
    selection: [],
    dialog: null,
    errorId: undefined,
    exited: false,
    vfs: new Map(),
    lastWrites: [],
  };
}

let state: SessionState = emptyState();

function notify(next: SessionState): void {
  state = next;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getState(): SessionState {
  return state;
}

export function resetSession(): void {
  notify(emptyState());
}

export function getActive(): TabState | null {
  if (!state.activeId) {
    return null;
  }
  return state.tabs.find((tab) => tab.id === state.activeId) ?? null;
}

export function getSelection(): string[] {
  return [...state.selection];
}

export function apply(result: KernelResult): void {
  if (!result.ok) {
    notify({ ...state, errorId: result.errorId });
    return;
  }
  const active = getActive();
  if (!active) {
    return;
  }
  notify({
    ...state,
    errorId: undefined,
    dialog: null,
    tabs: state.tabs.map((tab) =>
      tab.id === active.id ? { ...tab, store: cloneStore(result.store) } : tab,
    ),
  });
}

/** Session slice fills these. File ships no-ops so the API is frozen. */
export function pushHistory(): void {}
export function undo(): void {}
export function redo(): void {}

export const session: SessionApi = Object.freeze({
  getActive,
  getSelection,
  apply,
  pushHistory,
  undo,
  redo,
});

export function addTab(tab: TabState): void {
  notify({
    ...state,
    tabs: [...state.tabs, tab],
    activeId: tab.id,
    selection: [],
    errorId: undefined,
    dialog: null,
    exited: false,
  });
}

export function removeTab(id: string): void {
  const tabs = state.tabs.filter((tab) => tab.id !== id);
  const activeId =
    state.activeId === id ? (tabs[tabs.length - 1]?.id ?? null) : state.activeId;
  notify({
    ...state,
    tabs,
    activeId,
    selection: state.activeId === id ? [] : state.selection,
  });
}

export function replaceTabs(tabs: TabState[], activeId: string | null): void {
  notify({
    ...state,
    tabs,
    activeId,
    selection: tabs.some((tab) => tab.id === state.activeId) ? state.selection : [],
  });
}

export function updateTab(id: string, patch: Partial<TabState>): void {
  notify({
    ...state,
    tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, ...patch } : tab)),
  });
}

export function setActive(id: string): void {
  if (!state.tabs.some((tab) => tab.id === id)) {
    return;
  }
  notify({ ...state, activeId: id, selection: [] });
}

export function setSelection(aliases: string[]): void {
  notify({ ...state, selection: [...aliases] });
}

export function openDialog(id: string): void {
  notify({ ...state, dialog: id });
}

export function closeDialog(): void {
  notify({ ...state, dialog: null });
}

export function setError(errorId: ErrorId): void {
  notify({ ...state, errorId });
}

export function clearError(): void {
  notify({ ...state, errorId: undefined });
}

export function setExited(exited: boolean): void {
  notify({ ...state, exited });
}

export function vfsWrite(path: string, bytes: Uint8Array): void {
  const vfs = new Map(state.vfs);
  vfs.set(path, bytes);
  notify({ ...state, vfs });
}

export function vfsRead(path: string): Uint8Array | undefined {
  return state.vfs.get(path);
}

export function vfsHas(path: string): boolean {
  return state.vfs.has(path);
}

export function recordWrites(writes: LastWrite[]): void {
  notify({ ...state, lastWrites: writes });
}

export const host = {
  addTab,
  removeTab,
  replaceTabs,
  updateTab,
  setActive,
  setSelection,
  openDialog,
  closeDialog,
  setError,
  clearError,
  setExited,
  vfsWrite,
  vfsRead,
  vfsHas,
  recordWrites,
  getState,
  resetSession,
};
