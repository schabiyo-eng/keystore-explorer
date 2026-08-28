import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { expect } from "vitest";
import { load, reopenSucceeds as kernelReopen, save } from "../kernel";
import { emptyStore } from "../kernel/store";
import { resolvePassword } from "../features/file/index";
import { isControlEnabled } from "./controls";
import { runCommand } from "./registry";
import { getActive, getState, host } from "./session";
import type { CommandParams } from "./types";

const FLOW_DIR = path.resolve(process.cwd(), "../functional-tests/flows/file");

interface Scenario {
  id: string;
  slice: string;
  requires: unknown[];
  blocked?: boolean;
  given: Record<string, unknown>[];
  when: Record<string, unknown>[];
  then: Record<string, unknown>[];
}

export function loadFileScenarios(): Scenario[] {
  return readdirSync(FLOW_DIR)
    .filter((name) => name.endsWith(".yaml") || name.endsWith(".yml"))
    .map((name) => {
      const raw = readFileSync(path.join(FLOW_DIR, name), "utf8");
      return parse(raw) as Scenario;
    })
    .filter((doc) => !doc.blocked);
}

function basename(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] || filePath;
}

function untitledName(id: string): string {
  if (id.startsWith("untitled-")) {
    return `Untitled-${id.slice("untitled-".length)}`;
  }
  return id;
}

interface StoreSpec {
  id: string;
  type?: string;
  password?: string;
  dirty?: boolean;
  path?: string;
  entries?: { alias: string; entryType: string }[];
}

function pathHasMissingDir(filePath: string): boolean {
  return filePath.includes("/") || filePath.includes("\\");
}

async function setupStore(spec: StoreSpec): Promise<void> {
  const created = emptyStore(true);
  created.dirty = spec.dirty ?? true;
  const password = resolvePassword(spec.password);
  let bytes: Uint8Array | undefined;
  let store = created;
  if (spec.path && password && !pathHasMissingDir(spec.path)) {
    const saved = await save(store, password);
    if (!saved.ok) {
      throw new Error(`given openStores save failed: ${saved.errorId}`);
    }
    host.vfsWrite(spec.path, saved.bytes);
    bytes = saved.bytes;
    store = { ...saved.store, dirty: spec.dirty ?? false };
  }
  host.addTab({
    id: spec.id,
    name: spec.path ? basename(spec.path) : untitledName(spec.id),
    path: spec.path,
    password,
    store,
    bytes,
  });
}

export async function applyGiven(given: Record<string, unknown>[]): Promise<void> {
  for (const item of given) {
    if (item.appStarted) {
      continue;
    }
    if (Array.isArray(item.openStores)) {
      for (const spec of item.openStores as StoreSpec[]) {
        await setupStore(spec);
      }
    }
    if (typeof item.activeStore === "string") {
      host.setActive(item.activeStore);
    }
    if (Array.isArray(item.selection)) {
      host.setSelection(item.selection as string[]);
    }
  }
}

export async function applyWhen(when: Record<string, unknown>[]): Promise<void> {
  for (const step of when) {
    const name = Object.keys(step)[0];
    if (!name) {
      continue;
    }
    const params = (step[name] ?? {}) as CommandParams;
    await runCommand(name, params);
  }
}

function controlDisabled(id: string): boolean {
  const el = document.querySelector(`[data-testid="${id}"]`);
  if (!el) {
    return true;
  }
  if (el instanceof HTMLInputElement || el instanceof HTMLButtonElement) {
    return el.disabled;
  }
  return el.getAttribute("aria-disabled") === "true" || el.hasAttribute("disabled");
}

export async function applyThen(then: Record<string, unknown>[]): Promise<void> {
  const state = getState();
  const active = getActive();

  for (const item of then) {
    const key = Object.keys(item)[0];
    if (!key) {
      continue;
    }
    const value = item[key];
    switch (key) {
      case "keystoreOpen":
        expect(state.tabs.length > 0).toBe(value);
        break;
      case "type":
        expect(active?.store.type).toBe(value);
        break;
      case "aliases": {
        const aliases = active?.store.entries.map((entry) => entry.alias) ?? [];
        expect([...aliases].sort()).toEqual([...(value as string[])].sort());
        break;
      }
      case "entryCount":
        expect(active?.store.entries.length ?? 0).toBe(value);
        break;
      case "dirty":
        expect(active?.store.dirty).toBe(value);
        break;
      case "tabCount":
        expect(state.tabs.length).toBe(value);
        break;
      case "activeStore":
        expect(state.activeId).toBe(value);
        break;
      case "dialogShown":
        expect(state.dialog).toBe(value);
        break;
      case "errorId":
        expect(state.errorId).toBe(value);
        break;
      case "appExited":
        expect(state.exited).toBe(value);
        break;
      case "fileExists": {
        const spec = value as { path: string; exists: boolean };
        expect(state.vfs.has(spec.path)).toBe(spec.exists);
        break;
      }
      case "reopenSucceeds": {
        expect(state.lastWrites.length).toBeGreaterThan(0);
        for (const write of state.lastWrites) {
          const loaded = await load(write.bytes, write.password);
          expect(loaded.ok).toBe(value);
          expect(await kernelReopen(write.bytes, write.password)).toBe(value);
        }
        break;
      }
      case "controlEnabled": {
        const spec = value as { id: string; enabled: boolean };
        const el = document.querySelector(`[data-testid="${spec.id}"]`);
        expect(el, `missing control ${spec.id}`).not.toBeNull();
        expect(!controlDisabled(spec.id)).toBe(spec.enabled);
        expect(isControlEnabled(spec.id)).toBe(spec.enabled);
        break;
      }
      default:
        throw new Error(`unimplemented oracle ${key}`);
    }
  }
}
