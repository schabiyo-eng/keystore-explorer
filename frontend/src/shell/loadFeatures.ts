import { registerFeature } from "./registry";
import type { FeatureModule } from "./types";

const modules = import.meta.glob("../features/*/index.ts", { eager: true });

export function loadFeatures(): void {
  for (const loaded of Object.values(modules)) {
    registerFeature(loaded as FeatureModule);
  }
}

export function featureModulePaths(): string[] {
  return Object.keys(modules);
}
