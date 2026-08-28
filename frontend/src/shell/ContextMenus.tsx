import {
  CONTEXT_KEY,
  CONTEXT_KEYPAIR,
  CONTEXT_KEYSTORE,
  CONTEXT_MULTI,
  CONTEXT_TAB,
  CONTEXT_TRUSTED,
} from "./menu-config";
import { MenuItemList } from "./ItemButton";
import type { MenuItemDef } from "./types";

const CONTEXT_MENUS: { id: string; items: MenuItemDef[] }[] = [
  { id: "context.tab", items: CONTEXT_TAB },
  { id: "context.keystore", items: CONTEXT_KEYSTORE },
  { id: "context.keypair", items: CONTEXT_KEYPAIR },
  { id: "context.trusted", items: CONTEXT_TRUSTED },
  { id: "context.key", items: CONTEXT_KEY },
  { id: "context.multi", items: CONTEXT_MULTI },
];

export function ContextMenus() {
  return (
    <div className="context-menus">
      {CONTEXT_MENUS.map((menu) => (
        <div key={menu.id} data-testid={menu.id} className="context-menu">
          <MenuItemList items={menu.items} />
        </div>
      ))}
    </div>
  );
}
