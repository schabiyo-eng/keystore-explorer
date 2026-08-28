/** @vitest-environment jsdom */
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import App from "../App";
import { proofCommands } from "../features/host-proof/index";
import { featureModulePaths, loadFeatures } from "./loadFeatures";
import { allMenuItems } from "./menu-config";
import { registerFeature, resetRegistry } from "./registry";
import { resetSession, session } from "./session";

const here = path.resolve(process.cwd(), "src/shell");

function readShell(name: string): string {
  return readFileSync(path.join(here, name), "utf8");
}

describe("plugin host", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    loadFeatures();
  });

  afterEach(() => {
    cleanup();
  });

  it("loads feature modules via glob including a stub under features/", () => {
    const loader = readShell("loadFeatures.ts");
    expect(loader).toContain('import.meta.glob("../features/*/index.ts", { eager: true })');
    expect(featureModulePaths().some((id) => id.includes("features/file/index.ts"))).toBe(true);
    expect(featureModulePaths().some((id) => id.includes("features/host-proof/index.ts"))).toBe(
      true,
    );
  });

  it("paints the full menubar and toolbar from UI.md without later-slice rows", () => {
    render(<App />);
    for (const item of allMenuItems()) {
      expect(document.querySelector(`[data-testid="${item.id}"]`), item.id).not.toBeNull();
    }
    expect(screen.getByTestId("app.frame")).toBeTruthy();
    expect(screen.getByTestId("app.menubar")).toBeTruthy();
    expect(screen.getByTestId("app.toolbar")).toBeTruthy();
    expect(screen.getByTestId("app.status-bar")).toBeTruthy();
    expect(screen.getByTestId("app.quickstart")).toBeTruthy();
    expect(screen.getByTestId("app.dialog-host")).toBeTruthy();
    const pkcs12 = document.querySelector('[data-testid="dialog.new-keystore.type.pkcs12"]');
    const jks = document.querySelector('[data-testid="dialog.new-keystore.type.jks"]');
    expect(pkcs12).not.toBeNull();
    expect(jks).not.toBeNull();
    expect(pkcs12).not.toBeDisabled();
    expect(jks).toBeDisabled();
    expect(screen.getByTestId("menu.file.new")).not.toBeDisabled();
    expect(screen.getByTestId("menu.tools.generate-key-pair")).toBeDisabled();
    expect(screen.getByTestId("toolbar.generate-key-pair")).toBeDisabled();
  });

  it("enables a features/ stub command with no MenuBar, Toolbar, or loadFeatures source change", () => {
    const menuBar = readShell("MenuBar.tsx");
    const toolbar = readShell("Toolbar.tsx");
    const loader = readShell("loadFeatures.ts");

    render(<App />);
    expect(screen.getByTestId("menu.tools.generate-key-pair")).toBeDisabled();

    registerFeature({ commands: proofCommands });
    cleanup();
    render(<App />);

    expect(screen.getByTestId("menu.tools.generate-key-pair")).not.toBeDisabled();
    expect(screen.getByTestId("toolbar.generate-key-pair")).not.toBeDisabled();

    expect(readShell("MenuBar.tsx")).toBe(menuBar);
    expect(readShell("Toolbar.tsx")).toBe(toolbar);
    expect(readShell("loadFeatures.ts")).toBe(loader);
    expect(loader).toContain('import.meta.glob("../features/*/index.ts", { eager: true })');
    expect(menuBar).toContain("MENUS.map");
    expect(toolbar).toContain("TOOLBAR_GROUPS");
    expect(readShell("menu-config.ts")).toContain("menu.tools.generate-key-pair");
    expect(readShell("menu-config.ts")).toContain("toolbar.generate-key-pair");
  });

  it("exposes the frozen session API including history stubs", () => {
    expect(typeof session.getActive).toBe("function");
    expect(typeof session.getSelection).toBe("function");
    expect(typeof session.apply).toBe("function");
    expect(typeof session.pushHistory).toBe("function");
    expect(typeof session.undo).toBe("function");
    expect(typeof session.redo).toBe("function");
    expect(session.getActive()).toBeNull();
    expect(session.getSelection()).toEqual([]);
    session.pushHistory();
    session.undo();
    session.redo();
  });
});
