import { getActive } from "./session";
import { useSession } from "./useSession";

export function StatusBar() {
  const state = useSession();
  const active = getActive();
  let text = "No KeyStore open";
  if (state.exited) {
    text = "Exited";
  } else if (active) {
    text = `${active.name}${active.store.dirty ? " (modified)" : ""} — PKCS#12`;
  } else if (state.errorId) {
    text = state.errorId;
  }

  return (
    <div data-testid="app.status-bar" className="status-bar">
      {text}
    </div>
  );
}
