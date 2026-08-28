import { beforeEach, describe, expect, it } from "vitest";
import { emptyStore } from "../../kernel/store";
import { loadFeatures } from "../../shell/loadFeatures";
import { resetRegistry, runCommand } from "../../shell/registry";
import { getActive, host, resetSession } from "../../shell/session";
import { commands } from "./commands";
import {
  defaultFetchLatestVersion,
  isNewer,
  LATEST_VERSION_URL,
  setFetchLatestVersion,
  updateResultMessage,
  versionParts,
} from "./update";
import { foldCancel } from "./yaml";

describe("foldCancel", () => {
  it("turns a trailing cancel primitive into cancel: true on the command", () => {
    const folded = foldCancel([{ about: {} }, { cancel: {} }]);
    expect(folded).toEqual([{ about: { cancel: true } }]);
  });

  it("leaves a single-step when unchanged", () => {
    const when = [{ jars: {} }];
    expect(foldCancel(when)).toEqual(when);
  });
});

describe("chrome command map", () => {
  it("owns Help chrome commands and does not own generateKeyPair", () => {
    expect(commands.about).toBeDefined();
    expect(commands.jars).toBeDefined();
    expect(commands.securityProviders).toBeDefined();
    expect(commands.systemInformation).toBeDefined();
    expect(commands.checkUpdate).toBeDefined();
    expect(commands.generateKeyPair).toBeUndefined();
  });
});

describe("chrome commands", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    loadFeatures();
    setFetchLatestVersion(async () => "5.7.0");
  });

  it("opens About without apply or dirtying a store", async () => {
    host.addTab({
      id: "store",
      name: "store.p12",
      password: "password",
      store: emptyStore(true),
    });
    await runCommand("about");
    expect(host.getState().dialog).toBe("dialog.about");
    expect(host.getState().errorId).toBeUndefined();
    expect(getActive()?.store.dirty).toBe(true);
    expect(getActive()?.store.entries).toEqual([]);
  });

  it("cancels JARs with errorId cancelled and no dialog", async () => {
    await runCommand("jars", { cancel: true });
    expect(host.getState().errorId).toBe("cancelled");
    expect(host.getState().dialog).toBeNull();
  });

  it("shows check-update from an injected version fixture", async () => {
    await runCommand("checkUpdate");
    expect(host.getState().dialog).toBe("dialog.check-update");
    expect(host.getState().errorId).toBeUndefined();
    expect(host.getState().tabs).toEqual([]);
  });

  it("maps a failing update fixture to networkError and dialog.problem", async () => {
    setFetchLatestVersion(async () => {
      throw new Error("offline");
    });
    await runCommand("checkUpdate");
    expect(host.getState().errorId).toBe("networkError");
    expect(host.getState().dialog).toBe("dialog.problem");
  });
});

describe("update helpers", () => {
  it("compares dotted versions", () => {
    expect(versionParts("5.7.0")).toEqual([5, 7, 0]);
    expect(isNewer("5.8.0", "5.7.0")).toBe(true);
    expect(isNewer("5.7.0", "5.7.0")).toBe(false);
    expect(isNewer("5.6.9", "5.7.0")).toBe(false);
    expect(updateResultMessage("5.7.0")).toContain("is the latest");
    expect(updateResultMessage("5.8.1")).toContain("5.8.1");
  });

  it("default fetch uses the Swing version URL and rejects a failed response", async () => {
    const original = globalThis.fetch;
    try {
      globalThis.fetch = (async () =>
        ({ ok: false, text: async () => "" }) as Response) as typeof fetch;
      await expect(defaultFetchLatestVersion()).rejects.toThrow("network");
      globalThis.fetch = (async (input: RequestInfo | URL) => {
        expect(String(input)).toBe(LATEST_VERSION_URL);
        return { ok: true, text: async () => " 5.9.0 \n" } as Response;
      }) as typeof fetch;
      await expect(defaultFetchLatestVersion()).resolves.toBe("5.9.0");
    } finally {
      globalThis.fetch = original;
    }
  });
});
