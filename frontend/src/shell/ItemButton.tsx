import { hasCommand, runCommand } from "./registry";
import { isControlEnabled } from "./controls";
import { useSession } from "./useSession";
import type { MenuItemDef } from "./types";

interface ItemButtonProps {
  item: MenuItemDef;
  className?: string;
}

export function ItemButton({ item, className }: ItemButtonProps) {
  useSession();
  const enabled = !item.stub && (item.command ? isControlEnabled(item.id) : true);
  const clickable = Boolean(item.command && hasCommand(item.command) && enabled);

  return (
    <button
      type="button"
      className={className}
      data-testid={item.id}
      disabled={!enabled}
      aria-label={item.label}
      onClick={() => {
        if (clickable && item.command) {
          void runCommand(item.command);
        }
      }}
    >
      {item.label}
    </button>
  );
}

export function MenuItemList({ items }: { items: MenuItemDef[] }) {
  return (
    <ul className="menu-list" role="menu">
      {items.map((item) => (
        <li key={item.id} className={item.separatorBefore ? "sep-before" : undefined} role="none">
          {item.submenu ? (
            <div className="submenu">
              <ItemButton item={item} className="menu-item has-sub" />
              <MenuItemList items={item.submenu} />
            </div>
          ) : (
            <ItemButton item={item} className="menu-item" />
          )}
        </li>
      ))}
    </ul>
  );
}
