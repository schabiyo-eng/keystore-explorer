import { flag, passwordOf, str } from "../file/params";
import { getActive, getSelection, host, unlockAlias } from "../../shell/session";
import type { CommandParams, CommandSpec } from "../../shell/types";
import {
  certificatesOf,
  inspectCertificates,
  inspectPrivateKey,
  inspectPublicKeyFromCert,
  inspectSecretKey,
} from "./inspect";
import { fail, succeed } from "./outcome";
import { setDetailsView, type DetailsView } from "./view";

export type DetailsKind =
  | "key"
  | "keyPairChain"
  | "keyPairPrivateKey"
  | "keyPairPublicKey"
  | "trustedCertificate"
  | "trustedCertificatePublicKey"
  | "selectedCertificatesChain";

const KINDS = new Set<string>([
  "key",
  "keyPairChain",
  "keyPairPrivateKey",
  "keyPairPublicKey",
  "trustedCertificate",
  "trustedCertificatePublicKey",
  "selectedCertificatesChain",
]);

function isKind(value: string | undefined): value is DetailsKind {
  return value !== undefined && KINDS.has(value);
}

function selectedEntries() {
  const active = getActive();
  if (!active) {
    return [];
  }
  const wanted = new Set(getSelection());
  return active.store.entries.filter((entry) => wanted.has(entry.alias));
}

function inferKind(): DetailsKind | undefined {
  const aliases = getSelection();
  if (aliases.length === 0) {
    return undefined;
  }
  if (aliases.length > 1) {
    return "selectedCertificatesChain";
  }
  const [entry] = selectedEntries();
  if (!entry) {
    return undefined;
  }
  switch (entry.entryType) {
    case "KEY":
      return "key";
    case "KEY_PAIR":
      return "keyPairChain";
    case "TRUSTED_CERT":
      return "trustedCertificate";
  }
}

function selectionMatches(kind: DetailsKind): boolean {
  const aliases = getSelection();
  if (kind === "selectedCertificatesChain") {
    return aliases.length > 0;
  }
  if (aliases.length !== 1) {
    return false;
  }
  const [entry] = selectedEntries();
  if (!entry) {
    return false;
  }
  switch (kind) {
    case "key":
      return entry.entryType === "KEY";
    case "keyPairChain":
    case "keyPairPrivateKey":
    case "keyPairPublicKey":
      return entry.entryType === "KEY_PAIR";
    case "trustedCertificate":
    case "trustedCertificatePublicKey":
      return entry.entryType === "TRUSTED_CERT";
  }
}

function needsPassword(kind: DetailsKind): boolean {
  return kind === "key" || kind === "keyPairPrivateKey";
}

function quoted(alias: string): string {
  return `'${alias}'`;
}

async function viewForKind(kind: DetailsKind): Promise<DetailsView | undefined> {
  const [entry] = selectedEntries();
  const alias = entry?.alias ?? getSelection()[0] ?? "";

  switch (kind) {
    case "key": {
      if (!entry || entry.entryType !== "KEY") {
        return undefined;
      }
      if (entry.secret) {
        return {
          dialog: "dialog.view-secret-key",
          title: `Secret Key Details for Entry ${quoted(alias)}`,
          key: inspectSecretKey(entry.secret),
        };
      }
      if (entry.pkcs8) {
        return {
          dialog: "dialog.view-private-key",
          title: `Private Key Details for Entry ${quoted(alias)}`,
          key: inspectPrivateKey(entry.pkcs8),
        };
      }
      return undefined;
    }
    case "keyPairChain": {
      if (!entry || entry.entryType !== "KEY_PAIR") {
        return undefined;
      }
      return {
        dialog: "dialog.view-certificate",
        title: `Certificate Details for Entry ${quoted(alias)}`,
        certs: await inspectCertificates(entry.certificates),
      };
    }
    case "keyPairPrivateKey": {
      if (!entry || entry.entryType !== "KEY_PAIR") {
        return undefined;
      }
      const cert = entry.certificates[0];
      const fallbackBits = cert
        ? Number.parseInt(inspectPublicKeyFromCert(cert).keySize, 10) || undefined
        : undefined;
      return {
        dialog: "dialog.view-private-key",
        title: `Private Key Details for Entry ${quoted(alias)}`,
        key: inspectPrivateKey(entry.pkcs8, fallbackBits),
      };
    }
    case "keyPairPublicKey": {
      if (!entry || entry.entryType !== "KEY_PAIR" || !entry.certificates[0]) {
        return undefined;
      }
      return {
        dialog: "dialog.view-public-key",
        title: `Public Key Details for Entry ${quoted(alias)}`,
        key: inspectPublicKeyFromCert(entry.certificates[0]),
      };
    }
    case "trustedCertificate": {
      if (!entry || entry.entryType !== "TRUSTED_CERT") {
        return undefined;
      }
      return {
        dialog: "dialog.view-certificate",
        title: `Certificate Details for Entry ${quoted(alias)}`,
        certs: await inspectCertificates(entry.certificates),
      };
    }
    case "trustedCertificatePublicKey": {
      if (!entry || entry.entryType !== "TRUSTED_CERT" || !entry.certificates[0]) {
        return undefined;
      }
      return {
        dialog: "dialog.view-public-key",
        title: `Public Key Details for Entry ${quoted(alias)}`,
        key: inspectPublicKeyFromCert(entry.certificates[0]),
      };
    }
    case "selectedCertificatesChain": {
      const ders = selectedEntries().flatMap(certificatesOf);
      return {
        dialog: "dialog.view-certificate",
        title: "Certificates Details",
        certs: await inspectCertificates(ders),
      };
    }
  }
}

function show(view: DetailsView): void {
  setDetailsView(view);
  host.clearError();
  host.openDialog(view.dialog);
}

export async function openDetails(params?: CommandParams): Promise<void> {
  if (flag(params, "dismiss")) {
    setDetailsView(null);
    succeed();
    return;
  }
  if (flag(params, "cancel")) {
    setDetailsView(null);
    fail("cancelled");
    return;
  }

  const active = getActive();
  if (!active) {
    fail("storeNotWritable");
    return;
  }

  const requested = str(params, "kind");
  const kind = isKind(requested) ? requested : inferKind();
  if (!kind || !selectionMatches(kind)) {
    fail("emptySelection");
    return;
  }

  if (needsPassword(kind)) {
    const password = passwordOf(params);
    if (password === undefined) {
      host.openDialog("dialog.password");
      return;
    }
    if (password !== active.password) {
      fail("wrongPassword");
      return;
    }
    const alias = getSelection()[0];
    if (alias) {
      unlockAlias(alias);
    }
  }

  const view = await viewForKind(kind);
  if (!view) {
    fail("emptySelection");
    return;
  }
  show(view);
}

export function cancelDetails(): void {
  setDetailsView(null);
  fail("cancelled");
}

export function canOpenDetails(): boolean {
  return getActive() !== null && getSelection().length > 0;
}

export const commands: Record<string, CommandSpec> = {
  openDetails: { canExecute: canOpenDetails, run: openDetails },
  cancel: { run: cancelDetails },
};
