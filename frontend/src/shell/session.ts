import { cloneStore } from "../kernel/store";
import type { KernelResult } from "../kernel";
import type {
  LastWrite,
  SessionApi,
  SessionErrorId,
  SessionState,
  TabState,
} from "./types";

interface TabSnapshot {
  store: TabState["store"];
  password?: string;
  unlocked: string[];
}

interface TabHistory {
  past: TabSnapshot[];
  future: TabSnapshot[];
}

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
const histories = new Map<string, TabHistory>();

function emptyHistory(): TabHistory {
  return { past: [], future: [] };
}

function historyOf(id: string): TabHistory {
  let history = histories.get(id);
  if (!history) {
    history = emptyHistory();
    histories.set(id, history);
  }
  return history;
}

function unlockedOf(tab: TabState): string[] {
  return [...(tab.unlocked ?? [])];
}

function snapshotOf(tab: TabState): TabSnapshot {
  return {
    store: cloneStore(tab.store),
    password: tab.password,
    unlocked: unlockedOf(tab),
  };
}

function restoreTab(id: string, snapshot: TabSnapshot): void {
  notify({
    ...state,
    errorId: undefined,
    dialog: null,
    tabs: state.tabs.map((tab) =>
      tab.id === id
        ? {
            ...tab,
            store: cloneStore(snapshot.store),
            password: snapshot.password,
            unlocked: [...snapshot.unlocked],
          }
        : tab,
    ),
  });
}

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
  histories.clear();
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

export function historyCanUndo(): boolean {
  const active = getActive();
  if (!active) {
    return false;
  }
  return historyOf(active.id).past.length > 0;
}

export function historyCanRedo(): boolean {
  const active = getActive();
  if (!active) {
    return false;
  }
  return historyOf(active.id).future.length > 0;
}

export function isLocked(alias: string): boolean {
  const active = getActive();
  if (!active) {
    return false;
  }
  const entry = active.store.entries.find((item) => item.alias === alias);
  if (!entry || entry.entryType === "TRUSTED_CERT") {
    return false;
  }
  return !unlockedOf(active).includes(alias);
}

export function unlockAlias(alias: string): void {
  const active = getActive();
  if (!active) {
    return;
  }
  const unlocked = new Set(unlockedOf(active));
  unlocked.add(alias);
  notify({
    ...state,
    tabs: state.tabs.map((tab) =>
      tab.id === active.id ? { ...tab, unlocked: [...unlocked] } : tab,
    ),
  });
}

export function findAlias(query: string): string | null {
  const active = getActive();
  if (!active) {
    return null;
  }
  const needle = query.toLowerCase();
  const aliases = active.store.entries.map((entry) => entry.alias);
  const exact = aliases.find((alias) => alias.toLowerCase() === needle);
  if (exact) {
    return exact;
  }
  return aliases.find((alias) => alias.toLowerCase().includes(needle)) ?? null;
}

/** Snapshot the active tab so a later undo can restore it. No-op with no tab. */
export function pushHistory(): void {
  const active = getActive();
  if (!active) {
    return;
  }
  const history = historyOf(active.id);
  history.past.push(snapshotOf(active));
  history.future = [];
  notify({ ...state });
}

/** Restore the previous snapshot. No-op when the stack is empty or no tab. */
export function undo(): void {
  const active = getActive();
  if (!active) {
    return;
  }
  const history = historyOf(active.id);
  const previous = history.past.pop();
  if (!previous) {
    return;
  }
  history.future.push(snapshotOf(active));
  restoreTab(active.id, previous);
}

/** Restore the next snapshot. No-op when the stack is empty or no tab. */
export function redo(): void {
  const active = getActive();
  if (!active) {
    return;
  }
  const history = historyOf(active.id);
  const next = history.future.pop();
  if (!next) {
    return;
  }
  history.past.push(snapshotOf(active));
  restoreTab(active.id, next);
}

export const session: SessionApi = Object.freeze({
  getActive,
  getSelection,
  apply,
  pushHistory,
  undo,
  redo,
});

export function addTab(tab: TabState): void {
  histories.set(tab.id, emptyHistory());
  notify({
    ...state,
    tabs: [...state.tabs, { ...tab, unlocked: tab.unlocked ?? [] }],
    activeId: tab.id,
    selection: [],
    errorId: undefined,
    dialog: null,
    exited: false,
  });
}

export function removeTab(id: string): void {
  histories.delete(id);
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

export function setError(errorId: SessionErrorId): void {
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
