import { describe, expect, it } from "vitest";
import { encodeCertificatesPem, encodeCsv, encodePkcs8Pem, pemBlock } from "./encode";
import { cancelled } from "./params";
import { foldCancel } from "./yaml";

describe("foldCancel", () => {
  it("turns a trailing cancel primitive into cancel: true on the command", () => {
    const folded = foldCancel([
      { exportCsv: { path: "export/store.csv" } },
      { cancel: {} },
    ]);
    expect(folded).toEqual([{ exportCsv: { path: "export/store.csv", cancel: true } }]);
  });

  it("leaves a single-step when unchanged", () => {
    const when = [{ exportCsv: { path: "export/store.csv" } }];
    expect(foldCancel(when)).toEqual(when);
  });

  it("leaves a trailing non-cancel step unchanged", () => {
    const when = [{ exportCsv: { path: "export/store.csv" } }, { selectEntries: { aliases: ["a"] } }];
    expect(foldCancel(when)).toEqual(when);
  });
});

describe("cancelled params", () => {
  it("treats cancel: true and confirm: false as abort", () => {
    expect(cancelled({ cancel: true })).toBe(true);
    expect(cancelled({ confirm: false })).toBe(true);
    expect(cancelled({ path: "export/store.csv" })).toBe(false);
    expect(cancelled(undefined)).toBe(false);
  });
});

describe("export encoding", () => {
  it("emits PEM certificate blocks", () => {
    const der = new Uint8Array([1, 2, 3, 4]);
    const pem = new TextDecoder().decode(encodeCertificatesPem([der]));
    expect(pem).toMatch(/^-----BEGIN CERTIFICATE-----/);
    expect(pem).toMatch(/-----END CERTIFICATE-----\n$/);
  });

  it("wraps DER as a labeled PEM block", () => {
    expect(pemBlock("PUBLIC KEY", new Uint8Array([0xff]))).toContain("BEGIN PUBLIC KEY");
  });

  it("encodes PKCS#8 as an unencrypted PRIVATE KEY PEM", () => {
    const pem = new TextDecoder().decode(encodePkcs8Pem(new Uint8Array([9, 8, 7])));
    expect(pem).toMatch(/^-----BEGIN PRIVATE KEY-----/);
    expect(pem).toContain("-----END PRIVATE KEY-----");
  });

  it("writes quoted CSV headers for the entry table", () => {
    const csv = new TextDecoder().decode(encodeCsv([]));
    expect(csv).toContain('"Entry Name"');
    expect(csv).toContain('"Type"');
  });

  it("marks locked aliases without reading session state", () => {
    const csv = new TextDecoder().decode(
      encodeCsv(
        [
          {
            alias: "keypair",
            entryType: "KEY_PAIR",
            pkcs8: new Uint8Array(),
            certificates: [],
            localKeyId: new Uint8Array(),
          },
        ],
        (alias) => alias === "keypair",
      ),
    );
    expect(csv).toContain('"Key Pair"');
    expect(csv).toContain('"Locked"');
    expect(csv).toContain('"keypair"');
  });
});
