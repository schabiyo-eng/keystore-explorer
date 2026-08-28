import { host } from "./session";
import { useSession } from "./useSession";

export function TabStrip() {
  const { tabs, activeId } = useSession();
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div data-testid="app.tabs" className="tabs" role="tablist" aria-label="Open KeyStores">
      {tabs.map((tab) => {
        const selected = tab.id === activeId;
        const label = `${tab.name}${tab.store.dirty ? "*" : ""}`;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className={selected ? "tab active" : "tab"}
            data-testid={selected ? "keystore.tab.active" : undefined}
            aria-selected={selected}
            onClick={() => host.setActive(tab.id)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
