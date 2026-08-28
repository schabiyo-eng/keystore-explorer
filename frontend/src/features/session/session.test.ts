import { describe, expect, it, beforeEach } from "vitest";
import { emptyStore } from "../../kernel/store";
import {
  findAlias,
  getActive,
  getSelection,
  historyCanRedo,
  historyCanUndo,
  host,
  isLocked,
  pushHistory,
  redo,
  resetSession,
  session,
  undo,
  unlockAlias,
} from "../../shell/session";

function openTab(id = "store") {
  host.addTab({
    id,
    name: id,
    password: "secret",
    store: emptyStore(false),
    unlocked: [],
  });
}

describe("session history and selection API", () => {
  beforeEach(() => {
    resetSession();
  });

  it("exposes the frozen getActive / getSelection / apply / undo surface", () => {
    expect(session.getActive).toBe(getActive);
    expect(session.getSelection).toBe(getSelection);
    expect(typeof session.apply).toBe("function");
    expect(typeof session.pushHistory).toBe("function");
    expect(typeof session.undo).toBe("function");
    expect(typeof session.redo).toBe("function");
    expect(session.getActive()).toBeNull();
    expect(session.getSelection()).toEqual([]);
  });

  it("undo and redo restore store dirty and password snapshots", () => {
    openTab();
    const active = getActive();
    expect(active).not.toBeNull();
    expect(historyCanUndo()).toBe(false);
    expect(historyCanRedo()).toBe(false);

    pushHistory();
    host.updateTab(active!.id, {
      password: "next",
      store: { ...active!.store, dirty: true },
    });
    expect(historyCanUndo()).toBe(true);
    expect(getActive()?.password).toBe("next");
    expect(getActive()?.store.dirty).toBe(true);

    undo();
    expect(getActive()?.password).toBe("secret");
    expect(getActive()?.store.dirty).toBe(false);
    expect(historyCanUndo()).toBe(false);
    expect(historyCanRedo()).toBe(true);

    redo();
    expect(getActive()?.password).toBe("next");
    expect(getActive()?.store.dirty).toBe(true);
    expect(historyCanUndo()).toBe(true);
    expect(historyCanRedo()).toBe(false);
  });

  it("is a no-op when undo/redo run with no tab or empty stacks", () => {
    session.pushHistory();
    session.undo();
    session.redo();
    expect(getActive()).toBeNull();

    openTab();
    undo();
    redo();
    expect(historyCanUndo()).toBe(false);
    expect(historyCanRedo()).toBe(false);
  });

  it("finds aliases by exact then substring match", () => {
    openTab();
    const active = getActive()!;
    host.updateTab(active.id, {
      store: {
        ...active.store,
        entries: [
          {
            alias: "rsa-keypair",
            entryType: "KEY_PAIR",
            pkcs8: new Uint8Array([1]),
            certificates: [new Uint8Array([2])],
            localKeyId: new Uint8Array([3]),
          },
          {
            alias: "trust",
            entryType: "TRUSTED_CERT",
            certificates: [new Uint8Array([4])],
            localKeyId: new Uint8Array([5]),
          },
        ],
      },
    });
    expect(findAlias("rsa-keypair")).toBe("rsa-keypair");
    expect(findAlias("TRUST")).toBe("trust");
    expect(findAlias("key")).toBe("rsa-keypair");
    expect(findAlias("missing")).toBeNull();
  });

  it("locks KEY and KEY_PAIR aliases until unlockAlias", () => {
    openTab();
    const active = getActive()!;
    host.updateTab(active.id, {
      store: {
        ...active.store,
        entries: [
          {
            alias: "aes-key",
            entryType: "KEY",
            secret: new Uint8Array([1]),
            localKeyId: new Uint8Array([2]),
          },
          {
            alias: "trust",
            entryType: "TRUSTED_CERT",
            certificates: [new Uint8Array([3])],
            localKeyId: new Uint8Array([4]),
          },
        ],
      },
    });
    expect(isLocked("aes-key")).toBe(true);
    expect(isLocked("trust")).toBe(false);
    unlockAlias("aes-key");
    expect(isLocked("aes-key")).toBe(false);
  });
});
