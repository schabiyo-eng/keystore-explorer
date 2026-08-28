import type { CommandSpec } from "../../shell/types";
import { exportCertificate } from "./certificate";
import { exportCsv } from "./csv";
import { exportKeyPair } from "./key-pair";
import { fail } from "./outcome";
import { exportPrivateKey } from "./private-key";
import { exportPublicKey } from "./public-key";
import {
  canExportCertificate,
  canExportCsv,
  canExportKeyPair,
  canExportPublicKey,
} from "./selection";

function cancelCommand(): void {
  fail("cancelled");
}

export const commands: Record<string, CommandSpec> = {
  exportCsv: { canExecute: canExportCsv, run: exportCsv },
  exportKeyPair: { canExecute: canExportKeyPair, run: exportKeyPair },
  exportCertificate: { canExecute: canExportCertificate, run: exportCertificate },
  exportPrivateKey: { canExecute: canExportKeyPair, run: exportPrivateKey },
  exportPublicKey: { canExecute: canExportPublicKey, run: exportPublicKey },
  cancel: { run: cancelCommand },
};
