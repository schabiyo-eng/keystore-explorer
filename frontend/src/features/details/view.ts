import type { CertDetails, KeyDetails } from "./inspect";

export const CERTIFICATE_DIALOG = "dialog.view-certificate";
export const PRIVATE_KEY_DIALOG = "dialog.view-private-key";
export const PUBLIC_KEY_DIALOG = "dialog.view-public-key";
export const SECRET_KEY_DIALOG = "dialog.view-secret-key";

export type CertificateView = {
  dialog: typeof CERTIFICATE_DIALOG;
  title: string;
  certs: CertDetails[];
};

export type PrivateKeyView = {
  dialog: typeof PRIVATE_KEY_DIALOG;
  title: string;
  key: KeyDetails;
};

export type PublicKeyView = {
  dialog: typeof PUBLIC_KEY_DIALOG;
  title: string;
  key: KeyDetails;
};

export type SecretKeyView = {
  dialog: typeof SECRET_KEY_DIALOG;
  title: string;
  key: KeyDetails;
};

export type KeyDialogId =
  | typeof PRIVATE_KEY_DIALOG
  | typeof PUBLIC_KEY_DIALOG
  | typeof SECRET_KEY_DIALOG;

export type DetailsView = CertificateView | PrivateKeyView | PublicKeyView | SecretKeyView;

let current: DetailsView | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function setDetailsView(view: DetailsView | null): void {
  current = view;
  notify();
}

export function getDetailsView(): DetailsView | null {
  return current;
}

export function subscribeDetailsView(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
