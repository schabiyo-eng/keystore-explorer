import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { asList, randomBytes, toArrayBuffer, toHex, toUint8 } from "./bytes";
import {
  OID_CERT_BAG,
  OID_FRIENDLY_NAME,
  OID_LOCAL_KEY_ID,
  OID_PKCS7_DATA,
  OID_SECRET_BAG,
  OID_SHROUDED_KEY_BAG,
} from "./oids";
import type { KernelEntry, KeyEntry, KeyPairEntry, TrustedCertEntry } from "./types";

export const PKCS12_ITERATIONS = 2048;

export interface RawBag {
  bagId: string;
  alias?: string;
  localKeyId?: Uint8Array;
  pkcs8?: Uint8Array;
  certDer?: Uint8Array;
  secret?: Uint8Array;
}

function bagAttributes(alias: string, localKeyId: Uint8Array): pkijs.Attribute[] {
  return [
    new pkijs.Attribute({
      type: OID_FRIENDLY_NAME,
      values: [new asn1js.BmpString({ value: alias })],
    }),
    new pkijs.Attribute({
      type: OID_LOCAL_KEY_ID,
      values: [new asn1js.OctetString({ valueHex: toArrayBuffer(localKeyId) })],
    }),
  ];
}

function readBmpOrUtf8(value: unknown): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const obj = value as { getValue?: () => unknown; value?: unknown };
  if (typeof obj.getValue === "function") {
    const text = obj.getValue();
    if (typeof text === "string" && text.length > 0) {
      return text;
    }
  }
  if (typeof obj.value === "string" && obj.value.length > 0) {
    return obj.value;
  }
  return undefined;
}

function readOctetBytes(value: unknown): Uint8Array | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const block = value as {
    valueBlock?: { valueHexView?: Uint8Array };
    getValue?: () => unknown;
  };
  if (block.valueBlock?.valueHexView && block.valueBlock.valueHexView.byteLength > 0) {
    return new Uint8Array(block.valueBlock.valueHexView);
  }
  if (typeof block.getValue === "function") {
    const raw = block.getValue();
    if (raw instanceof ArrayBuffer) {
      return toUint8(raw);
    }
    if (raw instanceof Uint8Array) {
      return new Uint8Array(raw);
    }
  }
  return undefined;
}

export function bagFriendlyName(bag: pkijs.SafeBag): string | undefined {
  for (const attr of asList(bag.bagAttributes)) {
    if (attr.type !== OID_FRIENDLY_NAME) {
      continue;
    }
    for (const value of asList(attr.values)) {
      const name = readBmpOrUtf8(value);
      if (name) {
        return name;
      }
    }
  }
  return undefined;
}

export function bagLocalKeyId(bag: pkijs.SafeBag): Uint8Array | undefined {
  for (const attr of asList(bag.bagAttributes)) {
    if (attr.type !== OID_LOCAL_KEY_ID) {
      continue;
    }
    for (const value of asList(attr.values)) {
      const id = readOctetBytes(value);
      if (id && id.byteLength > 0) {
        return id;
      }
    }
  }
  return undefined;
}

function octetSecret(bytes: Uint8Array) {
  return {
    toSchema() {
      return new asn1js.OctetString({ valueHex: toArrayBuffer(bytes) });
    },
    toJSON() {
      return { valueHex: toHex(bytes) };
    },
    fromSchema() {
      return undefined;
    },
  };
}

async function encryptShroudedKey(
  pkcs8: Uint8Array,
  password: ArrayBuffer,
): Promise<pkijs.PKCS8ShroudedKeyBag> {
  const pki = pkijs.PrivateKeyInfo.fromBER(toArrayBuffer(pkcs8));
  const shrouded = new pkijs.PKCS8ShroudedKeyBag({ parsedValue: pki });
  // pkijs generates the AES-CBC IV; its public type still requires `iv`.
  await shrouded.makeInternalValues({
    password,
    contentEncryptionAlgorithm: {
      name: "AES-CBC",
      length: 128,
    },
    hmacHashAlgorithm: "SHA-1",
    iterationCount: PKCS12_ITERATIONS,
  } as Parameters<pkijs.PKCS8ShroudedKeyBag["makeInternalValues"]>[0]);
  return shrouded;
}

export async function decryptShroudedKey(
  bag: pkijs.PKCS8ShroudedKeyBag,
  password: ArrayBuffer,
): Promise<Uint8Array> {
  const parseable = bag as unknown as {
    parseInternalValues: (params: { password: ArrayBuffer }) => Promise<void>;
  };
  await parseable.parseInternalValues({ password });
  if (!bag.parsedValue) {
    throw new Error("Failed to decrypt PKCS#8 shrouded key bag");
  }
  return toUint8(bag.parsedValue.toSchema().toBER(false));
}

function certBagFromDer(der: Uint8Array): pkijs.CertBag {
  const cert = pkijs.Certificate.fromBER(toArrayBuffer(der));
  return new pkijs.CertBag({ parsedValue: cert });
}

function secretBagFromBytes(secret: Uint8Array): pkijs.SecretBag {
  return new pkijs.SecretBag({
    secretTypeId: OID_PKCS7_DATA,
    secretValue: octetSecret(secret),
  });
}

function shroudedKeyBag(
  shrouded: pkijs.PKCS8ShroudedKeyBag,
  alias: string,
  localKeyId: Uint8Array,
): pkijs.SafeBag {
  return new pkijs.SafeBag({
    bagId: OID_SHROUDED_KEY_BAG,
    bagValue: shrouded,
    bagAttributes: bagAttributes(alias, localKeyId),
  });
}

