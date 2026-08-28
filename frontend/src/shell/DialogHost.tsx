import { createElement } from "react";
import {
  ConfirmDialog,
  ErrorDialog,
  FileOpenDialog,
  FileSaveDialog,
  NewKeyStoreDialog,
  NewPasswordDialog,
  PasswordDialog,
  ProblemDialog,
} from "./dialogs";
import { getDialog } from "./registry";
import { useSession } from "./useSession";

const BUILTIN_DIALOGS = {
  "dialog.new-keystore": NewKeyStoreDialog,
  "dialog.problem": ProblemDialog,
  "dialog.error": ErrorDialog,
  "dialog.password": PasswordDialog,
  "dialog.new-password": NewPasswordDialog,
  "dialog.confirm": ConfirmDialog,
  "dialog.file-open": FileOpenDialog,
  "dialog.file-save": FileSaveDialog,
} as const;

export function DialogHost() {
  const { dialog } = useSession();
  const Registered = dialog ? getDialog(dialog) : undefined;

  return (
    <div data-testid="app.dialog-host" className="dialog-host">
      {dialog && Registered
        ? createElement("div", { className: "modal-overlay" }, createElement(Registered))
        : null}
      {Object.entries(BUILTIN_DIALOGS).map(([id, Dialog]) => {
        const open = dialog === id && !Registered;
        return (
          <div key={id} className={open ? "modal-overlay" : "dialog-slot"}>
            <Dialog open={open} />
          </div>
        );
      })}
    </div>
  );
}
