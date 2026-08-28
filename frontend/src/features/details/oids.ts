/** Distinguished-name, signature, and key algorithm OIDs for details inspect. */

export const OID_CN = "2.5.4.3";
export const OID_C = "2.5.4.6";
export const OID_L = "2.5.4.7";
export const OID_ST = "2.5.4.8";
export const OID_O = "2.5.4.10";
export const OID_OU = "2.5.4.11";
export const OID_EMAIL = "1.2.840.113549.1.9.1";
export const OID_RSA = "1.2.840.113549.1.1.1";

export const DN_OIDS: Record<string, string> = {
  [OID_CN]: "CN",
  [OID_C]: "C",
  [OID_L]: "L",
  [OID_ST]: "ST",
  [OID_O]: "O",
  [OID_OU]: "OU",
  [OID_EMAIL]: "E",
};

export const SIG_OIDS: Record<string, string> = {
  "1.2.840.113549.1.1.5": "SHA1withRSA",
  "1.2.840.113549.1.1.11": "SHA256withRSA",
  "1.2.840.113549.1.1.12": "SHA384withRSA",
  "1.2.840.113549.1.1.13": "SHA512withRSA",
  [OID_RSA]: "RSA",
};

export const KEY_OIDS: Record<string, string> = {
  [OID_RSA]: "RSA",
};

export function algorithmName(oid: string, table: Record<string, string>): string {
  return table[oid] ?? oid;
}
