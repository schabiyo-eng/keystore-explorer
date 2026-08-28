import {
  CONTEXT_KEY,
  CONTEXT_KEYPAIR,
  CONTEXT_KEYSTORE,
  CONTEXT_MULTI,
  CONTEXT_TAB,
  CONTEXT_TRUSTED,
} from "./menu-config";
import { MenuItemList } from "./ItemButton";
import { useSession } from "./useSession";

export function ContextMenus() {
  useSession();
  return (
    <div className="context-menus">
      <div data-testid="context.tab" className="context-menu">
        <MenuItemList items={CONTEXT_TAB} />
      </div>
      <div data-testid="context.keystore" className="context-menu">
        <MenuItemList items={CONTEXT_KEYSTORE} />
      </div>
      <div data-testid="context.keypair" className="context-menu">
        <MenuItemList items={CONTEXT_KEYPAIR} />
      </div>
      <div data-testid="context.trusted" className="context-menu">
        <MenuItemList items={CONTEXT_TRUSTED} />
      </div>
      <div data-testid="context.key" className="context-menu">
        <MenuItemList items={CONTEXT_KEY} />
      </div>
      <div data-testid="context.multi" className="context-menu">
        <MenuItemList items={CONTEXT_MULTI} />
      </div>
    </div>
  );
}
