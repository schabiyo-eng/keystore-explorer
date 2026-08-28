import type * as pkijs from "pkijs";

const CN_OID = "2.5.4.3";

const SHORT_OIDS: Record<string, string> = {
  "2.5.4.3": "CN",
  "2.5.4.6": "C",
  "2.5.4.7": "L",
  "2.5.4.8": "ST",
  "2.5.4.10": "O",
  "2.5.4.11": "OU",
};

function asn1Text(value: unknown): string {
  if (!value || typeof value !== "object") {
    return String(value ?? "");
  }
  const obj = value as {
    getValue?: () => unknown;
    valueBlock?: { value?: unknown };
    value?: unknown;
  };
  if (typeof obj.getValue === "function") {
    const text = obj.getValue();
    if (typeof text === "string") {
      return text;
    }
  }
  if (typeof obj.valueBlock?.value === "string") {
    return obj.valueBlock.value;
  }
  if (typeof obj.value === "string") {
    return obj.value;
  }
  return "";
}

export function rdnToString(name: pkijs.RelativeDistinguishedNames): string {
  return name.typesAndValues
    .map((tv) => `${SHORT_OIDS[tv.type] ?? tv.type}=${asn1Text(tv.value)}`)
    .join(", ");
}

export function commonName(name: pkijs.RelativeDistinguishedNames): string {
  const match = name.typesAndValues.find((tv) => tv.type === CN_OID);
  return match ? asn1Text(match.value) : "";
}

export function displayName(name: pkijs.RelativeDistinguishedNames): string {
  return rdnToString(name) || commonName(name);
}
