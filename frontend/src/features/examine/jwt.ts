import { derFromB64 } from "./decode";

function jsonFromBase64Url(part: string): unknown {
  const padded = part.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (part.length % 4)) % 4);
  const json = new TextDecoder().decode(derFromB64(padded) ?? new Uint8Array());
  return JSON.parse(json) as unknown;
}

export function isJwtText(text: string): boolean {
  const parts = text.trim().split(".");
  if (parts.length !== 3 || !parts[0] || !parts[1]) {
    return false;
  }
  try {
    const header = jsonFromBase64Url(parts[0]);
    return typeof header === "object" && header !== null && "alg" in header;
  } catch {
    return false;
  }
}

export function jwtParts(text: string): { header: string; payload: string; signature: string } | undefined {
  if (!isJwtText(text)) {
    return undefined;
  }
  const parts = text.trim().split(".");
  const pretty = (part: string | undefined) => {
    if (!part) {
      return "";
    }
    try {
      return `${JSON.stringify(jsonFromBase64Url(part), null, 2)}`;
    } catch {
      return part;
    }
  };
  return {
    header: pretty(parts[0]),
    payload: pretty(parts[1]),
    signature: parts[2] ?? "",
  };
}
