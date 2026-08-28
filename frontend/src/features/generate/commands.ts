import type { CommandSpec } from "../../shell/types";
import { cancelCommand } from "./cancel";
import { generateDhParametersCommand } from "./dh-parameters";
import { canGenerate } from "./gate";
import { generateKeyPairCommand } from "./key-pair";
import { storePassphraseCommand } from "./passphrase";
import { generateSecretKeyCommand } from "./secret-key";

export const commands: Record<string, CommandSpec> = {
  generateKeyPair: { canExecute: canGenerate, run: generateKeyPairCommand },
  generateSecretKey: { canExecute: canGenerate, run: generateSecretKeyCommand },
  generateDhParameters: { canExecute: canGenerate, run: generateDhParametersCommand },
  storePassphrase: { canExecute: canGenerate, run: storePassphraseCommand },
  cancel: { run: cancelCommand },
};
