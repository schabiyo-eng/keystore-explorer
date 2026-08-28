import { useSession } from "./useSession";

export function StatusBar() {
  const { tabs, activeId, exited, errorId } = useSession();
  const active = tabs.find((tab) => tab.id === activeId) ?? null;

  let text = "No KeyStore open";
  if (exited) {
    text = "Exited";
  } else if (active) {
    text = `${active.name}${active.store.dirty ? " (modified)" : ""} — PKCS#12`;
  } else if (errorId) {
    text = errorId;
  }

  return (
    <div data-testid="app.status-bar" className="status-bar" role="status">
      {text}
    </div>
  );
}
