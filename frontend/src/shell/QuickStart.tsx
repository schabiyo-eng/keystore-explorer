import { QUICKSTART_ITEMS } from "./menu-config";
import { ItemButton } from "./ItemButton";
import { useSession } from "./useSession";

export function QuickStart() {
  useSession();
  return (
    <div data-testid="app.quickstart" className="quickstart">
      <h1>KeyStore Explorer</h1>
      <p>Create or open a PKCS#12 KeyStore to get started.</p>
      <div className="quickstart-actions">
        {QUICKSTART_ITEMS.map((item) => (
          <ItemButton key={item.id} item={item} className="quickstart-btn" />
        ))}
      </div>
    </div>
  );
}
