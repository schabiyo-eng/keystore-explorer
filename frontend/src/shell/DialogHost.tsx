import { BUILTIN_DIALOGS } from "./dialogs";
import { getDialog } from "./registry";
import { useSession } from "./useSession";

export function DialogHost() {
  const { dialog } = useSession();
  const Registered = dialog ? getDialog(dialog) : undefined;

  return (
    <div data-testid="app.dialog-host" className="dialog-host">
      {dialog && Registered ? (
        <div className="modal-overlay">
          <Registered />
        </div>
      ) : null}
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
