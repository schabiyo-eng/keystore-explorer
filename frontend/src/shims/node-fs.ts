export function existsSync(_path: string): boolean {
  return false;
}

export function readFileSync(_path: string): Uint8Array {
  throw new Error("node:fs is not available in the browser");
}

export function readdirSync(_path: string): string[] {
  return [];
}
