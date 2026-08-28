import { redo, undo } from "../../shell/session";
import { hasActive } from "./active";
import { fail, succeed } from "./outcome";

export async function undoCommand(): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  undo();
  succeed();
}

export async function redoCommand(): Promise<void> {
  if (!hasActive()) {
    fail("storeNotWritable");
    return;
  }
  redo();
  succeed();
}
