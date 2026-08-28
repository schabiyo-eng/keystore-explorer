import { TABLE_COLUMNS } from "./menu-config";
import { host } from "./session";
import { useSession } from "./useSession";
import type { KernelEntry } from "../kernel";

function typeLabel(entry: KernelEntry): string {
  switch (entry.entryType) {
    case "KEY_PAIR":
      return "Key Pair";
    case "TRUSTED_CERT":
      return "Trusted Certificate";
    case "KEY":
      return "Key";
  }
}

export function EntryTable() {
  const { activeId, selection, tabs } = useSession();
  const active = tabs.find((tab) => tab.id === activeId) ?? null;
  if (!active) {
    return null;
  }

  const selected = new Set(selection);

  return (
    <div className="table-wrap">
      <table data-testid="keystore.table" className="entry-table" aria-label="KeyStore entries">
        <thead>
          <tr>
            {TABLE_COLUMNS.map((col) => (
              <th key={col.id} data-testid={col.id} scope="col">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {active.store.entries.map((entry) => {
            const isSelected = selected.has(entry.alias);
            return (
              <tr
                key={entry.alias}
                className={isSelected ? "selected" : undefined}
                aria-selected={isSelected}
                onClick={() => host.setSelection([entry.alias])}
              >
                <td>{typeLabel(entry)}</td>
                <td>Unlocked</td>
                <td>—</td>
                <td>{entry.alias}</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
