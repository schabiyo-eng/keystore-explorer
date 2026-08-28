import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { randomBytes, toArrayBuffer, toUint8 } from "../../kernel/bytes";
import { getSubtle, installWebCrypto } from "../../kernel/crypto";
import type { KeyPairEntry } from "../../kernel/types";
import { base64Url, bytesToBase64, derFromPemOrDer, textBytes, toPem } from "./pem";
import { buildZip } from "./zip";

const RSA_IMPORT: RsaHashedImportParams = {
  name: "RSASSA-PKCS1-v1_5",
  hash: "SHA-256",
};

function serialNumber(): asn1js.Integer {
  const serial = randomBytes(8);
  serial[0] &= 0x7f;
  if (serial[0] === 0) {
    serial[0] = 1;
  }
  return new asn1js.Integer({ valueHex: toArrayBuffer(serial) });
}

function copyName(name: pkijs.RelativeDistinguishedNames): pkijs.RelativeDistinguishedNames {
  return new pkijs.RelativeDistinguishedNames({ schema: name.toSchema() });
}

function copySpki(spki: pkijs.PublicKeyInfo): pkijs.PublicKeyInfo {
  return new pkijs.PublicKeyInfo({ schema: spki.toSchema() });
}

export async function importRsaPrivateKey(pkcs8: Uint8Array): Promise<CryptoKey> {
  installWebCrypto();
  return getSubtle().importKey("pkcs8", toArrayBuffer(pkcs8), RSA_IMPORT, false, ["sign"]);
}

export function parseCertificate(der: Uint8Array): pkijs.Certificate {
  return pkijs.Certificate.fromBER(toArrayBuffer(der));
}

export function parseCsr(bytes: Uint8Array): pkijs.CertificationRequest {
  return pkijs.CertificationRequest.fromBER(toArrayBuffer(derFromPemOrDer(bytes)));
}

async function issueCertificate(params: {
  subject: pkijs.RelativeDistinguishedNames;
  subjectPublicKeyInfo: pkijs.PublicKeyInfo;
  issuer: KeyPairEntry;
}): Promise<Uint8Array> {
  const issuerCert = parseCertificate(params.issuer.certificates[0]!);
  const privateKey = await importRsaPrivateKey(params.issuer.pkcs8);
  const cert = new pkijs.Certificate();
  cert.version = 2;
  cert.serialNumber = serialNumber();
  cert.issuer = copyName(issuerCert.subject);
  cert.subject = copyName(params.subject);
  const now = new Date();
  cert.notBefore.value = now;
  cert.notAfter.value = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  cert.subjectPublicKeyInfo = copySpki(params.subjectPublicKeyInfo);
  await cert.sign(privateKey, "SHA-256");
  return toUint8(cert.toSchema().toBER(false));
}

export async function generateCsrPem(entry: KeyPairEntry): Promise<string> {
  const cert = parseCertificate(entry.certificates[0]!);
  const privateKey = await importRsaPrivateKey(entry.pkcs8);
  const csr = new pkijs.CertificationRequest();
  csr.version = 0;
  csr.subject = copyName(cert.subject);
  csr.subjectPublicKeyInfo = copySpki(cert.subjectPublicKeyInfo);
  await csr.sign(privateKey, "SHA-256");
  return toPem("CERTIFICATE REQUEST", toUint8(csr.toSchema(true).toBER(false)));
}

export async function signCsrToCertPem(csrBytes: Uint8Array, issuer: KeyPairEntry): Promise<string> {
  const csr = parseCsr(csrBytes);
  const der = await issueCertificate({
    subject: csr.subject,
    subjectPublicKeyInfo: csr.subjectPublicKeyInfo,
    issuer,
  });
  return toPem("CERTIFICATE", der);
}

