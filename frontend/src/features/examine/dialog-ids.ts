/** `data-testid`s from functional-tests/control-ids.md (examine slice). */

export const VIEW_CERTIFICATE_DIALOG = "dialog.view-certificate";
export const VIEW_CSR_DIALOG = "dialog.view-csr";
export const VIEW_CRL_DIALOG = "dialog.view-crl";
export const VIEW_JWT_DIALOG = "dialog.view-jwt";
export const PKCS12_INFO_DIALOG = "dialog.pkcs12-info";
export const EXAMINE_SSL_DIALOG = "dialog.examine-ssl";
export const DETECT_FILE_TYPE_DIALOG = "dialog.detect-file-type";
export const VIEW_PRIVATE_KEY_DIALOG = "dialog.view-private-key";
export const VIEW_PUBLIC_KEY_DIALOG = "dialog.view-public-key";
export const ERROR_DIALOG = "dialog.error";
export const FILE_OPEN_DIALOG = "dialog.file-open";

export const EXAMINE_SSL_HOST = "dialog.examine-ssl.host";
export const EXAMINE_SSL_PORT = "dialog.examine-ssl.port";

export const EXAMINE_COMMANDS = [
  "examineFile",
  "examineClipboard",
  "examineSsl",
  "detectFileType",
  "setClipboard",
  "cancel",
] as const;

export type ExamineCommand = (typeof EXAMINE_COMMANDS)[number];
