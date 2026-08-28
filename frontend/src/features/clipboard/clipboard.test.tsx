/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "../../App";
import { generateKeyPair, putSecretKey, save, TEST_PASSWORD } from "../../kernel";
import { emptyStore } from "../../kernel/store";
import { isControlEnabled } from "../../shell/controls";
import { loadFeatures } from "../../shell/loadFeatures";
import { resetRegistry, runCommand } from "../../shell/registry";
import { getActive, getSelection, getState, host, resetSession } from "../../shell/session";
import { getBufferMode, overlappingAliases, resetBuffer, setBuffer, snapshotEntries } from "./buffer";
import { CLIPBOARD_COMMANDS, commands } from "./commands";
import { PasteReplaceDialog } from "./dialogs";
import { pasteEntries } from "./kernel";
import { foldCancel } from "./yaml";

function assertOk<T extends { ok: boolean }>(result: T): asserts result is T & { ok: true } {
  expect(result.ok).toBe(true);
}

describe("clipboard command map", () => {
  it("owns copy/cut/paste commands and does not own generateKeyPair", () => {
    for (const name of CLIPBOARD_COMMANDS) {
      expect(Object.hasOwn(commands, name)).toBe(true);
    }
    expect(Object.hasOwn(commands, "generateKeyPair")).toBe(false);
  });
});

describe("foldCancel", () => {
  it("turns a trailing cancel primitive into cancel: true on the command", () => {
    const folded = foldCancel([{ paste: { replaceExisting: true } }, { cancel: {} }]);
    expect(folded).toEqual([{ paste: { replaceExisting: true, cancel: true } }]);
  });

  it("leaves a single-step when unchanged", () => {
    const when = [{ copy: {} }];
    expect(foldCancel(when)).toEqual(when);
  });
});

describe("clipboard kernel paste", () => {
  it("appends a cloned key pair and round-trips PKCS#12", async () => {
    const created = await generateKeyPair(emptyStore(false), {
      algorithm: "RSA",
      alias: "rsa-keypair",
    });
    assertOk(created);
    const dest = emptyStore(false);
    const pasted = pasteEntries(dest, created.store.entries, false);
    assertOk(pasted);
    expect(pasted.store.entries.map((entry) => entry.alias)).toEqual(["rsa-keypair"]);
    expect(pasted.store.entries[0]?.entryType).toBe("KEY_PAIR");
    expect(pasted.store.dirty).toBe(true);

    const saved = await save(pasted.store, TEST_PASSWORD);
    assertOk(saved);
    expect(saved.reopenSucceeds).toBe(true);
    expect(saved.facts.aliases).toEqual(["rsa-keypair"]);
  });

  it("declines replace without mutating the dest store", async () => {
    const created = await putSecretKey(emptyStore(false), {
      alias: "aes-key",
      secret: new Uint8Array([1, 2, 3, 4]),
    });
    assertOk(created);
    const declined = pasteEntries(created.store, created.store.entries, false);
    expect(declined.ok).toBe(false);
    if (!declined.ok) {
      expect(declined.errorId).toBe("cancelled");
    }
  });

  it("reports overlapping aliases against the internal buffer", async () => {
    const created = await putSecretKey(emptyStore(false), {
      alias: "aes-key",
      secret: new Uint8Array([1, 2, 3, 4]),
    });
    assertOk(created);
    setBuffer(created.store.entries, "copy");
    expect(overlappingAliases(created.store)).toEqual(["aes-key"]);
    expect(overlappingAliases(emptyStore(false))).toEqual([]);
    resetBuffer();
  });
});

