import { getCommand } from "./registry";
import { getActive, getState } from "./session";
import { findControl } from "./menu-config";

const FRAME_ALWAYS = new Set([
  "app.frame",
  "app.menubar",
  "app.toolbar",
  "app.status-bar",
  "app.dialog-host",
]);

const TYPE_RADIOS = new Set([
  "dialog.new-keystore.type.pkcs12",
  "dialog.new-keystore.type.jceks",
  "dialog.new-keystore.type.jks",
  "dialog.new-keystore.type.bks",
  "dialog.new-keystore.type.uber",
  "dialog.new-keystore.type.bcfks",
  "dialog.new-keystore.type.pem",
  "dialog.new-keystore.type.kdb",
]);

const PKCS12_RADIO = "dialog.new-keystore.type.pkcs12";

export function isControlEnabled(id: string): boolean {
  if (FRAME_ALWAYS.has(id)) {
    return true;
  }
  if (id === "app.quickstart") {
    return getState().tabs.length === 0;
  }
  if (id === "app.tabs" || id === "keystore.tab.active" || id === "keystore.table") {
    return getState().tabs.length > 0;
  }
  if (TYPE_RADIOS.has(id)) {
    return id === PKCS12_RADIO;
  }

  const item = findControl(id);
  if (!item) {
    return false;
  }
  if (item.stub) {
    return false;
  }
  if (!item.command) {
    return true;
  }
  const spec = getCommand(item.command);
  if (!spec) {
    return false;
  }
  if (spec.canExecute) {
    return spec.canExecute();
  }
  return getActive() !== null || ["newKeyStore", "openKeyStore", "exitApp"].includes(item.command);
}