function certSafeBag(
  certDer: Uint8Array,
  alias: string,
  localKeyId: Uint8Array,
): pkijs.SafeBag {
  return new pkijs.SafeBag({
    bagId: OID_CERT_BAG,
    bagValue: certBagFromDer(certDer),
    bagAttributes: bagAttributes(alias, localKeyId),
  });
}

async function bagsForKeyPair(
  entry: KeyPairEntry,
  password: ArrayBuffer,
): Promise<pkijs.SafeBag[]> {
  const shrouded = await encryptShroudedKey(entry.pkcs8, password);
  return [
    shroudedKeyBag(shrouded, entry.alias, entry.localKeyId),
    ...entry.certificates.map((der) => certSafeBag(der, entry.alias, entry.localKeyId)),
  ];
}

function bagsForTrustedCert(entry: TrustedCertEntry): pkijs.SafeBag[] {
  return entry.certificates.map((der) =>
    certSafeBag(der, entry.alias, entry.localKeyId),
  );
}

async function bagsForKey(
  entry: KeyEntry,
  password: ArrayBuffer,
): Promise<pkijs.SafeBag[]> {
  if (entry.secret) {
    return [
      new pkijs.SafeBag({
        bagId: OID_SECRET_BAG,
        bagValue: secretBagFromBytes(entry.secret),
        bagAttributes: bagAttributes(entry.alias, entry.localKeyId),
      }),
    ];
  }
  if (entry.pkcs8) {
    const shrouded = await encryptShroudedKey(entry.pkcs8, password);
    return [shroudedKeyBag(shrouded, entry.alias, entry.localKeyId)];
  }
  return [];
}

/** Encode one in-memory entry as PKCS#12 SafeBags. */
export async function safeBagsForEntry(
  entry: KernelEntry,
  password: ArrayBuffer,
): Promise<pkijs.SafeBag[]> {
  switch (entry.entryType) {
    case "KEY_PAIR":
      return bagsForKeyPair(entry, password);
    case "TRUSTED_CERT":
      return bagsForTrustedCert(entry);
    case "KEY":
      return bagsForKey(entry, password);
  }
}

export function readSecretBagBytes(bag: pkijs.SecretBag): Uint8Array | undefined {
  return readOctetBytes(bag.secretValue);
}

function uniqueAlias(used: Set<string>, preferred: string, fallback: string): string {
  const base = preferred || fallback;
  let alias = base;
  let n = 2;
  while (used.has(alias)) {
    alias = `${base}-${n}`;
    n += 1;
  }
  used.add(alias);
  return alias;
}

function sameKeyId(a?: Uint8Array, b?: Uint8Array): boolean {
  return Boolean(a && b && toHex(a) === toHex(b));
}

/** Group PKCS#12 bags into KEY_PAIR / TRUSTED_CERT / KEY entries. */
export function groupEntries(rawBags: RawBag[]): KernelEntry[] {
  const keys = rawBags.filter((bag) => bag.pkcs8);
  const certs = rawBags.filter((bag) => bag.certDer);
  const secrets = rawBags.filter((bag) => bag.secret);

  const usedCerts = new Set<RawBag>();
  const entries: KernelEntry[] = [];
  const usedAliases = new Set<string>();

  for (const key of keys) {
    const matchedCerts = certs.filter((cert) => {
      if (usedCerts.has(cert)) {
        return false;
      }
      if (sameKeyId(key.localKeyId, cert.localKeyId)) {
        return true;
      }
      return Boolean(
        key.alias &&
          cert.alias &&
          key.alias === cert.alias &&
          !cert.localKeyId &&
          !key.localKeyId,
      );
    });
    for (const cert of matchedCerts) {
      usedCerts.add(cert);
    }

    const localKeyId = key.localKeyId ?? matchedCerts[0]?.localKeyId ?? randomBytes(20);
    const alias = uniqueAlias(
      usedAliases,
      key.alias ?? matchedCerts[0]?.alias ?? "",
      `key-${toHex(localKeyId).slice(0, 8)}`,
    );

    if (matchedCerts.length > 0) {
      entries.push({
        alias,
        entryType: "KEY_PAIR",
        pkcs8: key.pkcs8 as Uint8Array,
        certificates: matchedCerts
          .map((c) => c.certDer)
          .filter((d): d is Uint8Array => d !== undefined),
        localKeyId,
      });
    } else {
      entries.push({
        alias,
        entryType: "KEY",
        pkcs8: key.pkcs8,
        localKeyId,
      });
    }
  }

  for (const secret of secrets) {
    const localKeyId = secret.localKeyId ?? randomBytes(20);
    entries.push({
      alias: uniqueAlias(
        usedAliases,
        secret.alias ?? "",
        `secret-${toHex(localKeyId).slice(0, 8)}`,
      ),
      entryType: "KEY",
      secret: secret.secret,
      localKeyId,
    });
  }

  for (const cert of certs) {
    if (usedCerts.has(cert)) {
      continue;
    }
    const localKeyId = cert.localKeyId ?? randomBytes(20);
    entries.push({
      alias: uniqueAlias(
        usedAliases,
        cert.alias ?? "",
        `cert-${toHex(localKeyId).slice(0, 8)}`,
      ),
      entryType: "TRUSTED_CERT",
      certificates: cert.certDer ? [cert.certDer] : [],
      localKeyId,
    });
  }

  return entries;
}
