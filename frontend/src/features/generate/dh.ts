import * as asn1js from "asn1js";

let lastPem = "";

export function lastDhParametersPem(): string {
  return lastPem;
}

export function rememberDhParametersPem(pem: string): void {
  lastPem = pem;
}

export function forgetDhParametersPem(): void {
  lastPem = "";
}

/** RFC 2409 Second Oakley Group (1024-bit MODP). */
const P_1024 =
  "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74" +
  "020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F1437" +
  "4FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED" +
  "EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE65381FFFFFFFFFFFFFFFF";

/** RFC 3526 2048-bit MODP Group 14. */
const P_2048 =
  "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74" +
  "020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F1437" +
  "4FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED" +
  "EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF05" +
  "98DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB" +
  "9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B" +
  "E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF695581718" +
  "3995497CEA956AE515D2261898FA051015728E5A8AACAA68FFFFFFFFFFFFFFFF";

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function integerFromUnsigned(bytes: Uint8Array): asn1js.Integer {
  const leadingZero = bytes[0] !== undefined && bytes[0] >= 0x80 ? 1 : 0;
  const valueHex = new ArrayBuffer(bytes.length + leadingZero);
  const view = new Uint8Array(valueHex);
  view.set(bytes, leadingZero);
  return new asn1js.Integer({ valueHex });
}

function toPem(der: ArrayBuffer): string {
  const bytes = new Uint8Array(der);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const b64 = btoa(binary).replace(/(.{64})/g, "$1\n");
  return `-----BEGIN DH PARAMETERS-----\n${b64}\n-----END DH PARAMETERS-----`;
}

export function dhParametersPem(size: number): string | undefined {
  const hex = size === 1024 ? P_1024 : size === 2048 ? P_2048 : undefined;
  if (!hex) {
    return undefined;
  }
  const sequence = new asn1js.Sequence({
    value: [integerFromUnsigned(hexToBytes(hex)), new asn1js.Integer({ value: 2 })],
  });
  return toPem(sequence.toBER(false));
}
