import { host } from "./session";
import { useSession } from "./useSession";

export function TabStrip() {
  const state = useSession();
  if (state.tabs.length === 0) {
    return null;
  }

  return (
    <div data-testid="app.tabs" className="tabs">
      {state.tabs.map((tab) => {
        const active = tab.id === state.activeId;
        const label = `${tab.name}${tab.store.dirty ? "*" : ""}`;
        return (
          <button
            key={tab.id}
            type="button"
            className={active ? "tab active" : "tab"}
            data-testid={active ? "keystore.tab.active" : undefined}
            onClick={() => host.setActive(tab.id)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