export async function signCms(content: Uint8Array, entry: KeyPairEntry): Promise<Uint8Array> {
  const cert = parseCertificate(entry.certificates[0]!);
  const privateKey = await importRsaPrivateKey(entry.pkcs8);
  const cmsSigned = new pkijs.SignedData({
    encapContentInfo: new pkijs.EncapsulatedContentInfo({
      eContentType: pkijs.ContentInfo.DATA,
      eContent: new asn1js.OctetString({ valueHex: toArrayBuffer(content) }),
    }),
    signerInfos: [
      new pkijs.SignerInfo({
        sid: new pkijs.IssuerAndSerialNumber({
          issuer: cert.issuer,
          serialNumber: cert.serialNumber,
        }),
      }),
    ],
    certificates: [cert],
  });
  await cmsSigned.sign(privateKey, 0, "SHA-256");
  const cms = new pkijs.ContentInfo({
    contentType: pkijs.ContentInfo.SIGNED_DATA,
    content: cmsSigned.toSchema(true),
  });
  return toUint8(cms.toSchema().toBER(false));
}

export async function signJwt(
  claims: Record<string, unknown>,
  entry: KeyPairEntry,
): Promise<string> {
  const privateKey = await importRsaPrivateKey(entry.pkcs8);
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(claims.subject ?? claims.sub ?? ""),
    iss: String(claims.issuer ?? claims.iss ?? ""),
    aud: String(claims.audience ?? claims.aud ?? ""),
    iat: now,
  };
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = base64Url(JSON.stringify(payload));
  const signingInput = `${header}.${body}`;
  const signature = await getSubtle().sign(
    { name: "RSASSA-PKCS1-v1_5" },
    privateKey,
    textBytes(signingInput),
  );
  return `${signingInput}.${base64Url(new Uint8Array(signature))}`;
}

export async function signCrlDer(entry: KeyPairEntry): Promise<Uint8Array> {
  const cert = parseCertificate(entry.certificates[0]!);
  const privateKey = await importRsaPrivateKey(entry.pkcs8);
  const crl = new pkijs.CertificateRevocationList();
  crl.version = 1;
  crl.issuer = copyName(cert.subject);
  const now = new Date();
  crl.thisUpdate.value = now;
  crl.nextUpdate = new pkijs.Time({ value: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) });
  await crl.sign(privateKey, "SHA-256");
  return toUint8(crl.toSchema(true).toBER(false));
}

export async function signJarBytes(entry: KeyPairEntry): Promise<Uint8Array> {
  const manifest = textBytes(
    "Manifest-Version: 1.0\r\nCreated-By: KeyStore Explorer\r\n\r\n",
  );
  const sf = textBytes("Signature-Version: 1.0\r\nCreated-By: KeyStore Explorer\r\n\r\n");
  const rsa = await signCms(sf, entry);
  return buildZip([
    { name: "META-INF/MANIFEST.MF", data: manifest },
    { name: "META-INF/KSE.SF", data: sf },
    { name: "META-INF/KSE.RSA", data: rsa },
  ]);
}

export async function signMidletJad(
  jarBytes: Uint8Array,
  jarName: string,
  entry: KeyPairEntry,
): Promise<string> {
  const signature = await getSubtle().sign(
    { name: "RSASSA-PKCS1-v1_5" },
    await importRsaPrivateKey(entry.pkcs8),
    jarBytes,
  );
  const lines = [
    "MIDlet-Name: signed",
    "MIDlet-Version: 1.0.0",
    "MIDlet-Vendor: KeyStore Explorer",
    `MIDlet-Jar-URL: ${jarName}`,
    `MIDlet-Jar-Size: ${jarBytes.length}`,
    `MIDlet-Jar-RSA-SHA256: ${bytesToBase64(new Uint8Array(signature))}`,
    "",
  ];
  return lines.join("\n");
}

export async function issueKeyPairCertificate(
  subjectCertDer: Uint8Array,
  issuer: KeyPairEntry,
): Promise<Uint8Array> {
  const subjectCert = parseCertificate(subjectCertDer);
  return issueCertificate({
    subject: subjectCert.subject,
    subjectPublicKeyInfo: subjectCert.subjectPublicKeyInfo,
    issuer,
  });
}
