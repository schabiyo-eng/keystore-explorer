/** Named YAML fixtures this slice's `when` steps may resolve (e.g. cert-pem). */
const named = new Map<string, Uint8Array>();

export function registerNamedFixture(id: string, bytes: Uint8Array): void {
  named.set(id, bytes);
}

export function namedFixture(id: string): Uint8Array | undefined {
  return named.get(id);
}
