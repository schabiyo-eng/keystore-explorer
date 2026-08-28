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

export interface ExamineView {
  title: string;
  dialog: string;
  message?: string;
  certs?: CertSummary[];
  jwt?: JwtSummary;
  fields?: { label: string; value: string }[];
}

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
