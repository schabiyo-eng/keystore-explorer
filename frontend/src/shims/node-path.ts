export function join(...parts: string[]): string {
  return parts.filter(Boolean).join("/").replace(/\/{2,}/g, "/");
}

export function resolve(...parts: string[]): string {
  return join(...parts);
}

export function dirname(filePath: string): string {
  const i = filePath.lastIndexOf("/");
  return i <= 0 ? "." : filePath.slice(0, i);
}

const path = { join, resolve, dirname };
export default path;
