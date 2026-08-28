import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { expect } from "vitest";
import {
  generateKeyPair,
  importTrustedCertificate,
  load,
  putSecretKey,
  reopenSucceeds as kernelReopen,
  save,
  type KeyStore,
} from "../kernel";
import { emptyStore } from "../kernel/store";
import { resolvePassword } from "../features/file/index";
import { isControlEnabled } from "./controls";
import { fileBasename, pathHasMissingDir, untitledTabName } from "./paths";
import { runCommand } from "./registry";
import {
  getActive,
  getState,
  historyCanRedo,
  historyCanUndo,
  host,
  isLocked,
} from "./session";
import type { CommandParams } from "./types";

const FLOWS_ROOT = path.resolve(process.cwd(), "../functional-tests/flows");
const CERT_FIXTURE = path.resolve(
  process.cwd(),
  "../kse/src/test/resources/testdata/CryptoFileUtilTest/cert.pem.cer",
);

interface Scenario {
  id: string;
  slice: string;
  requires: unknown[];
  blocked?: boolean;
  given: Record<string, unknown>[];
  when: Record<string, unknown>[];
  then: Record<string, unknown>[];
}

function loadSliceScenarios(slice: string): Scenario[] {
  const dir = path.join(FLOWS_ROOT, slice);
  return readdirSync(dir)
    .filter((name) => name.endsWith(".yaml") || name.endsWith(".yml"))
    .map((name) => {
      const raw = readFileSync(path.join(dir, name), "utf8");
      return parse(raw) as Scenario;
    })
    .filter((doc) => !doc.blocked);
}

export function loadFileScenarios(): Scenario[] {
  return loadSliceScenarios("file");
}

export function loadSessionScenarios(): Scenario[] {
  return loadSliceScenarios("session");
}

interface StoreSpec {
  id: string;
  type?: string;
  password?: string;
  dirty?: boolean;
  path?: string;
  entries?: { alias: string; entryType: string }[];
}

async function materializeEntries(
  initial: KeyStore,
  entries: { alias: string; entryType: string }[],
): Promise<KeyStore> {
  let store = initial;
  const certBytes = readFileSync(CERT_FIXTURE);
  for (const entry of entries) {
    if (entry.entryType === "KEY_PAIR") {
      const result = await generateKeyPair(store, {
        algorithm: "RSA",
        alias: entry.alias,
      });
      if (!result.ok) {
        throw new Error(`given KEY_PAIR ${entry.alias}: ${result.errorId}`);
      }
      store = result.store;
    } else if (entry.entryType === "TRUSTED_CERT") {
      const result = await importTrustedCertificate(store, {
        bytes: new Uint8Array(certBytes),
        alias: entry.alias,
      });
      if (!result.ok) {
        throw new Error(`given TRUSTED_CERT ${entry.alias}: ${result.errorId}`);
      }
      store = result.store;
    } else if (entry.entryType === "KEY") {
      const result = await putSecretKey(store, {
        alias: entry.alias,
        secret: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
      });
      if (!result.ok) {
        throw new Error(`given KEY ${entry.alias}: ${result.errorId}`);
      }
      store = result.store;
    } else {
      throw new Error(`given unknown entryType ${entry.entryType}`);
    }
  }
  return store;
}

async function setupStore(spec: StoreSpec): Promise<void> {
  let store = emptyStore(true);
  if (spec.entries?.length) {
    store = await materializeEntries(store, spec.entries);
  }
  store.dirty = spec.dirty ?? true;
  const password = resolvePassword(spec.password);
  let bytes: Uint8Array | undefined;
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
    name: spec.path ? fileBasename(spec.path) : untitledTabName(spec.id),
    path: spec.path,
    password,
    store,
    bytes,
    unlocked: [],
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
    if (item.history) {
      continue;
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
      case "entryType": {
        const spec = value as { alias: string; type: string };
        const entry = active?.store.entries.find((item) => item.alias === spec.alias);
        expect(entry?.entryType).toBe(spec.type);
        break;
      }
      case "selectedAliases":
        expect([...state.selection].sort()).toEqual([...(value as string[])].sort());
        break;
      case "historyCanUndo":
        expect(historyCanUndo()).toBe(value);
        break;
      case "historyCanRedo":
        expect(historyCanRedo()).toBe(value);
        break;
      case "locked": {
        const spec = value as { alias: string; locked: boolean };
        expect(isLocked(spec.alias)).toBe(spec.locked);
        break;
      }
      default:
        throw new Error(`unimplemented oracle ${key}`);
    }
  }
}
