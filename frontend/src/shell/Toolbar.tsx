import { TOOLBAR_GROUPS } from "./menu-config";
import { ItemButton } from "./ItemButton";
import { useSession } from "./useSession";

export function Toolbar() {
  useSession();
  return (
    <div data-testid="app.toolbar" className="toolbar" role="toolbar">
      {TOOLBAR_GROUPS.map((group, index) => (
        <div key={index} className="toolbar-group">
          {index > 0 ? <span className="toolbar-sep" /> : null}
          {group.map((item) => (
            <ItemButton key={item.id} item={item} className="toolbar-btn" />
          ))}
        </div>
      ))}
    </div>
  );
}
