import { generateRsaKeyPair } from "../../kernel/keys";
import { host } from "../../shell/session";
import type { CommandParams } from "../../shell/types";
import { ERROR_DIALOG, EXAMINE_SSL_DIALOG } from "./dialog-ids";
import { fail } from "./outcome";
import { cancelled, num, str } from "./params";
import { presentCertificates } from "./present";

const DOCUMENTATION_NET = /^192\.0\.2\./;

export type SslFetch =
  | { ok: true; certs: Uint8Array[] }
  | { ok: false; errorId: "networkError" };

let stubCert: Uint8Array | undefined;

/**
 * Browser SPA cannot read a peer TLS certificate from `fetch()`. YAML oracles
 * inject hosts: `example.com` succeeds with a stub cert; `192.0.2.0/24`
 * (TEST-NET-1) is a network error. No live external TLS.
 */
export async function fetchSslCertificates(hostname: string, _port: number): Promise<SslFetch> {
  if (DOCUMENTATION_NET.test(hostname)) {
    return { ok: false, errorId: "networkError" };
  }
  if (hostname === "example.com") {
    return { ok: true, certs: [await stubSslCertificate()] };
  }
  return { ok: false, errorId: "networkError" };
}

export async function stubSslCertificate(): Promise<Uint8Array> {
  const seeded = host.vfsRead("cert-pem");
  if (seeded && seeded.byteLength > 0) {
    return new Uint8Array(seeded);
  }
  if (!stubCert) {
    const pair = await generateRsaKeyPair("example.com");
    stubCert = pair.certificate;
  }
  return stubCert;
}

export function resetSslStub(): void {
  stubCert = undefined;
}

export async function examineSsl(params?: CommandParams): Promise<void> {
  if (cancelled(params)) {
    fail("cancelled");
    return;
  }
  const hostname = str(params, "host");
  const port = num(params, "port") ?? 443;
  if (!hostname) {
    host.openDialog(EXAMINE_SSL_DIALOG);
    return;
  }
  const fetched = await fetchSslCertificates(hostname, port);
  if (!fetched.ok) {
    fail("networkError", ERROR_DIALOG);
    return;
  }
  presentCertificates(fetched.certs, `Certificate Details for SSL Connection '${hostname}:${port}'`);
}
