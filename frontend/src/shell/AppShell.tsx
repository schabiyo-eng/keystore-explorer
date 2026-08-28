import { MenuBar } from "./MenuBar";
import { Toolbar } from "./Toolbar";
import { QuickStart } from "./QuickStart";
import { TabStrip } from "./TabStrip";
import { EntryTable } from "./EntryTable";
import { StatusBar } from "./StatusBar";
import { DialogHost } from "./DialogHost";
import { ContextMenus } from "./ContextMenus";
import { useSession } from "./useSession";
import "./shell.css";

export function AppShell() {
  const state = useSession();
  const hasTabs = state.tabs.length > 0;

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
