import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { stringToArrayBuffer } from "pvutils";
import { ensureCryptoEngine } from "./engine";
import type { EntryType, ErrorId, KernelEntry, KeyStore } from "./types";

export const OID_KEY_BAG = "1.2.840.113549.1.12.10.1.1";
export const OID_SHROUDED_KEY_BAG = "1.2.840.113549.1.12.10.1.2";
export const OID_CERT_BAG = "1.2.840.113549.1.12.10.1.3";
export const OID_SECRET_BAG = "1.2.840.113549.1.12.10.1.5";
export const OID_FRIENDLY_NAME = "1.2.840.113549.1.9.20";
export const OID_LOCAL_KEY_ID = "1.2.840.113549.1.9.21";
export const OID_PKCS7_DATA = "1.2.840.113549.1.7.1";

const PKCS12_ITERATIONS = 2048;
const HMAC_HASH = "SHA-256";

export function passwordBuffer(password: string): ArrayBuffer {
  return stringToArrayBuffer(password);
}

export function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

export function toUint8(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer.slice(0));
}

export function randomBytes(length: number): Uint8Array {
  ensureCryptoEngine();
  const view = new Uint8Array(length);
  pkijs.getRandomValues(view);
  return view;
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
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
  if (value && typeof value === "object" && "value" in value) {
    const text = (value as { value: unknown }).value;
    if (typeof text === "string" && text.length > 0) {
      return text;
    }
  }
  return undefined;
}

function readOctetBytes(value: unknown): Uint8Array | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const block = value as {
    valueBlock?: { valueHexView?: Uint8Array };
    getValue?: () => ArrayBuffer;
  };
  if (block.valueBlock?.valueHexView) {
    return new Uint8Array(block.valueBlock.valueHexView);
  }
  if (typeof block.getValue === "function") {
    return toUint8(block.getValue());
  }
  return undefined;
}

function bagFriendlyName(bag: pkijs.SafeBag): string | undefined {
  for (const attr of bag.bagAttributes ?? []) {
    if (attr.type === OID_FRIENDLY_NAME) {
      const name = readBmpOrUtf8(attr.values[0]);
      if (name) {
        return name;
      }
    }
  }
  return undefined;
}

function bagLocalKeyId(bag: pkijs.SafeBag): Uint8Array | undefined {
  for (const attr of bag.bagAttributes ?? []) {
    if (attr.type === OID_LOCAL_KEY_ID) {
      const id = readOctetBytes(attr.values[0]);
      if (id && id.byteLength > 0) {
        return id;
      }
    }
  }
  return undefined;
}

async function encryptShroudedKey(
  pkcs8: Uint8Array,
  password: ArrayBuffer,
): Promise<pkijs.PKCS8ShroudedKeyBag> {
  const pki = pkijs.PrivateKeyInfo.fromBER(toArrayBuffer(pkcs8));
  const shrouded = new pkijs.PKCS8ShroudedKeyBag({ parsedValue: pki });
  await shrouded.makeInternalValues({
    password,
    contentEncryptionAlgorithm: {
      name: "AES-CBC",
      length: 128,
    },
    hmacHashAlgorithm: "SHA-1",
    iterationCount: PKCS12_ITERATIONS,
  });
  return shrouded;
}

async function decryptShroudedKey(
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
    secretValue: new asn1js.OctetString({ valueHex: toArrayBuffer(secret) }),
  });
}

/**
 * Encode the in-memory store as PKCS#12 bytes with password-based MAC integrity.
 */
