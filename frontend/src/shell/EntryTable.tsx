import { TABLE_COLUMNS } from "./menu-config";
import { getActive } from "./session";
import { useSession } from "./useSession";

function typeLabel(entryType: string): string {
  switch (entryType) {
    case "KEY_PAIR":
      return "Key Pair";
    case "TRUSTED_CERT":
      return "Trusted Certificate";
    case "KEY":
      return "Key";
    default:
      return entryType;
  }
}

export function EntryTable() {
  useSession();
  const active = getActive();
  if (!active) {
    return null;
  }

  return (
    <div className="table-wrap">
      <table data-testid="keystore.table" className="entry-table">
        <thead>
          <tr>
            {TABLE_COLUMNS.map((col) => (
              <th key={col.id} data-testid={col.id}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {active.store.entries.map((entry) => (
            <tr key={entry.alias}>
              <td>{typeLabel(entry.entryType)}</td>
              <td>Unlocked</td>
              <td>—</td>
              <td>{entry.alias}</td>
              <td>—</td>
              <td>—</td>
              <td>—</td>
              <td>—</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
