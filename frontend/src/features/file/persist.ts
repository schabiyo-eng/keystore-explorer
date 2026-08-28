import { save as kernelSave } from "../../kernel";
import type { ErrorId } from "../../kernel";
import { fileBasename, pathHasMissingDir } from "../../shell/paths";
import { host } from "../../shell/session";
import type { LastWrite, TabState } from "../../shell/types";

export function fail(errorId: ErrorId, dialog?: string): void {
  host.setError(errorId);
  if (dialog) {
    host.openDialog(dialog);
  } else {
    host.closeDialog();
  }
}

export function succeed(): void {
  host.clearError();
  host.closeDialog();
}

export async function persistTab(
  tab: TabState,
  path: string,
  password: string,
): Promise<LastWrite | null> {
  if (pathHasMissingDir(path)) {
    fail("notFound", "dialog.error");
    return null;
  }
  const saved = await kernelSave(tab.store, password);
  if (!saved.ok) {
    fail(saved.errorId, "dialog.error");
    return null;
  }
  host.vfsWrite(path, saved.bytes);
  host.updateTab(tab.id, {
    path,
    password,
    store: saved.store,
    bytes: saved.bytes,
    name: fileBasename(path),
  });
  return { path, bytes: saved.bytes, password };
}
