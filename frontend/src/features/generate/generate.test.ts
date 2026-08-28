import { describe, expect, it } from "vitest";
import { dhParametersPem } from "./dh";
import { absorbParams, clearDraft, getDraft } from "./draft";
import { foldCancel } from "./yaml";

describe("DH parameters", () => {
  it("emits PEM for RFC 3526 2048-bit MODP", () => {
    const pem = dhParametersPem(2048);
    expect(pem).toMatch(/^-----BEGIN DH PARAMETERS-----/);
    expect(pem).toMatch(/-----END DH PARAMETERS-----$/);
  });

  it("rejects sizes without a documented MODP group", () => {
    expect(dhParametersPem(512)).toBeUndefined();
  });
});

describe("foldCancel", () => {
  it("turns a trailing cancel primitive into cancel: true on the command", () => {
    const folded = foldCancel([
      { generateKeyPair: { algorithm: "RSA", alias: "k" } },
      { cancel: {} },
    ]);
    expect(folded).toEqual([{ generateKeyPair: { algorithm: "RSA", alias: "k", cancel: true } }]);
  });
});

describe("absorbParams", () => {
  it("merges algorithm, keySize, and alias into the wizard draft", () => {
    clearDraft();
    absorbParams({ algorithm: "RSA", keySize: 2048, alias: "k" });
    expect(getDraft()).toEqual({ algorithm: "RSA", keySize: 2048, alias: "k" });
    clearDraft();
  });
});
