import { DialogHost } from "./DialogHost";
import { ContextMenus } from "./ContextMenus";
import { EntryTable } from "./EntryTable";
import { MenuBar } from "./MenuBar";
import { QuickStart } from "./QuickStart";
import { StatusBar } from "./StatusBar";
import { TabStrip } from "./TabStrip";
import { Toolbar } from "./Toolbar";
import { useSession } from "./useSession";
import "./shell.css";

export function AppShell() {
  const { tabs } = useSession();
  const hasTabs = tabs.length > 0;

  return (
    <div data-testid="app.frame" className="kse-frame">
      <MenuBar />
      <Toolbar />
      <div className="kse-body">
        {hasTabs ? (
          <>
            <TabStrip />
            <EntryTable />
          </>
        ) : (
          <QuickStart />
        )}
      </div>
      <StatusBar />
      <DialogHost />
      <ContextMenus />
    </div>
  );
}