export async function encodePkcs12(
  store: KeyStore,
  password: string,
): Promise<Uint8Array> {
  ensureCryptoEngine();
  const passwordBuf = passwordBuffer(password);
  const safeBags: pkijs.SafeBag[] = [];

  for (const entry of store.entries) {
    const localKeyId = entry.localKeyId;
    const attrs = bagAttributes(entry.alias, localKeyId);

    if (entry.entryType === "KEY_PAIR" && entry.pkcs8) {
      const shrouded = await encryptShroudedKey(entry.pkcs8, passwordBuf);
      safeBags.push(
        new pkijs.SafeBag({
          bagId: OID_SHROUDED_KEY_BAG,
          bagValue: shrouded,
          bagAttributes: attrs,
        }),
      );
      for (const certDer of entry.certificates ?? []) {
        safeBags.push(
          new pkijs.SafeBag({
            bagId: OID_CERT_BAG,
            bagValue: certBagFromDer(certDer),
            bagAttributes: bagAttributes(entry.alias, localKeyId),
          }),
        );
      }
    } else if (entry.entryType === "TRUSTED_CERT") {
      for (const certDer of entry.certificates ?? []) {
        safeBags.push(
          new pkijs.SafeBag({
            bagId: OID_CERT_BAG,
            bagValue: certBagFromDer(certDer),
            bagAttributes: attrs,
          }),
        );
      }
    } else if (entry.entryType === "KEY") {
      if (entry.secret) {
        safeBags.push(
          new pkijs.SafeBag({
            bagId: OID_SECRET_BAG,
            bagValue: secretBagFromBytes(entry.secret),
            bagAttributes: attrs,
          }),
        );
      } else if (entry.pkcs8) {
        const shrouded = await encryptShroudedKey(entry.pkcs8, passwordBuf);
        safeBags.push(
          new pkijs.SafeBag({
            bagId: OID_SHROUDED_KEY_BAG,
            bagValue: shrouded,
            bagAttributes: attrs,
          }),
        );
      }
    }
  }

  const pfx = new pkijs.PFX({
    parsedValue: {
      integrityMode: 0,
      authenticatedSafe: new pkijs.AuthenticatedSafe({
        parsedValue: {
          safeContents: [
            {
              privacyMode: 0,
              value: new pkijs.SafeContents({ safeBags }),
            },
          ],
        },
      }),
    },
  });

  if (!pfx.parsedValue?.authenticatedSafe) {
    throw new Error("PKCS#12 authenticatedSafe is empty");
  }

  await pfx.parsedValue.authenticatedSafe.makeInternalValues({
    safeContents: [{}],
  });

  await pfx.makeInternalValues({
    password: passwordBuf,
    iterations: PKCS12_ITERATIONS,
    pbkdf2HashAlgorithm: HMAC_HASH,
    hmacHashAlgorithm: HMAC_HASH,
  } as Parameters<pkijs.PFX["makeInternalValues"]>[0]);

  return toUint8(pfx.toSchema().toBER(false));
}

interface RawBag {
  bagId: string;
  alias?: string;
  localKeyId?: Uint8Array;
  pkcs8?: Uint8Array;
  certDer?: Uint8Array;
  secret?: Uint8Array;
}

function groupEntries(rawBags: RawBag[]): KernelEntry[] {
  const keys: RawBag[] = [];
  const certs: RawBag[] = [];
  const secrets: RawBag[] = [];

  for (const bag of rawBags) {
    if (bag.pkcs8) {
      keys.push(bag);
    } else if (bag.certDer) {
      certs.push(bag);
    } else if (bag.secret) {
      secrets.push(bag);
    }
  }

  const usedCerts = new Set<RawBag>();
  const entries: KernelEntry[] = [];
  const usedAliases = new Set<string>();

  function uniqueAlias(preferred: string, fallback: string): string {
    let alias = preferred || fallback;
    if (!alias) {
      alias = fallback;
    }
    let n = 2;
    const base = alias;
    while (usedAliases.has(alias)) {
      alias = `${base}-${n}`;
      n += 1;
    }
    usedAliases.add(alias);
    return alias;
  }

  for (const key of keys) {
    const keyIdHex = key.localKeyId ? toHex(key.localKeyId) : undefined;
    const matchedCerts = certs.filter((cert) => {
      if (usedCerts.has(cert)) {
        return false;
      }
      if (keyIdHex && cert.localKeyId && toHex(cert.localKeyId) === keyIdHex) {
        return true;
      }
      if (key.alias && cert.alias && key.alias === cert.alias && !cert.localKeyId && !key.localKeyId) {
        return true;
      }
      return false;
    });
    for (const cert of matchedCerts) {
      usedCerts.add(cert);
    }

    const localKeyId = key.localKeyId ?? matchedCerts[0]?.localKeyId ?? randomBytes(20);
    const alias = uniqueAlias(
      key.alias ?? matchedCerts[0]?.alias ?? "",
      `key-${toHex(localKeyId).slice(0, 8)}`,
    );

    if (matchedCerts.length > 0) {
      entries.push({
        alias,
        entryType: "KEY_PAIR",
        pkcs8: key.pkcs8,
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
      alias: uniqueAlias(secret.alias ?? "", `secret-${toHex(localKeyId).slice(0, 8)}`),
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
      alias: uniqueAlias(cert.alias ?? "", `cert-${toHex(localKeyId).slice(0, 8)}`),
      entryType: "TRUSTED_CERT",
      certificates: cert.certDer ? [cert.certDer] : [],
      localKeyId,
    });
  }

  return entries;
}

export function mapLoadError(error: unknown): ErrorId {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Integrity for the PKCS#12 data is broken")) {
    return "wrongPassword";
  }
  return "invalidFile";
}

