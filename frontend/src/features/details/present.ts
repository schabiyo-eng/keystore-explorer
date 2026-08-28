import { isKeyEntry, isKeyPairEntry, isTrustedCertEntry } from "../../kernel";
import { getSelection } from "../../shell/session";
import {
  certificatesOf,
  inspectCertificates,
  inspectPrivateKey,
  inspectPublicKeyFromCert,
  inspectSecretKey,
} from "./inspect";
import { selectedEntries, type DetailsKind } from "./kinds";
import {
  CERTIFICATE_DIALOG,
  PRIVATE_KEY_DIALOG,
  PUBLIC_KEY_DIALOG,
  SECRET_KEY_DIALOG,
  type DetailsView,
} from "./view";

function quoted(alias: string): string {
  return `'${alias}'`;
}

export async function viewForKind(kind: DetailsKind): Promise<DetailsView | undefined> {
  const [entry] = selectedEntries();
  const alias = entry?.alias ?? getSelection()[0] ?? "";

  switch (kind) {
    case "key": {
      if (!entry || !isKeyEntry(entry)) {
        return undefined;
      }
      if (entry.secret) {
        return {
          dialog: SECRET_KEY_DIALOG,
          title: `Secret Key Details for Entry ${quoted(alias)}`,
          key: inspectSecretKey(entry.secret),
        };
      }
      if (entry.pkcs8) {
        return {
          dialog: PRIVATE_KEY_DIALOG,
          title: `Private Key Details for Entry ${quoted(alias)}`,
          key: inspectPrivateKey(entry.pkcs8),
        };
      }
      return undefined;
    }
    case "keyPairChain": {
      if (!entry || !isKeyPairEntry(entry)) {
        return undefined;
      }
      return {
        dialog: CERTIFICATE_DIALOG,
        title: `Certificate Details for Entry ${quoted(alias)}`,
        certs: await inspectCertificates(entry.certificates),
      };
    }
    case "keyPairPrivateKey": {
      if (!entry || !isKeyPairEntry(entry)) {
        return undefined;
      }
      const cert = entry.certificates[0];
      const fallbackBits = cert
        ? Number.parseInt(inspectPublicKeyFromCert(cert).keySize, 10) || undefined
        : undefined;
      return {
        dialog: PRIVATE_KEY_DIALOG,
        title: `Private Key Details for Entry ${quoted(alias)}`,
        key: inspectPrivateKey(entry.pkcs8, fallbackBits),
      };
    }
    case "keyPairPublicKey": {
      if (!entry || !isKeyPairEntry(entry) || !entry.certificates[0]) {
        return undefined;
      }
      return {
        dialog: PUBLIC_KEY_DIALOG,
        title: `Public Key Details for Entry ${quoted(alias)}`,
        key: inspectPublicKeyFromCert(entry.certificates[0]),
      };
    }
    case "trustedCertificate": {
      if (!entry || !isTrustedCertEntry(entry)) {
        return undefined;
      }
      return {
        dialog: CERTIFICATE_DIALOG,
        title: `Certificate Details for Entry ${quoted(alias)}`,
        certs: await inspectCertificates(entry.certificates),
      };
    }
    case "trustedCertificatePublicKey": {
      if (!entry || !isTrustedCertEntry(entry) || !entry.certificates[0]) {
        return undefined;
      }
      return {
        dialog: PUBLIC_KEY_DIALOG,
        title: `Public Key Details for Entry ${quoted(alias)}`,
        key: inspectPublicKeyFromCert(entry.certificates[0]),
      };
    }
    case "selectedCertificatesChain": {
      const ders = selectedEntries().flatMap(certificatesOf);
      return {
        dialog: CERTIFICATE_DIALOG,
        title: "Certificates Details",
        certs: await inspectCertificates(ders),
      };
    }
  }
}