describe("clipboard commands on the plugin host", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    resetBuffer();
    loadFeatures();
  });

  afterEach(() => {
    cleanup();
    resetBuffer();
  });

  it("enables Edit → Copy/Cut from selection and Paste after copy, via glob", async () => {
    render(<App />);
    expect(screen.getByTestId("menu.edit.copy")).toBeDisabled();
    expect(screen.getByTestId("menu.edit.cut")).toBeDisabled();
    expect(screen.getByTestId("menu.edit.paste")).toBeDisabled();

    const created = await putSecretKey(emptyStore(false), {
      alias: "aes-key",
      secret: new Uint8Array([9, 9, 9]),
    });
    assertOk(created);
    host.addTab({
      id: "runtime-pkcs12",
      name: "runtime-pkcs12",
      password: TEST_PASSWORD,
      store: { ...created.store, dirty: false },
    });
    host.setSelection(["aes-key"]);

    expect(isControlEnabled("menu.edit.copy")).toBe(true);
    expect(isControlEnabled("menu.edit.cut")).toBe(true);
    expect(isControlEnabled("toolbar.copy")).toBe(true);
    expect(isControlEnabled("toolbar.cut")).toBe(true);
    expect(isControlEnabled("context.key.copy")).toBe(true);
    expect(isControlEnabled("context.key.cut")).toBe(true);
    expect(isControlEnabled("menu.edit.paste")).toBe(false);

    await runCommand("copy");
    expect(getBufferMode()).toBe("copy");
    expect(getActive()?.store.entries.map((entry) => entry.alias)).toEqual(["aes-key"]);
    expect(getActive()?.store.dirty).toBe(false);
    expect(getSelection()).toEqual(["aes-key"]);
    expect(isControlEnabled("menu.edit.paste")).toBe(true);
    expect(isControlEnabled("toolbar.paste")).toBe(true);
    expect(isControlEnabled("context.tab.paste")).toBe(true);
  });

  it("cuts via delete-rename and leaves the store dirty", async () => {
    const created = await putSecretKey(emptyStore(false), {
      alias: "aes-key",
      secret: new Uint8Array([9, 9, 9]),
    });
    assertOk(created);
    host.addTab({
      id: "store",
      name: "store",
      password: TEST_PASSWORD,
      store: created.store,
    });
    host.setSelection(["aes-key"]);

    await runCommand("cut");
    expect(getBufferMode()).toBe("cut");
    expect(getActive()?.store.entries).toEqual([]);
    expect(getActive()?.store.dirty).toBe(true);
    expect(getSelection()).toEqual([]);
  });

  it("opens the shell confirm dialog when paste would replace an alias", async () => {
    const created = await putSecretKey(emptyStore(false), {
      alias: "aes-key",
      secret: new Uint8Array([9, 9, 9]),
    });
    assertOk(created);
    host.addTab({
      id: "store",
      name: "store",
      password: TEST_PASSWORD,
      store: { ...created.store, dirty: false },
    });
    host.setSelection(["aes-key"]);
    await runCommand("copy");
    await runCommand("paste");
    expect(getState().dialog).toBe("dialog.confirm");
    expect(getActive()?.store.entries.map((entry) => entry.alias)).toEqual(["aes-key"]);
    expect(getActive()?.store.dirty).toBe(false);
  });
});

describe("paste replace dialog", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    resetBuffer();
    loadFeatures();
  });

  afterEach(() => {
    cleanup();
    resetBuffer();
  });

  it("renders paste replace confirm control ids with labelled alias and OK/Cancel", async () => {
    const created = await putSecretKey(emptyStore(false), {
      alias: "aes-key",
      secret: new Uint8Array([9, 9, 9]),
    });
    assertOk(created);
    host.addTab({
      id: "store",
      name: "store",
      password: TEST_PASSWORD,
      store: created.store,
    });
    setBuffer(snapshotEntries(created.store, ["aes-key"]), "copy");

    render(<PasteReplaceDialog />);
    expect(screen.getByTestId("dialog.confirm")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Paste" })).toBeTruthy();
    const aliasField = screen.getByLabelText("Alias");
    expect(aliasField).toHaveValue("aes-key");
    expect(aliasField).toBe(document.getElementById("paste-replace-alias"));
    expect(screen.getByTestId("dialog.confirm.ok")).toHaveAccessibleName("OK");
    expect(screen.getByTestId("dialog.confirm.cancel")).toHaveAccessibleName("Cancel");
  });

  it("replaces the overlapping alias when OK is clicked", async () => {
    const created = await putSecretKey(emptyStore(false), {
      alias: "aes-key",
      secret: new Uint8Array([9, 9, 9]),
    });
    assertOk(created);
    host.addTab({
      id: "store",
      name: "store",
      password: TEST_PASSWORD,
      store: { ...created.store, dirty: false },
    });
    setBuffer(snapshotEntries(created.store, ["aes-key"]), "copy");

    render(<PasteReplaceDialog />);
    fireEvent.click(screen.getByTestId("dialog.confirm.ok"));
    await waitFor(() => {
      expect(getActive()?.store.dirty).toBe(true);
    });
    expect(getActive()?.store.entries.map((entry) => entry.alias)).toEqual(["aes-key"]);
    expect(getState().dialog).toBeNull();
    expect(getBufferMode()).toBe("copy");
  });

  it("leaves the store unchanged when Cancel is clicked", async () => {
    const created = await putSecretKey(emptyStore(false), {
      alias: "aes-key",
      secret: new Uint8Array([9, 9, 9]),
    });
    assertOk(created);
    host.addTab({
      id: "store",
      name: "store",
      password: TEST_PASSWORD,
      store: { ...created.store, dirty: false },
    });
    setBuffer(snapshotEntries(created.store, ["aes-key"]), "copy");

    render(<PasteReplaceDialog />);
    fireEvent.click(screen.getByTestId("dialog.confirm.cancel"));
    await waitFor(() => {
      expect(getState().errorId).toBe("cancelled");
    });
    expect(getActive()?.store.entries.map((entry) => entry.alias)).toEqual(["aes-key"]);
    expect(getActive()?.store.dirty).toBe(false);
    expect(getBufferMode()).toBe("copy");
  });
});
