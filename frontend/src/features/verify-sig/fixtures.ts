import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { host } from "../../shell/session";

const TESTDATA = path.resolve(process.cwd(), "../kse/src/test/resources/testdata");

/** Named fixtures from functional-tests/schema.md (no store passwords). */
const FIXTURES: Record<string, string> = {
  "unknown-txt": "CryptoFileUtilTest/unknown.txt",
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
