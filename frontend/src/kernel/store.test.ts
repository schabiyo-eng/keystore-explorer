import { describe, expect, it } from "vitest";
import { appendEntry, cloneStore, emptyStore, factsOf, hasAlias } from "./store";

describe("keystore snapshots", () => {
  it("cloneStore copies byte buffers", () => {
    const store = emptyStore(true);
    const withEntry = appendEntry(store, {
      alias: "a",
      entryType: "KEY",
      secret: new Uint8Array([1, 2, 3]),
      localKeyId: new Uint8Array([9]),
    });
    const cloned = cloneStore(withEntry);
    const clonedEntry = cloned.entries[0];
    expect(clonedEntry?.entryType).toBe("KEY");
    if (clonedEntry?.entryType === "KEY") {
      clonedEntry.secret![0] = 99;
    }
    cloned.dirty = false;
    const original = withEntry.entries[0];
    expect(original?.entryType).toBe("KEY");
    if (original?.entryType === "KEY") {
      expect(original.secret).toEqual(new Uint8Array([1, 2, 3]));
    }
    expect(withEntry.dirty).toBe(true);
  });

  it("appendEntry does not mutate the previous snapshot", () => {
    const empty = emptyStore(true);
    const next = appendEntry(empty, {
      alias: "cert",
      entryType: "TRUSTED_CERT",
      certificates: [new Uint8Array([1])],
      localKeyId: new Uint8Array([2]),
    });
    expect(empty.entries).toHaveLength(0);
    expect(next.entries).toHaveLength(1);
    expect(hasAlias(next, "cert")).toBe(true);
    expect(factsOf(next).aliases).toEqual(["cert"]);
  });
});
