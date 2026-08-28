/** Which import command should receive the shared `dialog.alias` OK click. */
export type ImportAliasCommand = "importTrustedCertificate" | "importKeyPair";

let pendingAliasCommand: ImportAliasCommand = "importTrustedCertificate";

export function setPendingAliasCommand(command: ImportAliasCommand): void {
  pendingAliasCommand = command;
}

export function getPendingAliasCommand(): ImportAliasCommand {
  return pendingAliasCommand;
}

export function resetPendingAliasCommand(): void {
  pendingAliasCommand = "importTrustedCertificate";
}
