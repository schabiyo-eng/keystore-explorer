import { MENUS } from "./menu-config";
import { MenuItemList } from "./ItemButton";
import { useSession } from "./useSession";

export function MenuBar() {
  useSession();
  return (
    <nav data-testid="app.menubar" className="menubar" role="menubar">
      {MENUS.map((menu) => (
        <div key={menu.id} className="menu">
          <button type="button" className="menu-title" data-testid={menu.id}>
            {menu.label}
          </button>
          <MenuItemList items={menu.items} />
        </div>
      ))}
    </nav>
  );
}
