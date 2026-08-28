import type { CommandParams, CommandSpec } from "../../shell/types";
import { canVerifyCertificate } from "./selection";
import { verifyCertificate } from "./verify-certificate";
import { verifyJar } from "./verify-jar";
import { verifySignature } from "./verify-signature";

const spec = (run: (params?: CommandParams) => Promise<void>, canExecute?: () => boolean): CommandSpec =>
  canExecute ? { canExecute, run } : { run };

export const commands: Record<string, CommandSpec> = {
  verifyCertificate: spec(verifyCertificate, canVerifyCertificate),
  verifyJar: spec(verifyJar),
  verifySignature: spec(verifySignature),
};

export { canVerifyCertificate };