/**
 * Parse PKCS#12 bytes. MAC failure is `wrongPassword`. Structural failure is `invalidFile`.
 */
export async function decodePkcs12(
  bytes: Uint8Array,
  password: string,
): Promise<{ store: KeyStore } | { errorId: ErrorId }> {
  ensureCryptoEngine();
  const passwordBuf = passwordBuffer(password);

  let pfx: pkijs.PFX;
  try {
    pfx = pkijs.PFX.fromBER(toArrayBuffer(bytes));
  } catch {
    return { errorId: "invalidFile" };
  }

  try {
    await pfx.parseInternalValues({
      password: passwordBuf,
      checkIntegrity: true,
    });
  } catch (error) {
    return { errorId: mapLoadError(error) };
  }

  const authenticatedSafe = pfx.parsedValue?.authenticatedSafe;
  if (!authenticatedSafe) {
    return { errorId: "invalidFile" };
  }

  const parseParams = authenticatedSafe.safeContents.map((content) => {
    if (content.contentType === pkijs.ContentInfo.ENCRYPTED_DATA) {
      return { password: passwordBuf };
    }
    return {};
  });

  try {
    await authenticatedSafe.parseInternalValues({ safeContents: parseParams });
  } catch (error) {
    return { errorId: mapLoadError(error) };
  }

  const parsed = authenticatedSafe.parsedValue as {
    safeContents?: Array<{ value?: pkijs.SafeContents }>;
  };
  const rawBags: RawBag[] = [];
  let bagIndex = 0;

  for (const content of parsed.safeContents ?? []) {
    for (const bag of content.value?.safeBags ?? []) {
      bagIndex += 1;
      const alias = bagFriendlyName(bag);
      const localKeyId = bagLocalKeyId(bag);
      const raw: RawBag = {
        bagId: bag.bagId,
        alias,
        localKeyId,
      };

      try {
        if (bag.bagId === OID_SHROUDED_KEY_BAG) {
          raw.pkcs8 = await decryptShroudedKey(
            bag.bagValue as pkijs.PKCS8ShroudedKeyBag,
            passwordBuf,
          );
        } else if (bag.bagId === OID_KEY_BAG) {
          const pki = bag.bagValue as pkijs.PrivateKeyInfo;
          raw.pkcs8 = toUint8(pki.toSchema().toBER(false));
        } else if (bag.bagId === OID_CERT_BAG) {
          const certBag = bag.bagValue as pkijs.CertBag;
          const cert = certBag.parsedValue as pkijs.Certificate | undefined;
          if (cert && typeof cert.toSchema === "function") {
            raw.certDer = toUint8(cert.toSchema().toBER(false));
          }
        } else if (bag.bagId === OID_SECRET_BAG) {
          const secretBag = bag.bagValue as pkijs.SecretBag;
          raw.secret = readOctetBytes(secretBag.secretValue);
        }
      } catch (error) {
        return { errorId: mapLoadError(error) };
      }

      if (!raw.alias) {
        raw.alias = `entry-${bagIndex}`;
      }
      rawBags.push(raw);
    }
  }

  return {
    store: {
      type: "PKCS12",
      dirty: false,
      entries: groupEntries(rawBags),
    },
  };
}

export function cloneStore(store: KeyStore): KeyStore {
  return {
    type: store.type,
    dirty: store.dirty,
    entries: store.entries.map((entry) => ({
      alias: entry.alias,
      entryType: entry.entryType,
      pkcs8: entry.pkcs8 ? new Uint8Array(entry.pkcs8) : undefined,
      certificates: entry.certificates?.map((c) => new Uint8Array(c)),
      secret: entry.secret ? new Uint8Array(entry.secret) : undefined,
      localKeyId: new Uint8Array(entry.localKeyId),
    })),
  };
}

export function factsOf(store: KeyStore, errorId?: ErrorId) {
  return {
    type: store.type,
    aliases: store.entries.map((e) => e.alias),
    entryType: store.entries.map((e) => ({
      alias: e.alias,
      type: e.entryType,
    })),
    dirty: store.dirty,
    errorId,
  };
}

export function emptyFacts(errorId?: ErrorId) {
  return {
    type: "PKCS12" as const,
    aliases: [] as string[],
    entryType: [] as { alias: string; type: EntryType }[],
    dirty: false,
    errorId,
  };
}

export function hasAlias(store: KeyStore, alias: string): boolean {
  return store.entries.some((e) => e.alias === alias);
}
