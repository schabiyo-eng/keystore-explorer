import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import {
  bagFriendlyName,
  bagLocalKeyId,
  decryptShroudedKey,
  groupEntries,
  PKCS12_ITERATIONS,
  safeBagsForEntry,
  readSecretBagBytes,
  type RawBag,
} from "./bags";
import { passwordBuffer, toArrayBuffer, toUint8 } from "./bytes";
import { installWebCrypto } from "./crypto";
import {
  OID_CERT_BAG,
  OID_KEY_BAG,
  OID_SECRET_BAG,
  OID_SHROUDED_KEY_BAG,
} from "./oids";
import type { DecodePkcs12Result, ErrorId, KeyStore } from "./types";
import { PKCS12 } from "./types";

const HMAC_HASH = "SHA-256";
const PKCS12_MAC_BROKEN = "Integrity for the PKCS#12 data is broken";

function parseSafeContentsBer(raw: ArrayBuffer): pkijs.SafeContents {
  const asn1 = asn1js.fromBER(raw);
  if (asn1.offset === -1) {
    throw new Error("Cannot parse SafeContents");
  }
  try {
    return pkijs.SafeContents.fromBER(raw);
  } catch (error) {
    const seq = asn1.result as { valueBlock?: { value?: unknown[] } };
    const items = seq.valueBlock?.value;
    if (Array.isArray(items) && items.length === 0) {
      return new pkijs.SafeContents({ safeBags: [] });
    }
    throw error;
  }
}

export function mapLoadError(error: unknown): ErrorId {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes(PKCS12_MAC_BROKEN)) {
    return "wrongPassword";
  }
  return "invalidFile";
}

/**
 * Encode the in-memory store as PKCS#12 bytes with password-based MAC integrity.
 */
export async function encodePkcs12(
  store: KeyStore,
  password: string,
): Promise<Uint8Array> {
  installWebCrypto();
  const passwordBuf = passwordBuffer(password);
  const safeBags: pkijs.SafeBag[] = [];

  for (const entry of store.entries) {
    safeBags.push(...(await safeBagsForEntry(entry, passwordBuf)));
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

async function bagsFromContent(
  content: pkijs.ContentInfo,
  passwordBuf: ArrayBuffer,
): Promise<{ bags: pkijs.SafeBag[] } | { errorId: ErrorId }> {
  let safeBer: ArrayBuffer;
  if (content.contentType === pkijs.ContentInfo.DATA) {
    const octet = content.content as { getValue?: () => ArrayBuffer };
    if (typeof octet.getValue !== "function") {
      return { errorId: "invalidFile" };
    }
    safeBer = octet.getValue();
  } else if (content.contentType === pkijs.ContentInfo.ENCRYPTED_DATA) {
    try {
      const cmsEncrypted = new pkijs.EncryptedData({ schema: content.content });
      safeBer = await cmsEncrypted.decrypt({ password: passwordBuf });
    } catch (error) {
      return { errorId: mapLoadError(error) };
    }
  } else {
    return { errorId: "invalidFile" };
  }

  try {
    return { bags: parseSafeContentsBer(safeBer).safeBags };
  } catch {
    return { errorId: "invalidFile" };
  }
}

async function rawBagFromSafeBag(
  bag: pkijs.SafeBag,
  passwordBuf: ArrayBuffer,
  bagIndex: number,
): Promise<{ raw: RawBag } | { errorId: ErrorId }> {
  const raw: RawBag = {
    bagId: bag.bagId,
    alias: bagFriendlyName(bag) ?? `entry-${bagIndex}`,
    localKeyId: bagLocalKeyId(bag),
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
      raw.secret = readSecretBagBytes(bag.bagValue as pkijs.SecretBag);
    }
  } catch (error) {
    return { errorId: mapLoadError(error) };
  }

  return { raw };
}

/**
 * Parse PKCS#12 bytes. MAC failure is `wrongPassword`. Structural failure is `invalidFile`.
 */
export async function decodePkcs12(
  bytes: Uint8Array,
  password: string,
): Promise<DecodePkcs12Result> {
  installWebCrypto();
  const passwordBuf = passwordBuffer(password);

  let pfx: pkijs.PFX;
  try {
    pfx = pkijs.PFX.fromBER(toArrayBuffer(bytes));
  } catch {
    return { ok: false, errorId: "invalidFile" };
  }

  try {
    await pfx.parseInternalValues({
      password: passwordBuf,
      checkIntegrity: true,
    });
  } catch (error) {
    return { ok: false, errorId: mapLoadError(error) };
  }

  const authenticatedSafe = pfx.parsedValue?.authenticatedSafe;
  if (!authenticatedSafe) {
    return { ok: false, errorId: "invalidFile" };
  }

  const rawBags: RawBag[] = [];
  let bagIndex = 0;

  for (const content of authenticatedSafe.safeContents) {
    const parsed = await bagsFromContent(content, passwordBuf);
    if ("errorId" in parsed) {
      return { ok: false, errorId: parsed.errorId };
    }
    for (const bag of parsed.bags) {
      bagIndex += 1;
      const decoded = await rawBagFromSafeBag(bag, passwordBuf, bagIndex);
      if ("errorId" in decoded) {
        return { ok: false, errorId: decoded.errorId };
      }
      rawBags.push(decoded.raw);
    }
  }

  return {
    ok: true,
    store: {
      type: PKCS12,
      dirty: false,
      entries: groupEntries(rawBags),
    },
  };
}
