import { describe, expect, it } from "vitest";
import { encodeCertificatesPem, encodeCsv, pemBlock } from "./encode";
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

  it("writes quoted CSV headers for the entry table", () => {
    const csv = new TextDecoder().decode(encodeCsv([]));
    expect(csv).toContain('"Entry Name"');
    expect(csv).toContain('"Type"');
  });
});
