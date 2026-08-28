import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { commands } from "./commands";
import { detectExaminedType, isJwtText } from "./detect";
import { foldCancel } from "./yaml";

const testdata = path.resolve(
  process.cwd(),
  "../kse/src/test/resources/testdata/CryptoFileUtilTest",
);

function fixture(name: string): Uint8Array {
  return new Uint8Array(readFileSync(path.join(testdata, name)));
}

describe("examine command map", () => {
  it("owns examine YAML commands and does not own generateKeyPair", () => {
    expect(Object.keys(commands).sort()).toEqual(
      ["cancel", "detectFileType", "examineClipboard", "examineFile", "examineSsl", "setClipboard"].sort(),
    );
    expect(Object.hasOwn(commands, "generateKeyPair")).toBe(false);
    expect(commands.examineFile?.canExecute?.()).toBe(true);
    expect(commands.examineClipboard?.canExecute?.()).toBe(true);
    expect(commands.examineSsl?.canExecute?.()).toBe(true);
    expect(commands.detectFileType?.canExecute?.()).toBe(true);
  });
});

describe("detectExaminedType", () => {
  it("classifies PEM and Base64 certificates", () => {
    expect(detectExaminedType(fixture("cert.pem.cer"))).toBe("certificate");
    expect(detectExaminedType(fixture("cert.base64.txt"))).toBe("certificate");
  });

  it("classifies a JWT sample", () => {
    const jwt = fixture("test.jwt");
    expect(isJwtText(new TextDecoder().decode(jwt))).toBe(true);
    expect(detectExaminedType(jwt)).toBe("jwt");
  });

  it("classifies unknown text as unknown", () => {
    expect(detectExaminedType(fixture("unknown.txt"))).toBe("unknown");
  });

  it("classifies a PKCS #10 CSR and PEM CRL", () => {
    expect(detectExaminedType(fixture("csr.p10"))).toBe("csr");
    expect(detectExaminedType(fixture("test.pem.crl"))).toBe("crl");
  });
});

describe("foldCancel", () => {
  it("turns a trailing cancel primitive into cancel: true on the command", () => {
    const folded = foldCancel([{ examineClipboard: {} }, { cancel: {} }]);
    expect(folded).toEqual([{ examineClipboard: { cancel: true } }]);
  });
});
