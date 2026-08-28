import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { host } from "../../shell/session";

const cwd = typeof process !== "undefined" && typeof process.cwd === "function" ? process.cwd() : "/";
const TESTDATA = path.resolve(cwd, "../kse/src/test/resources/testdata");

/** Named fixtures from functional-tests/schema.md (no store passwords). */
const FIXTURES: Record<string, string> = {
  "csr-p10": "CryptoFileUtilTest/csr.p10",
  "csr-spkac": "CryptoFileUtilTest/csr.spkac",
  "unknown-txt": "CryptoFileUtilTest/unknown.txt",
  "jwt-sample": "CryptoFileUtilTest/test.jwt",
};

export function readNamedBytes(idOrPath: string): Uint8Array | undefined {
  const fromVfs = host.vfsRead(idOrPath);
  if (fromVfs) {
    return fromVfs;
  }
  const rel = FIXTURES[idOrPath];
  const filePath = rel ? path.join(TESTDATA, rel) : idOrPath;
  if (!existsSync(filePath)) {
    return undefined;
  }
  return new Uint8Array(readFileSync(filePath));
}
