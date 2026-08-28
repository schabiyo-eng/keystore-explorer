import type { CommandSpec } from "../../shell/types";
import { appendToCertificateChain } from "./append";
import { cancelCommand } from "./cancel";
import { removeFromCertificateChain } from "./remove";
import { canEditChain } from "./selection";

export const commands: Record<string, CommandSpec> = {
  appendToCertificateChain: { canExecute: canEditChain, run: appendToCertificateChain },
  removeFromCertificateChain: { canExecute: canEditChain, run: removeFromCertificateChain },
  cancel: { run: cancelCommand },
};
