/** Path helpers shared by the File feature and the YAML driver. */

export function fileBasename(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

export function untitledTabName(id: string): string {
  if (id.startsWith("untitled-")) {
    return `Untitled-${id.slice("untitled-".length)}`;
  }
  return id;
}

/** Test vfs: only explicit missing-parent segments fail. Slice prefixes (session/, export/) are valid. */
export function pathHasMissingDir(path: string): boolean {
  return path.split(/[/\\]/).some((part) => part === "missing-dir" || part === "missing-parent");
}

export function nextUntitledId(existingIds: Iterable<string>): string {
  const used = new Set(existingIds);
  let n = 1;
  while (used.has(`untitled-${n}`)) {
    n += 1;
  }
  return `untitled-${n}`;
}
