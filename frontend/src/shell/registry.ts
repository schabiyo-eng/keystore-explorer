import type { ComponentType } from "react";
import type { CommandParams, CommandSpec, FeatureModule } from "./types";

const commands = new Map<string, CommandSpec>();
const dialogs = new Map<string, ComponentType>();

function isFeatureModule(value: unknown): value is FeatureModule {
  return typeof value === "object" && value !== null;
}

export function registerCommand(name: string, spec: CommandSpec): void {
  commands.set(name, spec);
}

export function registerDialog(id: string, component: ComponentType): void {
  dialogs.set(id, component);
}

export function registerFeature(module: unknown): void {
  if (!isFeatureModule(module)) {
    return;
  }
  if (module.commands) {
    for (const [name, spec] of Object.entries(module.commands)) {
      registerCommand(name, spec);
    }
  }
  if (module.dialogs) {
    for (const [id, component] of Object.entries(module.dialogs)) {
      registerDialog(id, component);
    }
  }
}

export function hasCommand(name: string): boolean {
  return commands.has(name);
}

export function getCommand(name: string): CommandSpec | undefined {
  return commands.get(name);
}

export function getDialog(id: string): ComponentType | undefined {
  return dialogs.get(id);
}

export async function runCommand(name: string, params?: CommandParams): Promise<void> {
  const spec = commands.get(name);
  if (!spec) {
    return;
  }
  await spec.run(params);
}

export function resetRegistry(): void {
  commands.clear();
  dialogs.clear();
}
