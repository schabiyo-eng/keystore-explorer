export { commands } from "./commands";
import {
  AliasDialog,
  GenerateDhParametersDialog,
  GenerateKeyPairCertDialog,
  GenerateKeyPairDialog,
  GenerateSecretKeyDialog,
  GeneratingDhParametersDialog,
  GeneratingKeyPairDialog,
  StorePassphraseDialog,
  ViewDhParametersDialog,
} from "./dialogs";

export const dialogs = {
  "dialog.generate-key-pair": GenerateKeyPairDialog,
  "dialog.generate-key-pair-cert": GenerateKeyPairCertDialog,
  "dialog.generating-key-pair": GeneratingKeyPairDialog,
  "dialog.alias": AliasDialog,
  "dialog.generate-secret-key": GenerateSecretKeyDialog,
  "dialog.generate-dh-parameters": GenerateDhParametersDialog,
  "dialog.generating-dh-parameters": GeneratingDhParametersDialog,
  "dialog.view-dh-parameters": ViewDhParametersDialog,
  "dialog.store-passphrase": StorePassphraseDialog,
};
