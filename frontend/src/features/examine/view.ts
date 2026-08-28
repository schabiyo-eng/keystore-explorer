import {
  DETECT_FILE_TYPE_DIALOG,
  ERROR_DIALOG,
  PKCS12_INFO_DIALOG,
  VIEW_CERTIFICATE_DIALOG,
  VIEW_CRL_DIALOG,
  VIEW_CSR_DIALOG,
  VIEW_JWT_DIALOG,
  VIEW_PRIVATE_KEY_DIALOG,
  VIEW_PUBLIC_KEY_DIALOG,
} from "./dialog-ids";

export interface CertSummary {
  subject: string;
  issuer: string;
  serial: string;
  validFrom: string;
  validUntil: string;
}

export interface JwtSummary {
  header: string;
  payload: string;
  signature: string;
}

export interface FieldRow {
  label: string;
  value: string;
}

export type CertificateView = {
  dialog: typeof VIEW_CERTIFICATE_DIALOG;
  title: string;
  certs: CertSummary[];
};

export type CsrView = {
  dialog: typeof VIEW_CSR_DIALOG;
  title: string;
  fields: FieldRow[];
};

export type CrlView = {
  dialog: typeof VIEW_CRL_DIALOG;
  title: string;
  fields: FieldRow[];
};

export type JwtView = {
  dialog: typeof VIEW_JWT_DIALOG;
  title: string;
  jwt: JwtSummary;
};

export type Pkcs12View = {
  dialog: typeof PKCS12_INFO_DIALOG;
  title: string;
  message: string;
};

export type DetectView = {
  dialog: typeof DETECT_FILE_TYPE_DIALOG;
  title: string;
  message: string;
};

export type ErrorView = {
  dialog: typeof ERROR_DIALOG;
  title: string;
  message: string;
};

export type PrivateKeyView = {
  dialog: typeof VIEW_PRIVATE_KEY_DIALOG;
  title: string;
  message: string;
};

export type PublicKeyView = {
  dialog: typeof VIEW_PUBLIC_KEY_DIALOG;
  title: string;
  message: string;
};

export type ExamineView =
  | CertificateView
  | CsrView
  | CrlView
  | JwtView
  | Pkcs12View
  | DetectView
  | ErrorView
  | PrivateKeyView
  | PublicKeyView;

let current: ExamineView | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function setExamineView(view: ExamineView | null): void {
  current = view;
  notify();
}

export function getExamineView(): ExamineView | null {
  return current;
}

export function subscribeExamineView(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetExamineView(): void {
  current = null;
  notify();
}
