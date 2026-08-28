import type { CertDetails, KeyDetails } from "./inspect";

export type CertificateView = {
  dialog: "dialog.view-certificate";
  title: string;
  certs: CertDetails[];
};

export type PrivateKeyView = {
  dialog: "dialog.view-private-key";
  title: string;
  key: KeyDetails;
};

export type PublicKeyView = {
  dialog: "dialog.view-public-key";
  title: string;
  key: KeyDetails;
};

export type SecretKeyView = {
  dialog: "dialog.view-secret-key";
  title: string;
  key: KeyDetails;
};

export type DetailsView = CertificateView | PrivateKeyView | PublicKeyView | SecretKeyView;

let current: DetailsView | null = null;

export function setDetailsView(view: DetailsView | null): void {
  current = view;
}

export function getDetailsView(): DetailsView | null {
  return current;
}
